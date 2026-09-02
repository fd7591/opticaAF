using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticaAPI.DTOs;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class SucursalesController : ControllerBase
{
    private readonly SucursalService _service;

    public SucursalesController(SucursalService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? opticaId) =>
        Ok(await _service.GetAllAsync(opticaId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SucursalCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return BadRequest(new { error = "El nombre es requerido." });
        var result = await _service.CreateAsync(dto);
        return result is null
            ? Forbid()
            : CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SucursalUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var ok = await _service.ToggleActivoAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
