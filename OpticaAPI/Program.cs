using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpticaAPI.Data;
using OpticaAPI.Mapping;
using OpticaAPI.Middleware;
using OpticaAPI.Models;
using OpticaAPI.Services;

AppContext.SetSwitch("Switch.Microsoft.Data.SqlClient.UseManagedNetworkingOnWindows", true);
AppContext.SetSwitch("Switch.Microsoft.Data.SqlClient.DisableCertificateValidation", true);
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Óptica API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<OpticaDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured in appsettings.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero,
        };
        opts.Events = new JwtBearerEvents
        {
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = 401;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"error\":\"No autenticado. Inicia sesión.\"}");
            },
            OnForbidden = ctx =>
            {
                ctx.Response.StatusCode = 403;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"error\":\"No tienes permiso para esta acción.\"}");
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<PacienteService>();
builder.Services.AddScoped<GraduacionService>();
builder.Services.AddScoped<ImportService>();
builder.Services.AddSingleton<ImportJobTracker>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<OpticaService>();
builder.Services.AddScoped<SucursalService>();
builder.Services.AddScoped<OptometristaService>();
builder.Services.AddScoped<DevSeederService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        // Hosts permitidos (sin esquema): acepta http y https automáticamente.
        // Si el certificado SSL caduca y el frontend vuelve a HTTP, sigue funcionando.
        var allowedHosts = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "opticsystem.runasp.net",
            "localhost:5173",
            "localhost:3000",
        };

        // Agregar el host de AllowedOrigins del config (si existe)
        var configOrigin = builder.Configuration["AllowedOrigins"];
        if (!string.IsNullOrWhiteSpace(configOrigin) &&
            Uri.TryCreate(configOrigin, UriKind.Absolute, out var configUri))
        {
            allowedHosts.Add(configUri.Authority);
        }

        policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                allowedHosts.Contains(uri.Authority))
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
// UseHttpsRedirection deshabilitado: monsterASP maneja SSL en el proxy (IIS).
// Habilitarlo genera loop de redirección cuando el proxy termina el SSL internamente.
// app.UseHttpsRedirection();
app.UseMiddleware<GlobalExceptionMiddleware>();

//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Óptica API v1");
        c.RoutePrefix = "swagger";
    });
//}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Auto-apply migrations and seed initial data
// using (var scope = app.Services.CreateScope())
// {
//     var db = scope.ServiceProvider.GetRequiredService<OpticaDbContext>();
//     //db.Database.Migrate();

//     // Seed default Optica if none exists
//     if (!db.Opticas.Any())
//     {
//         var optica = new Optica
//         {
//             Nombre = "Óptica Principal",
//             Activo = true,
//         };
//         db.Opticas.Add(optica);
//         db.SaveChanges();

//         var sucursal = new Sucursal
//         {
//             OpticaId = optica.Id,
//             Nombre = "Sucursal Principal",
//             Activo = true,
//         };
//         db.Sucursales.Add(sucursal);
//         db.SaveChanges();

//         // Backfill existing patients and graduations to default optica/sucursal
//         db.Pacientes.IgnoreQueryFilters()
//             .Where(p => p.OpticaId == null)
//             .ExecuteUpdate(s => s.SetProperty(p => p.OpticaId, optica.Id));

//         db.Graduaciones
//             .Where(g => g.SucursalId == null)
//             .ExecuteUpdate(s => s.SetProperty(g => g.SucursalId, sucursal.Id));

//         // Seed default admin user for new installation
//         if (!db.Usuarios.Any())
//         {
//             db.Usuarios.Add(new Usuario
//             {
//                 NombreUsuario = "admin",
//                 NombreCompleto = "Administrador",
//                 PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin1234!", workFactor: 12),
//                 Rol = "Admin",
//                 Activo = true,
//                 OpticaId = optica.Id,
//             });
//             db.SaveChanges();
//         }
//         else
//         {
//             // Update existing admin user to belong to default optica
//             db.Usuarios
//                 .Where(u => u.OpticaId == null && u.Rol == "Admin")
//                 .ExecuteUpdate(s => s.SetProperty(u => u.OpticaId, optica.Id));
//         }
//     }

//     // Seed SuperAdmin if none exists
//     if (!db.Usuarios.Any(u => u.Rol == "SuperAdmin"))
//     {
//         db.Usuarios.Add(new Usuario
//         {
//             NombreUsuario = "superadmin",
//             NombreCompleto = "Super Administrador",
//             PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperAdmin1234!", workFactor: 12),
//             Rol = "SuperAdmin",
//             Activo = true,
//         });
//         db.SaveChanges();
//     }
// }

app.Run();
