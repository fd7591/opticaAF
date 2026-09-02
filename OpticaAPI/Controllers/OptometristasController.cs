using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticaAPI.DTOs;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OptometristasController : ControllerBase
{
    private readonly OptometristaService _service;

    public OptometristasController(OptometristaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? sucursalId) =>
        Ok(await _service.GetAllAsync(sucursalId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] OptometristaCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Apellido))
            return BadRequest(new { error = "Nombre y apellido son requeridos." });
        var result = await _service.CreateAsync(dto);
        return result is null
            ? Forbid()
            : CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] OptometristaUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/toggle")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Toggle(int id)
    {
        var ok = await _service.ToggleActivoAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
