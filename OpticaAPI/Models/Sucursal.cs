namespace OpticaAPI.Models;

public class Sucursal
{
    public int Id { get; set; }
    public int OpticaId { get; set; }
    public Optica Optica { get; set; } = null!;
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Optometrista> Optometristas { get; set; } = new List<Optometrista>();
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
    public ICollection<Graduacion> Graduaciones { get; set; } = new List<Graduacion>();
}
