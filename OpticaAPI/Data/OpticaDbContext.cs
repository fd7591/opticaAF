using Microsoft.EntityFrameworkCore;
using OpticaAPI.Models;

namespace OpticaAPI.Data;

public class OpticaDbContext : DbContext
{
    public OpticaDbContext(DbContextOptions<OpticaDbContext> options) : base(options) { }

    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Graduacion> Graduaciones => Set<Graduacion>();
    public DbSet<ExpedienteMedico> Expedientes => Set<ExpedienteMedico>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Optica> Opticas => Set<Optica>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Optometrista> Optometristas => Set<Optometrista>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global filter for soft-delete
        modelBuilder.Entity<Paciente>().HasQueryFilter(p => !p.IsDeleted);

        modelBuilder.Entity<Optica>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Nombre).HasMaxLength(150).IsRequired();
            entity.Property(o => o.RazonSocial).HasMaxLength(200);
            entity.Property(o => o.Telefono).HasMaxLength(30);
            entity.Property(o => o.Email).HasMaxLength(200);
            entity.HasIndex(o => o.Nombre);
        });

        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Nombre).HasMaxLength(150).IsRequired();
            entity.Property(s => s.Direccion).HasMaxLength(300);
            entity.Property(s => s.Telefono).HasMaxLength(30);
            entity.HasOne(s => s.Optica)
                  .WithMany(o => o.Sucursales)
                  .HasForeignKey(s => s.OpticaId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(s => s.OpticaId);
        });

        modelBuilder.Entity<Optometrista>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Nombre).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Apellido).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Cedula).HasMaxLength(20);
            entity.Property(o => o.Telefono).HasMaxLength(30);
            entity.Property(o => o.Email).HasMaxLength(200);
            entity.HasOne(o => o.Sucursal)
                  .WithMany(s => s.Optometristas)
                  .HasForeignKey(o => o.SucursalId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(o => o.SucursalId);
        });

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Nombre).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Apellido).HasMaxLength(100).IsRequired();
            entity.Property(p => p.Telefono).HasMaxLength(30);
            entity.Property(p => p.Email).HasMaxLength(200);
            entity.HasIndex(p => new { p.Apellido, p.Nombre });
            entity.HasOne(p => p.Optica)
                  .WithMany(o => o.Pacientes)
                  .HasForeignKey(p => p.OpticaId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
            entity.HasIndex(p => p.OpticaId);
        });

        modelBuilder.Entity<Graduacion>(entity =>
        {
            entity.HasKey(g => g.Id);
            entity.Property(g => g.Observaciones).HasMaxLength(500);
            entity.Property(g => g.OptometristaTexto).HasColumnName("Optometrista").HasMaxLength(150);
            entity.Property(g => g.Material).HasMaxLength(100);
            entity.Property(g => g.DisenoLente).HasColumnName("Diseno").HasMaxLength(100);
            entity.Property(g => g.Tratamiento).HasMaxLength(100);
            entity.Property(g => g.DistanciaPupilar).HasPrecision(5, 1);

            entity.OwnsOne(g => g.OjoDerecho, ojo =>
            {
                ojo.Property(o => o.Esfera).HasColumnName("OD_Esfera").HasPrecision(5, 2);
                ojo.Property(o => o.Cilindro).HasColumnName("OD_Cilindro").HasPrecision(5, 2);
                ojo.Property(o => o.Eje).HasColumnName("OD_Eje");
                ojo.Property(o => o.Adicion).HasColumnName("OD_Adicion").HasPrecision(4, 2);
                ojo.Property(o => o.AV).HasColumnName("OD_AV").HasMaxLength(10);
            });

            entity.OwnsOne(g => g.OjoIzquierdo, ojo =>
            {
                ojo.Property(o => o.Esfera).HasColumnName("OI_Esfera").HasPrecision(5, 2);
                ojo.Property(o => o.Cilindro).HasColumnName("OI_Cilindro").HasPrecision(5, 2);
                ojo.Property(o => o.Eje).HasColumnName("OI_Eje");
                ojo.Property(o => o.Adicion).HasColumnName("OI_Adicion").HasPrecision(4, 2);
                ojo.Property(o => o.AV).HasColumnName("OI_AV").HasMaxLength(10);
            });

            entity.HasOne(g => g.Paciente)
                  .WithMany(p => p.Graduaciones)
                  .HasForeignKey(g => g.PacienteId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(g => g.Sucursal)
                  .WithMany(s => s.Graduaciones)
                  .HasForeignKey(g => g.SucursalId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);

            entity.HasOne(g => g.OptometristaNav)
                  .WithMany(o => o.Graduaciones)
                  .HasForeignKey(g => g.OptometristaId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);

            entity.HasIndex(g => g.PacienteId);
            entity.HasIndex(g => g.Fecha);
            entity.HasIndex(g => g.SucursalId);
        });

        modelBuilder.Entity<ExpedienteMedico>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Ocupacion).HasMaxLength(200);
            entity.Property(e => e.Alergias).HasMaxLength(2000);
            entity.Property(e => e.EnfermedadesSistemicas).HasMaxLength(2000);
            entity.Property(e => e.MedicamentosActuales).HasMaxLength(2000);
            entity.Property(e => e.AntecedentesFamiliares).HasMaxLength(2000);
            entity.Property(e => e.Observaciones).HasMaxLength(2000);
            entity.HasOne(e => e.Paciente)
                  .WithOne()
                  .HasForeignKey<ExpedienteMedico>(e => e.PacienteId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.PacienteId).IsUnique();
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.NombreUsuario).HasMaxLength(50).IsRequired();
            entity.Property(u => u.NombreCompleto).HasMaxLength(150).IsRequired();
            entity.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(u => u.Rol).HasMaxLength(20).IsRequired();
            entity.HasIndex(u => u.NombreUsuario).IsUnique();
            entity.HasOne(u => u.Optica)
                  .WithMany(o => o.Usuarios)
                  .HasForeignKey(u => u.OpticaId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
            entity.HasOne(u => u.Sucursal)
                  .WithMany(s => s.Usuarios)
                  .HasForeignKey(u => u.SucursalId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });
    }
}
