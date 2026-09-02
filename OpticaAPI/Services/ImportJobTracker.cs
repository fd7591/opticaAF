using System.Collections.Concurrent;

namespace OpticaAPI.Services;

public class ImportJob
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N")[..8].ToUpper();
    public string Estado { get; set; } = "procesando";   // procesando | completado | error
    public int Total { get; set; }
    public int Procesados { get; set; }
    public int Importados { get; set; }
    public int PacientesNuevos { get; set; }
    public int PacientesExistentes { get; set; }
    public List<string> Errores { get; set; } = [];
    public DateTime Inicio { get; init; } = DateTime.Now;
    public DateTime? Fin { get; set; }
}

public class ImportJobTracker
{
    private readonly ConcurrentDictionary<string, ImportJob> _jobs = new();

    public ImportJob Create(int total)
    {
        var job = new ImportJob { Total = total };
        _jobs[job.Id] = job;
        PurgarAntiguos();
        return job;
    }

    public ImportJob? Get(string id) =>
        _jobs.TryGetValue(id.ToUpper(), out var job) ? job : null;

    private void PurgarAntiguos()
    {
        var cutoff = DateTime.Now.AddHours(-4);
        foreach (var (key, job) in _jobs)
            if (job.Inicio < cutoff) _jobs.TryRemove(key, out _);
    }
}
