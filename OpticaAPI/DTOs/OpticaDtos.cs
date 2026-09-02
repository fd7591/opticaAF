namespace OpticaAPI.DTOs;

public record OpticaCreateDto(
    string Nombre,
    string? RazonSocial,
    string? Telefono,
    string? Email
);

public record OpticaUpdateDto(
    string Nombre,
    string? RazonSocial,
    string? Telefono,
    string? Email
);

public record OpticaResponseDto {
    public int Id { get; init; }
    public string Nombre { get; init; }
    public string? RazonSocial { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public bool Activo { get; init; }
    public DateTime FechaCreacion  { get; init; }
}
