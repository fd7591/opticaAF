// Archivo de parámetros para el despliegue
// USO: az deployment group create \
//        --resource-group rg-optica \
//        --template-file main.bicep \
//        --parameters main.bicepparam
//
// IMPORTANTE: Los valores @secure() NO deben commitearse.
//             Úsalos como secretos en el pipeline o pásalos por CLI.

using './main.bicep'

param projectName           = 'optica'
param location              = 'eastus'
param staticWebAppLocation  = 'eastus2'
param sqlAdminUser          = 'opticaadmin'
param environment           = 'Production'

// ⚠️  Pasar estos valores como secretos en el pipeline, NO aquí:
// param sqlAdminPassword   = readEnvironmentVariable('SQL_ADMIN_PASSWORD')
// param jwtKey             = readEnvironmentVariable('JWT_KEY')
