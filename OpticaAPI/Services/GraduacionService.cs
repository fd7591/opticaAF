using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class GraduacionService
{
    private readonly OpticaDbContext _db;
    private readonly IMapper _mapper;
    private readonly TenantContext _tenant;

    public GraduacionService(OpticaDbContext db, IMapper mapper, TenantContext tenant)
    {
        _db = db;
        _mapper = mapper;
        _tenant = tenant;
    }

    private IQueryable<Graduacion> ApplyTenantFilter(IQueryable<Graduacion> query)
    {
        if (_tenant.IsSuperAdmin) return query;
        var opticaId = _tenant.RequireOpticaId();
        return query.Where(g => g.Paciente.OpticaId == opticaId);
    }

    public async Task<PagedResponseDto<GraduacionResponseDto>> GetAllAsync(
        int? pacienteId, DateOnly? desde, DateOnly? hasta, string? optometrista, bool? venta, int page, int pageSize)
    {
        var query = ApplyTenantFilter(
            _db.Graduaciones
               .Include(g => g.Paciente)
               .Include(g => g.Sucursal)
               .Include(g => g.OptometristaNav)
               .AsQueryable());

        if (pacienteId.HasValue)
            query = query.Where(g => g.PacienteId == pacienteId.Value);
        if (desde.HasValue)
            query = query.Where(g => g.Fecha >= desde.Value);
        if (hasta.HasValue)
            query = query.Where(g => g.Fecha <= hasta.Value);
        if (!string.IsNullOrWhiteSpace(optometrista))
        {
            var opt = optometrista.ToLower();
            query = query.Where(g =>
                (g.OptometristaTexto != null && g.OptometristaTexto.ToLower().Contains(opt)) ||
                (g.OptometristaNav != null &&
                 (g.OptometristaNav.Nombre.ToLower().Contains(opt) ||
                  g.OptometristaNav.Apellido.ToLower().Contains(opt))));
        }

        if (venta.HasValue)
            query = query.Where(g => g.Venta == venta.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(g => g.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponseDto<GraduacionResponseDto>(
            _mapper.Map<IEnumerable<GraduacionResponseDto>>(items),
            total, page, pageSize);
    }

    public async Task<IEnumerable<GraduacionResponseDto>> GetByPacienteAsync(int pacienteId)
    {
        var query = ApplyTenantFilter(
            _db.Graduaciones
               .Include(g => g.Paciente)
               .Include(g => g.Sucursal)
               .Include(g => g.OptometristaNav)
               .AsQueryable());

        var items = await query
            .Where(g => g.PacienteId == pacienteId)
            .OrderByDescending(g => g.Fecha)
            .ToListAsync();
        return _mapper.Map<IEnumerable<GraduacionResponseDto>>(items);
    }

    public async Task<GraduacionResponseDto?> GetByIdAsync(int id)
    {
        var query = ApplyTenantFilter(
            _db.Graduaciones
               .Include(g => g.Paciente)
               .Include(g => g.Sucursal)
               .Include(g => g.OptometristaNav)
               .AsQueryable());

        var g = await query.FirstOrDefaultAsync(g => g.Id == id);
        return g is null ? null : _mapper.Map<GraduacionResponseDto>(g);
    }

    public async Task<GraduacionResponseDto?> CreateAsync(GraduacionCreateDto dto)
    {
        var pacienteExists = await _db.Pacientes.AnyAsync(p => p.Id == dto.PacienteId);
        if (!pacienteExists) return null;

        var grad = _mapper.Map<Graduacion>(dto);

        // Operador fija automáticamente su sucursal si no viene en el DTO
        if (!grad.SucursalId.HasValue && _tenant.IsOperador && _tenant.SucursalId.HasValue)
            grad.SucursalId = _tenant.SucursalId.Value;

        _db.Graduaciones.Add(grad);
        await _db.SaveChangesAsync();
        await _db.Entry(grad).Reference(g => g.Paciente).LoadAsync();
        await _db.Entry(grad).Reference(g => g.Sucursal).LoadAsync();
        await _db.Entry(grad).Reference(g => g.OptometristaNav).LoadAsync();
        return _mapper.Map<GraduacionResponseDto>(grad);
    }

    public async Task<GraduacionResponseDto?> UpdateAsync(int id, GraduacionUpdateDto dto)
    {
        var query = ApplyTenantFilter(
            _db.Graduaciones
               .Include(g => g.Paciente)
               .Include(g => g.Sucursal)
               .Include(g => g.OptometristaNav)
               .AsQueryable());

        var grad = await query.FirstOrDefaultAsync(g => g.Id == id);
        if (grad is null) return null;

        if (_tenant.IsOperador && grad.Fecha < DateOnly.FromDateTime(DateTime.Today))
            throw new UnauthorizedAccessException("Los operadores no pueden modificar graduaciones de fechas anteriores al día de hoy.");

        _mapper.Map(dto, grad);
        await _db.SaveChangesAsync();
        return _mapper.Map<GraduacionResponseDto>(grad);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var query = ApplyTenantFilter(_db.Graduaciones.AsQueryable());
        var grad = await query.FirstOrDefaultAsync(g => g.Id == id);
        if (grad is null) return false;

        if (_tenant.IsOperador && grad.Fecha < DateOnly.FromDateTime(DateTime.Today))
            throw new UnauthorizedAccessException("Los operadores no pueden eliminar graduaciones de fechas anteriores al día de hoy.");

        _db.Graduaciones.Remove(grad);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<GraduacionResponseDto?> ToggleVentaAsync(int id)
    {
        var query = ApplyTenantFilter(
            _db.Graduaciones
               .Include(g => g.Paciente)
               .Include(g => g.Sucursal)
               .Include(g => g.OptometristaNav)
               .AsQueryable());

        var grad = await query.FirstOrDefaultAsync(g => g.Id == id);
        if (grad is null) return null;

        grad.Venta = !grad.Venta;
        await _db.SaveChangesAsync();
        return _mapper.Map<GraduacionResponseDto>(grad);
    }
}
