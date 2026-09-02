# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpticaSystem** is a multi-tenant web application for managing optical patient records and eye prescriptions (graduaciones). It serves optical clinics/stores, supporting multiple Ópticas (tenants), each with Sucursales (branches), Optometristas, Pacientes, and Graduaciones.

---

## Repository Structure

```
Optica042026/
├── OpticaAPI/              ← .NET 8 REST API backend
├── optica-frontend/        ← React 19 + Vite frontend
├── infra/                  ← Azure infrastructure (Bicep)
└── azure-pipelines-*.yml   ← CI/CD pipelines
```

---

## Commands

### Backend (OpticaAPI)

```bash
cd OpticaAPI
dotnet run          # Start API on http://localhost:5175 (Swagger at /swagger)
dotnet build        # Compile project
dotnet publish -c Release  # Production build
```

EF Core migrations are applied automatically on startup. To add a new migration:
```bash
dotnet ef migrations add <MigrationName>
```

### Frontend (optica-frontend)

```bash
cd optica-frontend
npm install         # Install dependencies
npm run dev         # Dev server on http://localhost:5173
npm run build       # Production build → dist/
npm run lint        # ESLint
```

The frontend connects to the API via `VITE_API_URL` (defaults to `http://localhost:5175` in `.env`).

---

## Architecture

### Backend (.NET 8 / ASP.NET Core)

**Layer structure inside `OpticaAPI/`:**
- `Models/` — EF Core domain entities
- `DTOs/` — Request/response contracts
- `Controllers/` — HTTP endpoints; thin, delegate to Services
- `Services/` — All business logic lives here
- `Data/OpticaDbContext.cs` — DbContext with global query filters (soft delete, tenant isolation)
- `Mapping/` — AutoMapper profiles (entity ↔ DTO)
- `Middleware/GlobalExceptionMiddleware.cs` — Centralized error handling

**Key services:**
- `TenantContext` — Extracts JWT claims (`opticaId`, `sucursalId`, `rol`) and provides them to all services for scoping queries
- `PacienteService` / `GraduacionService` — Core domain CRUD with tenant-filtered queries
- `AuthService` — Login, BCrypt verification, JWT generation (HS256, 8-hour expiry)
- `ImportService` — Bulk CSV import of patients and graduations

### Frontend (React 19 + TypeScript + Vite)

**Structure inside `optica-frontend/src/`:**
- `api/` — Axios API clients per resource (one file per entity)
- `context/AuthContext.tsx` — Auth state (user, token), persisted to `localStorage`; Axios interceptors inject Bearer token and handle 401 auto-logout
- `pages/` — One page component per route
- `components/` — Reusable components organized by domain (`pacientes/`, `graduaciones/`, `layout/`, `ui/`)
- `hooks/` — Custom React hooks (typically wrapping React Query calls)
- `types/` — TypeScript interfaces matching backend DTOs

**State management:** React Query (TanStack) for all server state. React Context only for auth.

### Multi-Tenancy & Authorization

Tenant isolation is enforced **in the backend services** via `TenantContext`:

| Role | Scope |
|------|-------|
| **SuperAdmin** | All Ópticas; no tenant filter |
| **Admin** | One Óptica; manages Sucursales, Optometristas, Usuarios |
| **Operador** | Scoped to one Sucursal within their Óptica |

JWT claims `opticaId` and `sucursalId` are set at login and used to filter EF Core queries.

### Domain Model

```
Optica (tenant root)
  └── Sucursal (branch)
        ├── Optometrista
        └── Graduacion
Paciente (belongs to Optica, soft-delete via IsDeleted)
  └── Graduacion
        ├── OjoDerecho (owned entity: Esfera, Cilindro, Eje, Adicion, AV)
        └── OjoIzquierdo (same fields)
Usuario (belongs to Optica + optional Sucursal)
```

`Graduacion` has both a structured FK `OptometristaId` and a free-text `OptometristaTexto` column (mapped as `"Optometrista"` in the DB for backward compatibility).

### Seeding

On first startup the API seeds:
- "Óptica Principal" + "Sucursal Principal"
- SuperAdmin user: `superadmin` / `SuperAdmin1234!`

---

## Configuration

### Backend (`appsettings.json`)
- `ConnectionStrings:DefaultConnection` — SQL Server
- `Jwt:Key` — HS256 signing secret (≥32 chars)
- `Jwt:Issuer`, `Jwt:Audience`
- `AllowedOrigins` — CORS whitelist

### Frontend (`.env`)
- `VITE_API_URL` — Backend base URL

---

## Key Technical Details

- **CSV Import:** bulk-inserts patients and graduations; date format `dd/MM/yyyy`, decimal separator `.`; row-level error reporting returned to the UI
- **Soft delete:** `Paciente.IsDeleted` — filtered globally in `DbContext`; `Graduacion` is hard-deleted
- **EF Core owned types:** `OjoDerecho`/`OjoIzquierdo` are owned entities stored in the same `Graduaciones` table with column prefix `OD_`/`OI_`
