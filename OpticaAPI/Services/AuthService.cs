using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class AuthService
{
    private readonly OpticaDbContext _db;
    private readonly IConfiguration _config;
    private readonly TenantContext _tenant;

    public AuthService(OpticaDbContext db, IConfiguration config, TenantContext tenant)
    {
        _db = db;
        _config = config;
        _tenant = tenant;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.Optica)
            .Include(u => u.Sucursal)
            .FirstOrDefaultAsync(u => u.NombreUsuario == dto.NombreUsuario && u.Activo);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return null;

        usuario.UltimoAcceso = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerarToken(usuario);
        var expira = DateTime.UtcNow.AddHours(8);

        return new LoginResponseDto(
            token,
            usuario.NombreUsuario,
            usuario.NombreCompleto,
            usuario.Rol,
            expira,
            usuario.OpticaId,
            usuario.SucursalId
        );
    }

    public async Task<bool> CambiarPasswordAsync(int usuarioId, CambiarPasswordDto dto)
    {
        var usuario = await _db.Usuarios.FindAsync(usuarioId);
        if (usuario is null) return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.PasswordHash))
            return false;

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevoPassword, workFactor: 12);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<UsuarioResponseDto?> CrearUsuarioAsync(CrearUsuarioDto dto)
    {
        if (await _db.Usuarios.AnyAsync(u => u.NombreUsuario == dto.NombreUsuario))
            return null;

        // Admin siempre crea usuarios dentro de su propia óptica
        var opticaId = !_tenant.IsSuperAdmin ? _tenant.OpticaId : dto.OpticaId;

        var usuario = new Usuario
        {
            NombreUsuario = dto.NombreUsuario.Trim().ToLower(),
            NombreCompleto = dto.NombreCompleto.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12),
            Rol = dto.Rol,
            OpticaId = opticaId,
            SucursalId = dto.SucursalId,
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        await _db.Entry(usuario).Reference(u => u.Optica).LoadAsync();
        await _db.Entry(usuario).Reference(u => u.Sucursal).LoadAsync();
        return MapToDto(usuario);
    }

    public async Task<List<UsuarioResponseDto>> GetUsuariosAsync()
    {
        var query = _db.Usuarios.Include(u => u.Optica).Include(u => u.Sucursal).AsQueryable();

        if (!_tenant.IsSuperAdmin)
        {
            var opticaId = _tenant.OpticaId;
            if (!opticaId.HasValue) return new List<UsuarioResponseDto>();
            // Mostrar usuarios de la óptica del admin + usuarios sin óptica asignada (excepto SuperAdmin)
            query = query.Where(u =>
                u.OpticaId == opticaId.Value ||
                (u.OpticaId == null && u.Rol != "SuperAdmin"));
        }

        return (await query.OrderBy(u => u.NombreUsuario).ToListAsync())
            .Select(MapToDto).ToList();
    }

    public async Task<bool> ToggleActivoAsync(int id, int requesterId)
    {
        if (id == requesterId) return false;
        var usuario = await _db.Usuarios.FindAsync(id);
        if (usuario is null) return false;

        // Un Admin no puede modificar usuarios de otra óptica
        if (!_tenant.IsSuperAdmin && usuario.OpticaId != _tenant.OpticaId) return false;

        usuario.Activo = !usuario.Activo;
        await _db.SaveChangesAsync();
        return true;
    }

    private string GenerarToken(Usuario usuario)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, usuario.NombreUsuario),
            new Claim("nombreCompleto", usuario.NombreCompleto),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        if (usuario.OpticaId.HasValue)
            claims.Add(new Claim("opticaId", usuario.OpticaId.Value.ToString()));
        if (usuario.SucursalId.HasValue)
            claims.Add(new Claim("sucursalId", usuario.SucursalId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static UsuarioResponseDto MapToDto(Usuario u) => new(
        u.Id,
        u.NombreUsuario,
        u.NombreCompleto,
        u.Rol,
        u.Activo,
        u.FechaCreacion,
        u.UltimoAcceso,
        u.OpticaId,
        u.SucursalId,
        u.Optica?.Nombre,
        u.Sucursal?.Nombre
    );
}
