namespace OpticaAPI.Models;

public class Graduacion
{
    public int Id { get; set; }
    public int PacienteId { get; set; }
    public Paciente Paciente { get; set; } = null!;
    public int? SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
    public int? OptometristaId { get; set; }
    public Optometrista? OptometristaNav { get; set; }
    public DateOnly Fecha { get; set; }
    public Ojo OjoDerecho { get; set; } = new();
    public Ojo OjoIzquierdo { get; set; } = new();
    public decimal? DistanciaPupilar { get; set; }
    public string? Observaciones { get; set; }
    public string? OptometristaTexto { get; set; }
    public bool Venta { get; set; } = false;
    // Material del pedido
    public string? Material { get; set; }
    public string? DisenoLente { get; set; }
    public string? Tratamiento { get; set; }
}

public class Ojo
{
    public decimal? Esfera { get; set; }
    public decimal? Cilindro { get; set; }
    public int? Eje { get; set; }
    public decimal? Adicion { get; set; }
    public string? AV { get; set; }
}
