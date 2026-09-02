namespace OpticaAPI.Models;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = "Operador"; // SuperAdmin | Admin | Operador
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoAcceso { get; set; }
    public int? OpticaId { get; set; }
    public Optica? Optica { get; set; }
    public int? SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
}
