namespace OpticaAPI.DTOs;

public record OjoDto
{
    public decimal? Esfera { get; init; }
    public decimal? Cilindro { get; init; }
    public int? Eje { get; init; }
    public decimal? Adicion { get; init; }
    public string? AV { get; init; }
}

public record GraduacionCreateDto(
    int PacienteId,
    DateOnly Fecha,
    OjoDto OjoDerecho,
    OjoDto OjoIzquierdo,
    decimal? DistanciaPupilar,
    string? Observaciones,
    string? Optometrista,
    int? SucursalId,
    int? OptometristaId,
    bool Venta = false,
    string? Material = null,
    string? DisenoLente = null,
    string? Tratamiento = null
);

public record GraduacionUpdateDto(
    DateOnly Fecha,
    OjoDto OjoDerecho,
    OjoDto OjoIzquierdo,
    decimal? DistanciaPupilar,
    string? Observaciones,
    string? Optometrista,
    int? SucursalId,
    int? OptometristaId,
    bool Venta = false,
    string? Material = null,
    string? DisenoLente = null,
    string? Tratamiento = null
);

public record GraduacionResponseDto
{
    public int Id { get; init; }
    public int PacienteId { get; init; }
    public string NombrePaciente { get; init; } = string.Empty;
    public string ApellidoPaciente { get; init; } = string.Empty;
    public DateOnly Fecha { get; init; }
    public OjoDto OjoDerecho { get; init; } = new();
    public OjoDto OjoIzquierdo { get; init; } = new();
    public decimal? DistanciaPupilar { get; init; }
    public string? Observaciones { get; init; }
    public string? Optometrista { get; init; }
    public int? SucursalId { get; init; }
    public string? NombreSucursal { get; init; }
    public int? OptometristaId { get; init; }
    public string? NombreOptometrista { get; init; }
    public bool Venta { get; init; }
    public string? Material { get; init; }
    public string? DisenoLente { get; init; }
    public string? Tratamiento { get; init; }
}

public record PagedResponseDto<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize
);
