namespace OpticaAPI.DTOs;

public record ImportResultDto(
    int TotalFilas,
    int Importados,
    int Omitidos,
    List<ImportRowErrorDto> Errores
);

public record ImportPegarRowDto(
    string NombreCompleto,
    decimal? OD_Esfera,
    decimal? OD_Cilindro,
    int? OD_Eje,
    decimal? OI_Esfera,
    decimal? OI_Cilindro,
    int? OI_Eje,
    decimal? Adicion,
    string? Observaciones
);

public record ImportPegarRequestDto(string? Fecha, List<ImportPegarRowDto> Filas);

public record ImportRowErrorDto(
    int Fila,
    string Columna,
    string Mensaje
);

public class ImportCsvRow
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? FechaNacimiento { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string FechaGraduacion { get; set; } = string.Empty;
    public decimal? OD_Esfera { get; set; }
    public decimal? OD_Cilindro { get; set; }
    public int? OD_Eje { get; set; }
    public decimal? OD_Adicion { get; set; }
    public string? OD_AV { get; set; }
    public decimal? OI_Esfera { get; set; }
    public decimal? OI_Cilindro { get; set; }
    public int? OI_Eje { get; set; }
    public decimal? OI_Adicion { get; set; }
    public string? OI_AV { get; set; }
    public decimal? DistanciaPupilar { get; set; }
    public string? Observaciones { get; set; }
    public string? Optometrista { get; set; }
}
