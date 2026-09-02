using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OpticaAPI.Data;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Services;

public class OpticaService
{
    private readonly OpticaDbContext _db;
    private readonly IMapper _mapper;

    public OpticaService(OpticaDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<List<OpticaResponseDto>> GetAllAsync() =>
        (await _db.Opticas.OrderBy(o => o.Nombre).ToListAsync())
        .Select(o => _mapper.Map<OpticaResponseDto>(o)).ToList();

    public async Task<OpticaResponseDto?> GetByIdAsync(int id)
    {
        var optica = await _db.Opticas.FindAsync(id);
        return optica is null ? null : _mapper.Map<OpticaResponseDto>(optica);
    }

    public async Task<OpticaResponseDto> CreateAsync(OpticaCreateDto dto)
    {
        var optica = _mapper.Map<Optica>(dto);
        _db.Opticas.Add(optica);
        await _db.SaveChangesAsync();
        return _mapper.Map<OpticaResponseDto>(optica);
    }

    public async Task<OpticaResponseDto?> UpdateAsync(int id, OpticaUpdateDto dto)
    {
        var optica = await _db.Opticas.FindAsync(id);
        if (optica is null) return null;
        _mapper.Map(dto, optica);
        await _db.SaveChangesAsync();
        return _mapper.Map<OpticaResponseDto>(optica);
    }

    public async Task<bool> ToggleActivoAsync(int id)
    {
        var optica = await _db.Opticas.FindAsync(id);
        if (optica is null) return false;
        optica.Activo = !optica.Activo;
        await _db.SaveChangesAsync();
        return true;
    }
}
