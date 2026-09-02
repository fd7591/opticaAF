namespace OpticaAPI.Models;

public class Optometrista
{
    public int Id { get; set; }
    public int SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? Cedula { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<Graduacion> Graduaciones { get; set; } = new List<Graduacion>();
}
