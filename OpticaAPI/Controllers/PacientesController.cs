using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticaAPI.DTOs;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PacientesController : ControllerBase
{
    private readonly PacienteService _service;
    private readonly GraduacionService _graduacionService;

    public PacientesController(PacienteService service, GraduacionService graduacionService)
    {
        _service = service;
        _graduacionService = graduacionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;
        var result = await _service.GetAllAsync(search, page, pageSize, sortBy, sortDir);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:int}/graduaciones")]
    public async Task<IActionResult> GetGraduaciones(int id)
    {
        var result = await _graduacionService.GetByPacienteAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PacienteCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PacienteUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("{id:int}/expediente")]
    public async Task<IActionResult> GetExpediente(int id)
    {
        var result = await _service.GetExpedienteAsync(id);
        if (result is null)
        {
            var exists = await _service.GetByIdAsync(id);
            return exists is null ? NotFound() : NoContent();
        }
        return Ok(result);
    }

    [HttpPut("{id:int}/expediente")]
    public async Task<IActionResult> UpsertExpediente(int id, [FromBody] ExpedienteUpdateDto dto)
    {
        var result = await _service.UpsertExpedienteAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }
}
