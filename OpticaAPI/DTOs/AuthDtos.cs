namespace OpticaAPI.DTOs;

public record LoginRequestDto(string NombreUsuario, string Password);

public record LoginResponseDto(
    string Token,
    string NombreUsuario,
    string NombreCompleto,
    string Rol,
    DateTime Expira,
    int? OpticaId,
    int? SucursalId
);

public record CambiarPasswordDto(string PasswordActual, string NuevoPassword);

public record UsuarioResponseDto(
    int Id,
    string NombreUsuario,
    string NombreCompleto,
    string Rol,
    bool Activo,
    DateTime FechaCreacion,
    DateTime? UltimoAcceso,
    int? OpticaId,
    int? SucursalId,
    string? NombreOptica,
    string? NombreSucursal
);

public record CrearUsuarioDto(
    string NombreUsuario,
    string NombreCompleto,
    string Password,
    string Rol,
    int? OpticaId,
    int? SucursalId
);
