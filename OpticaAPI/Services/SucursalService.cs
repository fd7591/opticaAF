using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class SucursalService
{
    private readonly OpticaDbContext _db;
    private readonly IMapper _mapper;
    private readonly TenantContext _tenant;

    public SucursalService(OpticaDbContext db, IMapper mapper, TenantContext tenant)
    {
        _db = db;
        _mapper = mapper;
        _tenant = tenant;
    }

    public async Task<List<SucursalResponseDto>> GetAllAsync(int? opticaIdFilter = null)
    {
        var query = _db.Sucursales.Include(s => s.Optica).AsQueryable();

        if (_tenant.IsSuperAdmin)
        {
            if (opticaIdFilter.HasValue)
                query = query.Where(s => s.OpticaId == opticaIdFilter.Value);
        }
        else
        {
            var opticaId = _tenant.RequireOpticaId();
            query = query.Where(s => s.OpticaId == opticaId);
        }

        return (await query.OrderBy(s => s.Nombre).ToListAsync())
            .Select(s => _mapper.Map<SucursalResponseDto>(s)).ToList();
    }

    public async Task<SucursalResponseDto?> GetByIdAsync(int id)
    {
        var sucursal = await _db.Sucursales.Include(s => s.Optica).FirstOrDefaultAsync(s => s.Id == id);
        if (sucursal is null) return null;
        if (!_tenant.IsSuperAdmin && sucursal.OpticaId != _tenant.RequireOpticaId()) return null;
        return _mapper.Map<SucursalResponseDto>(sucursal);
    }

    public async Task<SucursalResponseDto?> CreateAsync(SucursalCreateDto dto)
    {
        if (!_tenant.IsSuperAdmin && dto.OpticaId != _tenant.RequireOpticaId()) return null;

        var sucursal = _mapper.Map<Sucursal>(dto);
        _db.Sucursales.Add(sucursal);
        await _db.SaveChangesAsync();
        await _db.Entry(sucursal).Reference(s => s.Optica).LoadAsync();
        return _mapper.Map<SucursalResponseDto>(sucursal);
    }

    public async Task<SucursalResponseDto?> UpdateAsync(int id, SucursalUpdateDto dto)
    {
        var sucursal = await _db.Sucursales.Include(s => s.Optica).FirstOrDefaultAsync(s => s.Id == id);
        if (sucursal is null) return null;
        if (!_tenant.IsSuperAdmin && sucursal.OpticaId != _tenant.RequireOpticaId()) return null;

        _mapper.Map(dto, sucursal);
        await _db.SaveChangesAsync();
        return _mapper.Map<SucursalResponseDto>(sucursal);
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var sucursal = await _db.Sucursales.FindAsync(id);
        if (sucursal is null) return false;
        if (!_tenant.IsSuperAdmin && sucursal.OpticaId != _tenant.RequireOpticaId()) return false;

        sucursal.Activo = !sucursal.Activo;
        await _db.SaveChangesAsync();
        return true;
    }
}
