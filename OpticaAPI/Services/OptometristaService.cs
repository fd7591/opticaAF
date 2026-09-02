using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class OptometristaService
{
    private readonly OpticaDbContext _db;
    private readonly IMapper _mapper;
    private readonly TenantContext _tenant;

    public OptometristaService(OpticaDbContext db, IMapper mapper, TenantContext tenant)
    {
        _db = db;
        _mapper = mapper;
        _tenant = tenant;
    }

    public async Task<List<OptometristaResponseDto>> GetAllAsync(int? sucursalId = null)
    {
        var query = _db.Optometristas.Include(o => o.Sucursal).AsQueryable();

        if (_tenant.IsSuperAdmin)
        {
            if (sucursalId.HasValue)
                query = query.Where(o => o.SucursalId == sucursalId.Value);
        }
        else if (_tenant.IsOperador && _tenant.SucursalId.HasValue)
        {
            query = query.Where(o => o.SucursalId == _tenant.SucursalId.Value && o.Activo);
        }
        else
        {
            // Admin: ver todos los optometristas de su óptica
            var opticaId = _tenant.RequireOpticaId();
            query = query.Where(o => o.Sucursal.OpticaId == opticaId);
            if (sucursalId.HasValue)
                query = query.Where(o => o.SucursalId == sucursalId.Value);
        }

        return (await query.OrderBy(o => o.Apellido).ThenBy(o => o.Nombre).ToListAsync())
            .Select(o => _mapper.Map<OptometristaResponseDto>(o)).ToList();
    }

    public async Task<OptometristaResponseDto?> GetByIdAsync(int id)
    {
        var opt = await _db.Optometristas.Include(o => o.Sucursal).FirstOrDefaultAsync(o => o.Id == id);
        if (opt is null) return null;
        if (!_tenant.IsSuperAdmin && opt.Sucursal.OpticaId != _tenant.RequireOpticaId()) return null;
        return _mapper.Map<OptometristaResponseDto>(opt);
    }

    public async Task<OptometristaResponseDto?> CreateAsync(OptometristaCreateDto dto)
    {
        if (!_tenant.IsSuperAdmin)
        {
            var sucursal = await _db.Sucursales.FindAsync(dto.SucursalId);
            if (sucursal is null || sucursal.OpticaId != _tenant.RequireOpticaId()) return null;
        }

        var opt = _mapper.Map<Optometrista>(dto);
        _db.Optometristas.Add(opt);
        await _db.SaveChangesAsync();
        await _db.Entry(opt).Reference(o => o.Sucursal).LoadAsync();
        return _mapper.Map<OptometristaResponseDto>(opt);
    }

    public async Task<OptometristaResponseDto?> UpdateAsync(int id, OptometristaUpdateDto dto)
    {
        var opt = await _db.Optometristas.Include(o => o.Sucursal).FirstOrDefaultAsync(o => o.Id == id);
        if (opt is null) return null;
        if (!_tenant.IsSuperAdmin && opt.Sucursal.OpticaId != _tenant.RequireOpticaId()) return null;

        _mapper.Map(dto, opt);
        await _db.SaveChangesAsync();
        return _mapper.Map<OptometristaResponseDto>(opt);
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var opt = await _db.Optometristas.Include(o => o.Sucursal).FirstOrDefaultAsync(o => o.Id == id);
        if (opt is null) return false;
        if (!_tenant.IsSuperAdmin && opt.Sucursal.OpticaId != _tenant.RequireOpticaId()) return false;

        opt.Activo = !opt.Activo;
        await _db.SaveChangesAsync();
        return true;
    }
}
