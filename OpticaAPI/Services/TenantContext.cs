using System.Security.Claims;

namespace OpticaAPI.Services;

public class TenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal User =>
        _httpContextAccessor.HttpContext?.User
        ?? throw new InvalidOperationException("No HTTP context available.");

    public int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
    public string Rol => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    public bool IsSuperAdmin => Rol == "SuperAdmin";
    public bool IsAdmin => Rol == "Admin";
    public bool IsOperador => Rol == "Operador";

    public int? OpticaId
    {
        get
        {
            var val = User.FindFirstValue("opticaId");
            return val is null ? null : int.Parse(val);
        }
    }

    public int? SucursalId
    {
        get
        {
            var val = User.FindFirstValue("sucursalId");
            return val is null ? null : int.Parse(val);
        }
    }

    public int RequireOpticaId()
    {
        if (IsSuperAdmin) throw new InvalidOperationException("SuperAdmin no tiene OpticaId.");
        return OpticaId ?? throw new UnauthorizedAccessException("Claim opticaId faltante.");
    }
}
