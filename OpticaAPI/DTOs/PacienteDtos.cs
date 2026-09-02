namespace OpticaAPI.DTOs;

public record PacienteCreateDto(
    string Nombre,
    string Apellido,
    DateOnly? FechaNacimiento,
    string? Telefono,
    string? Email
);

public record PacienteUpdateDto(
    string Nombre,
    string Apellido,
    DateOnly? FechaNacimiento,
    string? Telefono,
    string? Email
);

public record PacienteResponseDto
{
    public int Id { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string Apellido { get; init; } = string.Empty;
    public DateOnly? FechaNacimiento { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public DateTime FechaCreacion { get; init; }
    public int TotalGraduaciones { get; init; }
}

public record ExpedienteUpdateDto(
    string? Ocupacion,
    string? Alergias,
    string? EnfermedadesSistemicas,
    string? MedicamentosActuales,
    string? AntecedentesFamiliares,
    string? Observaciones
);

public record ExpedienteResponseDto
{
    public string? Ocupacion { get; init; }
    public string? Alergias { get; init; }
    public string? EnfermedadesSistemicas { get; init; }
    public string? MedicamentosActuales { get; init; }
    public string? AntecedentesFamiliares { get; init; }
    public string? Observaciones { get; init; }
    public DateTime FechaActualizacion { get; init; }
}
