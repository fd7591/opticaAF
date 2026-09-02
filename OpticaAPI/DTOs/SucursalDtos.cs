namespace OpticaAPI.DTOs;

public record SucursalCreateDto(
    int OpticaId,
    string Nombre,
    string? Direccion,
    string? Telefono
);

public record SucursalUpdateDto(
    string Nombre,
    string? Direccion,
    string? Telefono
);

public record SucursalResponseDto
{
    public int Id { get; init; }
    public int OpticaId { get; init; }
    public string NombreOptica { get; init; }
    public string Nombre { get; init; }
    public string? Direccion { get; init; }
    public string? Telefono { get; init; }
    public bool Activo { get; init; }
    public DateTime FechaCreacion { get; init; }
}
