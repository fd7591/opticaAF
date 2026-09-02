using System.Globalization;
using System.Text.RegularExpressions;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class ImportService
{
    private readonly OpticaDbContext _db;
    private readonly TenantContext _tenant;

    public ImportService(OpticaDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<ImportResultDto> ImportCsvAsync(Stream stream)
    {
        var errors = new List<ImportRowErrorDto>();
        var rows = new List<ImportCsvRow>();
        int rowNum = 1;

        using var reader = new StreamReader(stream);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            BadDataFound = null,
            TrimOptions = TrimOptions.Trim,
            Delimiter = DetectDelimiter(stream)
        };

        try
        {
            using var csv = new CsvReader(reader, config);
            await foreach (var row in csv.GetRecordsAsync<ImportCsvRow>())
            {
                rowNum++;
                var rowErrors = ValidateRow(row, rowNum);
                if (rowErrors.Any())
                    errors.AddRange(rowErrors);
                else
                    rows.Add(row);
            }
        }
        catch (Exception ex)
        {
            errors.Add(new ImportRowErrorDto(rowNum, "Archivo", $"Error al leer CSV: {ex.Message}"));
        }

        int imported = 0;
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var opticaId = _tenant.IsSuperAdmin ? (int?)null : _tenant.RequireOpticaId();
            var sucursalId = _tenant.SucursalId;

            foreach (var row in rows)
            {
                var paciente = await FindOrCreatePacienteAsync(row, opticaId);
                var grad = BuildGraduacion(row, paciente.Id, sucursalId);
                _db.Graduaciones.Add(grad);
                imported++;
            }
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            errors.Add(new ImportRowErrorDto(0, "Base de datos", $"Error al guardar: {ex.Message}"));
            imported = 0;
        }

        return new ImportResultDto(rowNum - 1, imported, errors.Count, errors);
    }

    private static string DetectDelimiter(Stream stream)
    {
        stream.Position = 0;
        using var r = new StreamReader(stream, leaveOpen: true);
        var firstLine = r.ReadLine() ?? "";
        stream.Position = 0;
        return firstLine.Contains(';') ? ";" : ",";
    }

    private static List<ImportRowErrorDto> ValidateRow(ImportCsvRow row, int rowNum)
    {
        var errors = new List<ImportRowErrorDto>();

        if (string.IsNullOrWhiteSpace(row.Nombre))
            errors.Add(new ImportRowErrorDto(rowNum, "Nombre", "El nombre es obligatorio"));
        if (string.IsNullOrWhiteSpace(row.Apellido))
            errors.Add(new ImportRowErrorDto(rowNum, "Apellido", "El apellido es obligatorio"));
        if (string.IsNullOrWhiteSpace(row.FechaGraduacion) ||
            !DateOnly.TryParseExact(row.FechaGraduacion, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out _))
            errors.Add(new ImportRowErrorDto(rowNum, "FechaGraduacion", "Fecha inválida, use dd/MM/yyyy"));
        if (row.OD_Eje.HasValue && (row.OD_Eje < 0 || row.OD_Eje > 180))
            errors.Add(new ImportRowErrorDto(rowNum, "OD_Eje", "Eje debe ser entre 0 y 180"));
        if (row.OI_Eje.HasValue && (row.OI_Eje < 0 || row.OI_Eje > 180))
            errors.Add(new ImportRowErrorDto(rowNum, "OI_Eje", "Eje debe ser entre 0 y 180"));

        return errors;
    }

    private async Task<Paciente> FindOrCreatePacienteAsync(ImportCsvRow row, int? opticaId)
    {
        DateOnly? fechaNac = null;
        if (!string.IsNullOrWhiteSpace(row.FechaNacimiento) &&
            DateOnly.TryParseExact(row.FechaNacimiento, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var fn))
            fechaNac = fn;

        var query = _db.Pacientes.IgnoreQueryFilters().AsQueryable();
        if (opticaId.HasValue)
            query = query.Where(p => p.OpticaId == opticaId);

        var paciente = await query.FirstOrDefaultAsync(p =>
            p.Nombre.ToLower() == row.Nombre.ToLower() &&
            p.Apellido.ToLower() == row.Apellido.ToLower() &&
            p.FechaNacimiento == fechaNac &&
            !p.IsDeleted);

        if (paciente is null)
        {
            paciente = new Paciente
            {
                Nombre = row.Nombre.Trim(),
                Apellido = row.Apellido.Trim(),
                FechaNacimiento = fechaNac,
                Telefono = row.Telefono?.Trim(),
                Email = row.Email?.Trim(),
                OpticaId = opticaId,
            };
            _db.Pacientes.Add(paciente);
            await _db.SaveChangesAsync();
        }

        return paciente;
    }

    private static Graduacion BuildGraduacion(ImportCsvRow row, int pacienteId, int? sucursalId)
    {
        DateOnly.TryParseExact(row.FechaGraduacion, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out var fecha);

        return new Graduacion
        {
            PacienteId = pacienteId,
            Fecha = fecha,
            SucursalId = sucursalId,
            OjoDerecho = new Ojo
            {
                Esfera = row.OD_Esfera,
                Cilindro = row.OD_Cilindro,
                Eje = row.OD_Eje,
                Adicion = row.OD_Adicion,
                AV = row.OD_AV
            },
            OjoIzquierdo = new Ojo
            {
                Esfera = row.OI_Esfera,
                Cilindro = row.OI_Cilindro,
                Eje = row.OI_Eje,
                Adicion = row.OI_Adicion,
                AV = row.OI_AV
            },
            DistanciaPupilar = row.DistanciaPupilar,
            Observaciones = row.Observaciones,
            OptometristaTexto = row.Optometrista
        };
    }

    public async Task<ImportResultDto> ImportPegarAsync(ImportPegarRequestDto request)
    {
        var errors = new List<ImportRowErrorDto>();
        int imported = 0;

        DateOnly fecha = DateOnly.FromDateTime(DateTime.Today);
        if (!string.IsNullOrWhiteSpace(request.Fecha) &&
            DateOnly.TryParseExact(request.Fecha, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var fechaParsed))
            fecha = fechaParsed;

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var opticaId = _tenant.IsSuperAdmin ? (int?)null : _tenant.RequireOpticaId();
            var sucursalId = _tenant.SucursalId;

            for (int i = 0; i < request.Filas.Count; i++)
            {
                var fila = request.Filas[i];
                var rowNum = i + 1;

                if (string.IsNullOrWhiteSpace(fila.NombreCompleto))
                {
                    errors.Add(new ImportRowErrorDto(rowNum, "Nombre", "Nombre requerido"));
                    continue;
                }

                var (paciente, _) = await FindOrCreatePacientePorNombreAsync(fila.NombreCompleto.Trim(), opticaId);

                _db.Graduaciones.Add(new Graduacion
                {
                    PacienteId = paciente.Id,
                    Fecha = fecha,
                    SucursalId = sucursalId,
                    OjoDerecho = new Ojo
                    {
                        Esfera = fila.OD_Esfera,
                        Cilindro = fila.OD_Cilindro,
                        Eje = fila.OD_Eje,
                        Adicion = fila.Adicion,
                    },
                    OjoIzquierdo = new Ojo
                    {
                        Esfera = fila.OI_Esfera,
                        Cilindro = fila.OI_Cilindro,
                        Eje = fila.OI_Eje,
                        Adicion = fila.Adicion,
                    },
                    Observaciones = fila.Observaciones,
                });
                imported++;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            errors.Add(new ImportRowErrorDto(0, "Base de datos", $"Error al guardar: {ex.Message}"));
            imported = 0;
        }

        return new ImportResultDto(request.Filas.Count, imported, errors.Count, errors);
    }

    private async Task<(Paciente paciente, bool esNuevo)> FindOrCreatePacientePorNombreAsync(string nombreCompleto, int? opticaId)
    {
        var partes = nombreCompleto.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var nombre = partes[0];
        var apellido = partes.Length > 1 ? partes[1] : "";
        var nombreLower = nombre.ToLower();
        var apellidoLower = apellido.ToLower();

        var query = _db.Pacientes.IgnoreQueryFilters().AsQueryable();
        if (opticaId.HasValue)
            query = query.Where(p => p.OpticaId == opticaId);

        var paciente = await query.FirstOrDefaultAsync(p =>
            !p.IsDeleted &&
            p.Nombre.ToLower() == nombreLower &&
            p.Apellido.ToLower() == apellidoLower);

        if (paciente is not null)
            return (paciente, false);

        paciente = new Paciente
        {
            Nombre = nombre,
            Apellido = apellido,
            OpticaId = opticaId,
        };
        _db.Pacientes.Add(paciente);
        await _db.SaveChangesAsync();
        return (paciente, true);
    }

    public byte[] GenerateCsvTemplate()
    {
        var header = "Nombre,Apellido,FechaNacimiento,Telefono,Email,FechaGraduacion,OD_Esfera,OD_Cilindro,OD_Eje,OD_Adicion,OD_AV,OI_Esfera,OI_Cilindro,OI_Eje,OI_Adicion,OI_AV,DistanciaPupilar,Observaciones,Optometrista";
        var example = "Juan,García,15/03/1985,+541155551234,jgarcia@email.com,01/04/2026,-1.75,-0.50,170,,20/20,-2.00,-0.25,10,,20/25,62.5,Revisión anual,Dra. López";
        var content = header + "\n" + example + "\n";
        return System.Text.Encoding.UTF8.GetBytes(content);
    }

    // ─── XLSX / BACKGROUND IMPORT ─────────────────────────────────────────────

    /// <summary>
    /// Lee el xlsx y devuelve lista de (nombreCompleto, prescripcionTexto).
    /// Soporta 2 columnas (nombre | prescripción) o 1 columna (nombre + 2+ espacios + prescripción).
    /// </summary>
    public static List<(string Nombre, string Presc)> ReadXlsxRows(Stream stream)
    {
        var result = new List<(string, string)>();
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheet(1);
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;

        for (int r = 1; r <= lastRow; r++)
        {
            var col1 = ws.Cell(r, 1).GetString().Trim();
            var col2 = ws.Cell(r, 2).GetString().Trim();

            if (string.IsNullOrWhiteSpace(col1)) continue;

            // Saltar fila de encabezado (contiene "nombre" o "paciente")
            if (r == 1 && (col1.Contains("nombre", StringComparison.OrdinalIgnoreCase) ||
                           col1.Contains("paciente", StringComparison.OrdinalIgnoreCase)))
                continue;

            string nombre, presc;
            if (!string.IsNullOrWhiteSpace(col2))
            {
                // 2 columnas: A=nombre, B=prescripción
                nombre = col1;
                presc = col2;
            }
            else
            {
                // 1 columna: separar por 2+ espacios o tab
                var parts = Regex.Split(col1, @"\t|\s{2,}", RegexOptions.None, TimeSpan.FromSeconds(1));
                nombre = parts[0].Trim();
                presc = parts.Length > 1 ? string.Join(" ", parts[1..]).Trim() : string.Empty;
            }

            if (!string.IsNullOrWhiteSpace(nombre))
                result.Add((nombre, presc));
        }

        return result;
    }

    /// <summary>
    /// Procesa el job en background. Cada fila se guarda de forma independiente
    /// para que un dato inválido no revierta toda la importación.
    /// </summary>
    public async Task ProcessXlsxJobAsync(
        ImportJob job,
        List<(string Nombre, string Presc)> rows,
        int? opticaId,
        int? sucursalId,
        int? optometristaId,
        string? optometristaTexto,
        ImportJobTracker tracker)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);

        try
        {
            for (int i = 0; i < rows.Count; i++)
            {
                var (nombreCompleto, prescTexto) = rows[i];

                try
                {
                    var (paciente, esNuevo) = await FindOrCreatePacientePorNombreAsync(nombreCompleto, opticaId);
                    var presc = ParsePrescripcion(prescTexto);

                    _db.Graduaciones.Add(new Graduacion
                    {
                        PacienteId = paciente.Id,
                        Fecha = today,
                        SucursalId = sucursalId,
                        OptometristaId = optometristaId,
                        OptometristaTexto = optometristaTexto,
                        OjoDerecho = new Ojo
                        {
                            Esfera   = ClampEsfera(presc.OD_Esfera),
                            Cilindro = ClampEsfera(presc.OD_Cilindro),
                            Eje      = presc.OD_Eje,
                            Adicion  = ClampAdicion(presc.Adicion),
                        },
                        OjoIzquierdo = new Ojo
                        {
                            Esfera   = ClampEsfera(presc.OI_Esfera),
                            Cilindro = ClampEsfera(presc.OI_Cilindro),
                            Eje      = presc.OI_Eje,
                            Adicion  = ClampAdicion(presc.Adicion),
                        },
                        Observaciones = presc.Observaciones,
                    });

                    await _db.SaveChangesAsync();

                    job.Importados++;
                    if (esNuevo) job.PacientesNuevos++;
                    else job.PacientesExistentes++;
                }
                catch (Exception ex)
                {
                    // Descartar entidades pendientes para no contaminar el contexto
                    foreach (var entry in _db.ChangeTracker.Entries()
                                             .Where(e => e.State == EntityState.Added)
                                             .ToList())
                        entry.State = EntityState.Detached;

                    var inner = ex.InnerException?.Message ?? ex.Message;
                    job.Errores.Add($"Fila {i + 1} ({nombreCompleto}): {inner}");
                }

                job.Procesados = i + 1;
            }

            job.Estado = "completado";
        }
        catch (Exception ex)
        {
            job.Estado = "error";
            job.Errores.Add($"Error inesperado: {ex.Message}");
        }
        finally
        {
            job.Fin = DateTime.Now;
            job.Procesados = rows.Count;
        }
    }

    // Limita esfera/cilindro al rango que acepta DECIMAL(5,2): ±999.99
    private static decimal? ClampEsfera(decimal? v) =>
        v.HasValue ? Math.Clamp(v.Value, -999.99m, 999.99m) : null;

    // Limita adición al rango que acepta DECIMAL(4,2): ±99.99
    // (en optometría el ADD real va de +0.75 a +4.00)
    private static decimal? ClampAdicion(decimal? v) =>
        v.HasValue ? Math.Clamp(v.Value, -99.99m, 99.99m) : null;

    private static ParsedPrescripcion ParsePrescripcion(string texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return new ParsedPrescripcion();

        var upper = texto.ToUpperInvariant();

        // ADD
        decimal? adicion = null;
        var addMatch = Regex.Match(upper, @"ADD\s*([+-]?\d+(?:\.\d+)?)", RegexOptions.None, TimeSpan.FromSeconds(1));
        if (addMatch.Success)
            adicion = decimal.Parse(addMatch.Groups[1].Value, CultureInfo.InvariantCulture);
        int addIdx = addMatch.Success ? upper.IndexOf(addMatch.Value, StringComparison.Ordinal) : -1;

        int odIdx = upper.IndexOf("OD", StringComparison.Ordinal);
        int oiIdx = upper.IndexOf("OI", StringComparison.Ordinal);

        string odStr = string.Empty;
        string oiStr = string.Empty;

        if (odIdx >= 0 && oiIdx >= 0 && odIdx < oiIdx)
        {
            odStr = upper.Substring(odIdx + 2, oiIdx - odIdx - 2).Trim();
            int oiEnd = addIdx > oiIdx ? addIdx : upper.Length;
            oiStr = upper.Substring(oiIdx + 2, oiEnd - oiIdx - 2).Trim();
        }
        else if (odIdx >= 0)
        {
            int odEnd = addIdx >= 0 ? addIdx : upper.Length;
            odStr = upper.Substring(odIdx + 2, odEnd - odIdx - 2).Trim();
        }
        else if (oiIdx >= 0)
        {
            int oiEnd = addIdx >= 0 ? addIdx : upper.Length;
            oiStr = upper.Substring(oiIdx + 2, oiEnd - oiIdx - 2).Trim();
        }

        var (odEsf, odCil, odEje, odObs) = ParseOjoStr(odStr);
        var (oiEsf, oiCil, oiEje, oiObs) = ParseOjoStr(oiStr);
        var obs = odObs ?? oiObs;

        return new ParsedPrescripcion
        {
            OD_Esfera = odEsf, OD_Cilindro = odCil, OD_Eje = odEje,
            OI_Esfera = oiEsf, OI_Cilindro = oiCil, OI_Eje = oiEje,
            Adicion = adicion, Observaciones = obs
        };
    }

    private static (decimal? esfera, decimal? cilindro, int? eje, string? obs) ParseOjoStr(string text)
    {
        text = text.Trim();
        if (string.IsNullOrEmpty(text)) return (null, null, null, null);

        // esfera=cilindroxeje  e.g. -0.25=-1.50X170  o  -0.25=-1.50X 170 (con espacio)
        var full = Regex.Match(text, @"^([+-]?\d+(?:\.\d+)?)=([+-]?\d+(?:\.\d+)?)X\s*(\d+)",
            RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
        if (full.Success)
            return (
                decimal.Parse(full.Groups[1].Value, CultureInfo.InvariantCulture),
                decimal.Parse(full.Groups[2].Value, CultureInfo.InvariantCulture),
                int.Parse(full.Groups[3].Value),
                null);

        // esferaXeje  e.g. -1.75X180  o  -1.75X 180 (con espacio)
        var esferaEje = Regex.Match(text, @"^([+-]?\d+(?:\.\d+)?)X\s*(\d+)",
            RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
        if (esferaEje.Success)
            return (
                decimal.Parse(esferaEje.Groups[1].Value, CultureInfo.InvariantCulture),
                null,
                int.Parse(esferaEje.Groups[2].Value),
                null);

        // solo esfera  e.g. -0.25
        var esfera = Regex.Match(text, @"^([+-]?\d+(?:\.\d+)?)$",
            RegexOptions.None, TimeSpan.FromSeconds(1));
        if (esfera.Success)
            return (decimal.Parse(esfera.Groups[1].Value, CultureInfo.InvariantCulture), null, null, null);

        // texto libre  e.g. "LENTE BLANDO TORICO"
        return (null, null, null, text);
    }

    private record ParsedPrescripcion
    {
        public decimal? OD_Esfera { get; init; }
        public decimal? OD_Cilindro { get; init; }
        public int? OD_Eje { get; init; }
        public decimal? OI_Esfera { get; init; }
        public decimal? OI_Cilindro { get; init; }
        public int? OI_Eje { get; init; }
        public decimal? Adicion { get; init; }
        public string? Observaciones { get; init; }
    }
}
