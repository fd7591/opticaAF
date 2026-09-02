namespace OpticaAPI.Models;

public class Optica
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? RazonSocial { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Sucursal> Sucursales { get; set; } = new List<Sucursal>();
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Paciente> Pacientes { get; set; } = new List<Paciente>();
}
