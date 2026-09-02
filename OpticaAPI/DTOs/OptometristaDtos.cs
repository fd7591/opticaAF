namespace OpticaAPI.DTOs;

public record OptometristaCreateDto(
    int SucursalId,
    string Nombre,
    string Apellido,
    string? Cedula,
    string? Telefono,
    string? Email
);

public record OptometristaUpdateDto(
    string Nombre,
    string Apellido,
    string? Cedula,
    string? Telefono,
    string? Email
);

public record OptometristaResponseDto {
    public int Id { get; init; }
    public int SucursalId  { get; init; }
    public string NombreSucursal { get; init; }
    public string Nombre  { get; init; }  
    public string Apellido { get; init; }
    public string? Cedula { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public bool Activo { get; init; }
    public DateTime FechaCreacion { get; init; }  
}
