using AutoMapper;
using OpticaAPI.DTOs;
using OpticaAPI.Models;

namespace OpticaAPI.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Ojo, OjoDto>().ReverseMap();

        // Optica
        CreateMap<Optica, OpticaResponseDto>();
        CreateMap<OpticaCreateDto, Optica>();
        CreateMap<OpticaUpdateDto, Optica>();

        // Sucursal
        CreateMap<Sucursal, SucursalResponseDto>()
            .ForMember(d => d.NombreOptica, o => o.MapFrom(s => s.Optica.Nombre));
        CreateMap<SucursalCreateDto, Sucursal>();
        CreateMap<SucursalUpdateDto, Sucursal>();

        // Optometrista
        CreateMap<Optometrista, OptometristaResponseDto>()
            .ForMember(d => d.NombreSucursal, o => o.MapFrom(s => s.Sucursal.Nombre));
        CreateMap<OptometristaCreateDto, Optometrista>();
        CreateMap<OptometristaUpdateDto, Optometrista>();

        // Paciente
        CreateMap<Paciente, PacienteResponseDto>()
            .ForMember(d => d.TotalGraduaciones, o => o.MapFrom(s => s.Graduaciones.Count));

        CreateMap<PacienteCreateDto, Paciente>();
        CreateMap<PacienteUpdateDto, Paciente>();

        // Expediente Medico
        CreateMap<ExpedienteMedico, ExpedienteResponseDto>();
        CreateMap<ExpedienteUpdateDto, ExpedienteMedico>();

        // Graduacion
        CreateMap<Graduacion, GraduacionResponseDto>()
            .ForMember(d => d.NombrePaciente, o => o.MapFrom(s => s.Paciente.Nombre))
            .ForMember(d => d.ApellidoPaciente, o => o.MapFrom(s => s.Paciente.Apellido))
            .ForMember(d => d.NombreSucursal, o => o.MapFrom(s => s.Sucursal != null ? s.Sucursal.Nombre : null))
            .ForMember(d => d.NombreOptometrista, o => o.MapFrom(s =>
                s.OptometristaNav != null
                    ? s.OptometristaNav.Nombre + " " + s.OptometristaNav.Apellido
                    : null))
            .ForMember(d => d.Optometrista, o => o.MapFrom(s =>
                s.OptometristaTexto != null
                    ? s.OptometristaTexto
                    : (s.OptometristaNav != null
                        ? s.OptometristaNav.Nombre + " " + s.OptometristaNav.Apellido
                        : null)));

        CreateMap<GraduacionCreateDto, Graduacion>()
            .ForMember(d => d.OptometristaTexto, o => o.MapFrom(s => s.Optometrista));

        CreateMap<GraduacionUpdateDto, Graduacion>()
            .ForMember(d => d.OptometristaTexto, o => o.MapFrom(s => s.Optometrista));
    }
}
