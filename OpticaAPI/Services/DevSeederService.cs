using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class DevSeederService
{
    private readonly OpticaDbContext _db;

    public DevSeederService(OpticaDbContext db) => _db = db;

    private static readonly string[] Nombres =
    [
        "Lucía", "Valentina", "Camila", "Sofía", "Martina", "Isabella", "Florencia", "Agustina",
        "Juliana", "Romina", "Micaela", "Natalia", "Daniela", "Carolina", "Paola",
        "Matías", "Lucas", "Tomás", "Santiago", "Nicolás", "Agustín", "Facundo", "Ezequiel",
        "Leandro", "Rodrigo", "Gonzalo", "Federico", "Sebastián", "Ignacio", "Maximiliano",
        "Ana", "Laura", "María", "Claudia", "Patricia", "Susana", "Verónica", "Adriana",
        "Carlos", "Jorge", "Roberto", "Miguel", "Ricardo", "Sergio", "Pablo", "Gustavo",
    ];

    private static readonly string[] Apellidos =
    [
        "García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez",
        "Ramírez", "Torres", "Flores", "Rivera", "Herrera", "Medina", "Castro", "Ortiz",
        "Álvarez", "Romero", "Morales", "Jiménez", "Ruiz", "Díaz", "Vega", "Cruz",
        "Reyes", "Mendoza", "Ríos", "Rojas", "Núñez", "Gutiérrez", "Vargas",
        "Fernández", "Suárez", "Molina", "Acosta", "Benítez", "Cabrera", "Heredia",
        "Quispe", "Mamani", "Salazar", "Villalba", "Leiva", "Correa", "Carrillo",
    ];

    private static readonly string[] Ocupaciones =
    [
        "Docente", "Contador/a", "Médico/a", "Ingeniero/a", "Abogado/a",
        "Enfermero/a", "Administrativo/a", "Comerciante", "Chofer / Transporte",
        "Programador/a", "Estudiante", "Jubilado/a", "Ama/o de casa",
        "Arquitecto/a", "Diseñador/a",
    ];

    private static readonly string[] CatalogoAlergias =
    [
        "Ninguna conocida", "Penicilina", "Amoxicilina", "Aspirina / AAS",
        "Ibuprofeno", "Polen", "Ácaros del polvo", "Látex", "Mariscos",
    ];

    private static readonly string[] CatalogoEnfermedades =
    [
        "Diabetes tipo 2", "Hipertensión arterial", "Hipotiroidismo",
        "Artritis reumatoide", "Asma", "Enfermedad cardiovascular", "Anemia",
    ];

    private static readonly string[] CatalogoAntecedentes =
    [
        "Ninguno conocido", "Glaucoma", "Cataratas", "Degeneración macular",
        "Miopía alta", "Queratocono", "Estrabismo", "Ambliopía (ojo vago)",
    ];

    private static readonly string[] Medicamentos =
    [
        "Metformina 500mg", "Losartán 50mg", "Levotiroxina 50mcg", "Enalapril 10mg",
        "Atorvastatina 20mg", "Omeprazol 20mg", "Amlodipina 5mg", "Metoprolol 50mg",
        "Aspirina 100mg", "Salbutamol inhalador",
    ];

    private static readonly string[] AV = ["20/20", "20/25", "20/30", "20/40", "20/50"];

    public async Task<(int pacientes, int expedientes, int graduaciones)> SeedAsync(int opticaId, int sucursalId)
    {
        var rng = new Random(42);
        int pCount = 0, eCount = 0, gCount = 0;

        for (int i = 0; i < 100; i++)
        {
            var nombre = Nombres[rng.Next(Nombres.Length)];
            var apellido = Apellidos[rng.Next(Apellidos.Length)];

            // Skip if already exists (by name + opticaId)
            var exists = await _db.Pacientes.IgnoreQueryFilters()
                .AnyAsync(p => p.Nombre == nombre && p.Apellido == apellido && p.OpticaId == opticaId);
            if (exists) continue;

            var nacimientoBase = DateTime.UtcNow.AddYears(-rng.Next(18, 80));
            var nacimiento = DateOnly.FromDateTime(nacimientoBase.AddDays(rng.Next(-180, 180)));

            var paciente = new Paciente
            {
                Nombre = nombre,
                Apellido = apellido,
                FechaNacimiento = nacimiento,
                Telefono = $"+54 9 {rng.Next(11, 30):D2} {rng.Next(1000, 9999)}-{rng.Next(1000, 9999)}",
                Email = $"{nombre.ToLower().Replace("/", "").Replace(" ", "")}.{apellido.ToLower().Replace("á","a").Replace("é","e").Replace("í","i").Replace("ó","o").Replace("ú","u").Replace("ñ","n")}@email.com",
                OpticaId = opticaId,
                FechaCreacion = DateTime.UtcNow.AddDays(-rng.Next(0, 730)),
            };
            _db.Pacientes.Add(paciente);
            await _db.SaveChangesAsync();
            pCount++;

            // Expediente (80% of patients have one)
            if (rng.Next(100) < 80)
            {
                var alergiasSelec = PickRandom(rng, CatalogoAlergias, rng.Next(0, 3));
                var enfermedadesSelec = PickRandom(rng, CatalogoEnfermedades, rng.Next(0, 3));
                var antecedentesSelec = PickRandom(rng, CatalogoAntecedentes, rng.Next(0, 3));
                var tieneEnf = enfermedadesSelec.Length > 0;

                var expediente = new ExpedienteMedico
                {
                    PacienteId = paciente.Id,
                    Ocupacion = Ocupaciones[rng.Next(Ocupaciones.Length)],
                    Alergias = alergiasSelec.Length > 0 ? string.Join(", ", alergiasSelec) : null,
                    EnfermedadesSistemicas = enfermedadesSelec.Length > 0 ? string.Join(", ", enfermedadesSelec) : null,
                    MedicamentosActuales = tieneEnf ? Medicamentos[rng.Next(Medicamentos.Length)] : null,
                    AntecedentesFamiliares = antecedentesSelec.Length > 0 ? string.Join(", ", antecedentesSelec) : null,
                    Observaciones = rng.Next(100) < 30 ? "Paciente colaborador. Sin antecedentes quirúrgicos oculares." : null,
                    FechaActualizacion = DateTime.UtcNow.AddDays(-rng.Next(0, 365)),
                };
                _db.Expedientes.Add(expediente);
                await _db.SaveChangesAsync();
                eCount++;
            }

            // Graduaciones: 1 a 4 por paciente
            int numGrads = rng.Next(1, 5);
            var baseDate = DateTime.UtcNow.AddYears(-3);
            for (int g = 0; g < numGrads; g++)
            {
                var fechaGrad = DateOnly.FromDateTime(baseDate.AddDays(rng.Next(0, 1095)));

                var grad = new Graduacion
                {
                    PacienteId = paciente.Id,
                    SucursalId = sucursalId,
                    Fecha = fechaGrad,
                    OjoDerecho = GenerateOjo(rng),
                    OjoIzquierdo = GenerateOjo(rng),
                    DistanciaPupilar = (decimal)(rng.Next(580, 680) / 10.0),
                    Observaciones = rng.Next(100) < 40 ? "Control anual. Sin cambios significativos." : null,
                    OptometristaTexto = rng.Next(2) == 0 ? "Dra. López" : "Dr. Fernández",
                };
                _db.Graduaciones.Add(grad);
                gCount++;
            }
            await _db.SaveChangesAsync();
        }

        return (pCount, eCount, gCount);
    }

    private static Ojo GenerateOjo(Random rng)
    {
        // Realistic prescription values
        var esferaOptions = new[] { -5m, -4m, -3.5m, -3m, -2.5m, -2m, -1.75m, -1.5m, -1.25m, -1m, -0.75m, -0.5m, -0.25m, 0m, 0.25m, 0.5m, 0.75m, 1m, 1.5m, 2m };
        var cilindroOptions = new[] { 0m, -0.25m, -0.5m, -0.75m, -1m, -1.25m, -1.5m, -2m, -2.5m };
        var ejeOptions = new[] { 10, 20, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180 };
        var adicionOptions = new[] { (decimal?)null, null, null, 1.00m, 1.25m, 1.50m, 1.75m, 2.00m, 2.25m, 2.50m };
        var avOptions = new[] { "20/20", "20/25", "20/30", "20/40" };

        var cilindro = cilindroOptions[rng.Next(cilindroOptions.Length)];
        return new Ojo
        {
            Esfera = esferaOptions[rng.Next(esferaOptions.Length)],
            Cilindro = cilindro != 0 ? cilindro : null,
            Eje = cilindro != 0 ? ejeOptions[rng.Next(ejeOptions.Length)] : null,
            Adicion = adicionOptions[rng.Next(adicionOptions.Length)],
            AV = avOptions[rng.Next(avOptions.Length)],
        };
    }

    private static string[] PickRandom(Random rng, string[] source, int count)
    {
        if (count == 0) return [];
        return source.OrderBy(_ => rng.Next()).Take(count).ToArray();
    }
}
