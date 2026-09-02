# Sistema de Gestión - Óptica

Sistema web para gestión de graduaciones de pacientes.

## Estructura
```
Optica042026/
├── OpticaAPI/          ← Backend .NET 8 + EF Core + SQL Server
└── optica-frontend/    ← Frontend React + Vite + Tailwind CSS
```

## Requisitos
- .NET 8 SDK
- SQL Server (local o Docker)
- Node.js 18+

## Backend (OpticaAPI)

### Configurar cadena de conexión
Editar `OpticaAPI/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=OpticaDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

### Ejecutar
```bash
cd OpticaAPI
dotnet run
```
La API inicia en `http://localhost:5175`  
Swagger UI: `http://localhost:5175/swagger`

La migración inicial se aplica automáticamente al iniciar.

## Frontend (optica-frontend)

```bash
cd optica-frontend
npm install
npm run dev
```
App disponible en `http://localhost:5173`

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pacientes` | Listar pacientes (con `?search=`, `?page=`, `?pageSize=`) |
| GET | `/api/pacientes/{id}` | Obtener paciente |
| GET | `/api/pacientes/{id}/graduaciones` | Graduaciones de un paciente |
| POST | `/api/pacientes` | Crear paciente |
| PUT | `/api/pacientes/{id}` | Actualizar paciente |
| DELETE | `/api/pacientes/{id}` | Eliminar paciente (soft delete) |
| GET | `/api/graduaciones` | Listar graduaciones (`?pacienteId=`, `?desde=`, `?hasta=`, `?optometrista=`) |
| GET | `/api/graduaciones/{id}` | Obtener graduación |
| POST | `/api/graduaciones` | Crear graduación |
| PUT | `/api/graduaciones/{id}` | Actualizar graduación |
| DELETE | `/api/graduaciones/{id}` | Eliminar graduación |
| POST | `/api/import/csv` | Importar desde archivo CSV |
| GET | `/api/import/plantilla` | Descargar plantilla CSV |

## Importación CSV

Descargar la plantilla desde la página de importación o desde `/api/import/plantilla`.

Formato de columnas:
```
Nombre,Apellido,FechaNacimiento,Telefono,Email,FechaGraduacion,
OD_Esfera,OD_Cilindro,OD_Eje,OD_Adicion,OD_AV,
OI_Esfera,OI_Cilindro,OI_Eje,OI_Adicion,OI_AV,
DistanciaPupilar,Observaciones,Optometrista
```
- Fechas: `dd/MM/yyyy`
- Decimales: usar punto `.` (ej: `-1.75`)
