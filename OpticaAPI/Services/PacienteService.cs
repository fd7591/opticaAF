using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class PacienteService
{
    private readonly OpticaDbContext _db;
    private readonly IMapper _mapper;
    private readonly TenantContext _tenant;

    public PacienteService(OpticaDbContext db, IMapper mapper, TenantContext tenant)
    {
        _db = db;
        _mapper = mapper;
        _tenant = tenant;
    }

    private IQueryable<Paciente> ApplyTenantFilter(IQueryable<Paciente> query)
    {
        if (_tenant.IsSuperAdmin) return query;
        var opticaId = _tenant.RequireOpticaId();
        return query.Where(p => p.OpticaId == opticaId);
    }

    public async Task<PagedResponseDto<PacienteResponseDto>> GetAllAsync(
        string? search, int page, int pageSize, string? sortBy = null, string? sortDir = null)
    {
        var query = ApplyTenantFilter(_db.Pacientes.AsQueryable());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p =>
                p.Nombre.ToLower().Contains(s) ||
                p.Apellido.ToLower().Contains(s));
        }

        var total = await query.CountAsync();

        bool descending = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<Paciente> ordered = string.Equals(sortBy, "fechaCreacion", StringComparison.OrdinalIgnoreCase)
            ? descending
                ? query.OrderByDescending(p => p.FechaCreacion)
                : query.OrderBy(p => p.FechaCreacion)
            : descending
                ? query.OrderByDescending(p => p.Apellido).ThenByDescending(p => p.Nombre)
                : query.OrderBy(p => p.Apellido).ThenBy(p => p.Nombre);

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PacienteResponseDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Apellido = p.Apellido,
                FechaNacimiento = p.FechaNacimiento,
                Telefono = p.Telefono,
                Email = p.Email,
                FechaCreacion = p.FechaCreacion,
                TotalGraduaciones = p.Graduaciones.Count()
            })
            .ToListAsync();

        return new PagedResponseDto<PacienteResponseDto>(items, total, page, pageSize);
    }

    public async Task<PacienteResponseDto?> GetByIdAsync(int id)
    {
        var query = ApplyTenantFilter(_db.Pacientes.Include(p => p.Graduaciones).AsQueryable());
        var paciente = await query.FirstOrDefaultAsync(p => p.Id == id);
        return paciente is null ? null : _mapper.Map<PacienteResponseDto>(paciente);
    }

    public async Task<PacienteResponseDto> CreateAsync(PacienteCreateDto dto)
    {
        var paciente = _mapper.Map<Paciente>(dto);
        if (!_tenant.IsSuperAdmin)
            paciente.OpticaId = _tenant.RequireOpticaId();
        _db.Pacientes.Add(paciente);
        await _db.SaveChangesAsync();
        await _db.Entry(paciente).Collection(p => p.Graduaciones).LoadAsync();
        return _mapper.Map<PacienteResponseDto>(paciente);
    }

    public async Task<PacienteResponseDto?> UpdateAsync(int id, PacienteUpdateDto dto)
    {
        var query = ApplyTenantFilter(_db.Pacientes.Include(p => p.Graduaciones).AsQueryable());
        var paciente = await query.FirstOrDefaultAsync(p => p.Id == id);
        if (paciente is null) return null;
        _mapper.Map(dto, paciente);
        await _db.SaveChangesAsync();
        return _mapper.Map<PacienteResponseDto>(paciente);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var query = ApplyTenantFilter(_db.Pacientes.AsQueryable());
        var paciente = await query.FirstOrDefaultAsync(p => p.Id == id);
        if (paciente is null) return false;
        paciente.IsDeleted = true;
        paciente.FechaEliminacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<ExpedienteResponseDto?> GetExpedienteAsync(int pacienteId)
    {
        var pacienteQuery = ApplyTenantFilter(_db.Pacientes.AsQueryable());
        var exists = await pacienteQuery.AnyAsync(p => p.Id == pacienteId);
        if (!exists) return null;

        var expediente = await _db.Expedientes.FirstOrDefaultAsync(e => e.PacienteId == pacienteId);
        return expediente is null ? null : _mapper.Map<ExpedienteResponseDto>(expediente);
    }

    public async Task<ExpedienteResponseDto?> UpsertExpedienteAsync(int pacienteId, ExpedienteUpdateDto dto)
    {
        var pacienteQuery = ApplyTenantFilter(_db.Pacientes.AsQueryable());
        var exists = await pacienteQuery.AnyAsync(p => p.Id == pacienteId);
        if (!exists) return null;

        var expediente = await _db.Expedientes.FirstOrDefaultAsync(e => e.PacienteId == pacienteId);
        if (expediente is null)
        {
            expediente = _mapper.Map<ExpedienteMedico>(dto);
            expediente.PacienteId = pacienteId;
            expediente.FechaActualizacion = DateTime.UtcNow;
            _db.Expedientes.Add(expediente);
        }
        else
        {
            _mapper.Map(dto, expediente);
            expediente.FechaActualizacion = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return _mapper.Map<ExpedienteResponseDto>(expediente);
    }
}
