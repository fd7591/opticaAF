using Microsoft.AspNetCore.Mvc;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController : ControllerBase
{
    private readonly DevSeederService _seeder;
    private readonly IWebHostEnvironment _env;

    public DevController(DevSeederService seeder, IWebHostEnvironment env)
    {
        _seeder = seeder;
        _env = env;
    }

    /// <summary>
    /// Seed 100 patients with expedientes and graduaciones. Only available in Development.
    /// </summary>
    [HttpPost("seed-pacientes")]
    public async Task<IActionResult> SeedPacientes([FromQuery] int opticaId = 1, [FromQuery] int sucursalId = 1)
    {
        if (!_env.IsDevelopment())
            return NotFound();

        var (pacientes, expedientes, graduaciones) = await _seeder.SeedAsync(opticaId, sucursalId);
        return Ok(new
        {
            message = "Seed completado.",
            pacientesCreados = pacientes,
            expedientesCreados = expedientes,
            graduacionesCreadas = graduaciones,
        });
    }
}
