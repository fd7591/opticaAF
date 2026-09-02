using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticaAPI.DTOs;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly ImportService _service;
    private readonly ImportJobTracker _jobTracker;
    private readonly IServiceScopeFactory _scopeFactory;

    public ImportController(ImportService service, ImportJobTracker jobTracker, IServiceScopeFactory scopeFactory)
    {
        _service = service;
        _jobTracker = jobTracker;
        _scopeFactory = scopeFactory;
    }

    [HttpPost("csv")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ImportCsv(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo CSV requerido." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".csv" && ext != ".txt")
            return BadRequest(new { error = "Solo se aceptan archivos .csv" });

        using var stream = file.OpenReadStream();
        var result = await _service.ImportCsvAsync(stream);
        return Ok(result);
    }

    [HttpPost("pegar")]
    public async Task<IActionResult> ImportPegar([FromBody] ImportPegarRequestDto request)
    {
        if (request?.Filas is null || request.Filas.Count == 0)
            return BadRequest(new { error = "No hay filas para importar." });

        var result = await _service.ImportPegarAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Inicia la importación masiva de un xlsx en background.
    /// Devuelve inmediatamente con el jobId para hacer polling.
    /// </summary>
    [HttpPost("xlsx")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
    public async Task<IActionResult> ImportXlsx(
        IFormFile file,
        [FromQuery] int? sucursalId,
        [FromQuery] int? optometristaId,
        [FromQuery] string? optometristaTexto)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Archivo xlsx requerido." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx")
            return BadRequest(new { error = "Solo se aceptan archivos .xlsx" });

        // Leer el archivo en memoria ANTES de que el request finalice
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        ms.Position = 0;

        List<(string, string)> rows;
        try
        {
            rows = ImportService.ReadXlsxRows(ms);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"No se pudo leer el archivo: {ex.Message}" });
        }

        if (rows.Count == 0)
            return BadRequest(new { error = "El archivo no contiene filas de datos." });

        // Capturar datos del tenant ANTES de salir del request scope
        var tenant = HttpContext.RequestServices.GetRequiredService<TenantContext>();
        var opticaId = tenant.IsSuperAdmin ? (int?)null : tenant.OpticaId;

        var job = _jobTracker.Create(rows.Count);

        // Lanzar background task con su propio scope de DI
        _ = Task.Run(async () =>
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var svc = scope.ServiceProvider.GetRequiredService<ImportService>();
            await svc.ProcessXlsxJobAsync(job, rows, opticaId, sucursalId, optometristaId, optometristaTexto, _jobTracker);
        });

        return Ok(new { jobId = job.Id, total = rows.Count });
    }

    /// <summary>
    /// Consulta el estado de un job de importación.
    /// </summary>
    [HttpGet("job/{id}")]
    public IActionResult GetJob(string id)
    {
        var job = _jobTracker.Get(id);
        if (job is null) return NotFound(new { error = "Job no encontrado." });

        return Ok(new
        {
            job.Id,
            job.Estado,
            job.Total,
            job.Procesados,
            job.Importados,
            job.PacientesNuevos,
            job.PacientesExistentes,
            job.Errores,
            job.Inicio,
            job.Fin,
            PorcentajeCompletado = job.Total > 0
                ? (int)Math.Round((double)job.Procesados / job.Total * 100)
                : 0,
        });
    }

    [HttpGet("plantilla")]
    public IActionResult DownloadTemplate()
    {
        var bytes = _service.GenerateCsvTemplate();
        return File(bytes, "text/csv; charset=utf-8", "plantilla_graduaciones.csv");
    }
}
