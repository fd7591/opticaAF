namespace OpticaAPI.Models;

public class Paciente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public DateOnly? FechaNacimiento { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? FechaEliminacion { get; set; }
    public int? OpticaId { get; set; }
    public Optica? Optica { get; set; }
    public ICollection<Graduacion> Graduaciones { get; set; } = new List<Graduacion>();
}
