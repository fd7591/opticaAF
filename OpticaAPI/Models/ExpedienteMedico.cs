namespace OpticaAPI.Models;

public class ExpedienteMedico
{
    public int Id { get; set; }
    public int PacienteId { get; set; }
    public Paciente Paciente { get; set; } = null!;
    public string? Ocupacion { get; set; }
    public string? Alergias { get; set; }
    public string? EnfermedadesSistemicas { get; set; }
    public string? MedicamentosActuales { get; set; }
    public string? AntecedentesFamiliares { get; set; }
    public string? Observaciones { get; set; }
    public DateTime FechaActualizacion { get; set; }
}
