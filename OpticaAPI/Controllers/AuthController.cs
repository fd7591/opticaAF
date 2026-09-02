using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OpticaAPI.DTOs;
using OpticaAPI.Services;

namespace OpticaAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;

    public AuthController(AuthService service) => _service = service;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _service.LoginAsync(dto);
        if (result is null)
            return Unauthorized(new { error = "Usuario o contraseña incorrectos." });
        return Ok(result);
    }

    [HttpPost("cambiar-password")]
    [Authorize]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var ok = await _service.CambiarPasswordAsync(userId, dto);
        return ok ? NoContent() : BadRequest(new { error = "La contraseña actual es incorrecta." });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            nombreUsuario = User.FindFirstValue(ClaimTypes.Name),
            nombreCompleto = User.FindFirstValue("nombreCompleto"),
            rol = User.FindFirstValue(ClaimTypes.Role),
            opticaId = User.FindFirstValue("opticaId"),
            sucursalId = User.FindFirstValue("sucursalId"),
        });
    }

    // ----- Administración de usuarios (Admin y SuperAdmin) -----

    [HttpGet("usuarios")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetUsuarios()
    {
        var list = await _service.GetUsuariosAsync();
        return Ok(list);
    }

    [HttpPost("usuarios")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreUsuario) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Nombre de usuario y contraseña son requeridos." });

        if (dto.Password.Length < 8)
            return BadRequest(new { error = "La contraseña debe tener al menos 8 caracteres." });

        var callerRole = User.FindFirstValue(ClaimTypes.Role);
        var rolesValidos = callerRole == "SuperAdmin"
            ? new[] { "SuperAdmin", "Admin", "Operador" }
            : new[] { "Admin", "Operador" };

        if (!rolesValidos.Contains(dto.Rol))
            return BadRequest(new { error = $"Rol inválido. Use: {string.Join(", ", rolesValidos)}." });

        var result = await _service.CrearUsuarioAsync(dto);
        return result is null
            ? Conflict(new { error = "El nombre de usuario ya existe." })
            : Ok(result);
    }

    [HttpPatch("usuarios/{id:int}/toggle")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ToggleActivo(int id)
    {
        var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var ok = await _service.ToggleActivoAsync(id, requesterId);
        return ok ? NoContent() : BadRequest(new { error = "No puedes desactivarte a ti mismo." });
    }
}
