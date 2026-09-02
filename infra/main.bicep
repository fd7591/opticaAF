// ============================================================
//  ÓpticaSystem - Azure Infrastructure (Free Tier)
//  Recursos:
//    - Azure SQL Database (oferta gratuita serverless)
//    - App Service Plan F1 (gratuito)
//    - App Service (.NET 8 API)
//    - Static Web App Free (React frontend)
// ============================================================
targetScope = 'resourceGroup'

// ---- Parámetros ----

@description('Prefijo para nombrar todos los recursos.')
@minLength(3)
@maxLength(10)
param projectName string = 'optica'

@description('Región principal. Static Web Apps usa su propia región.')
param location string = resourceGroup().location

@description('Región para Static Web Apps (debe ser soportada).')
@allowed(['westus2', 'centralus', 'eastus2', 'eastus', 'westeurope', 'northeurope', 'eastasia'])
param staticWebAppLocation string = 'eastus2'

@description('Usuario administrador de SQL Server.')
param sqlAdminUser string = 'opticaadmin'

@description('Contraseña del administrador SQL (mín. 12 caracteres, mayúsculas, números y símbolos).')
@secure()
param sqlAdminPassword string

@description('Clave secreta JWT (mín. 32 caracteres). Cambiar en producción.')
@secure()
param jwtKey string

@description('Entorno de despliegue.')
@allowed(['Development', 'Staging', 'Production'])
param environment string = 'Production'

// ---- Variables ----
var suffix       = uniqueString(resourceGroup().id)
var sqlServerName = '${projectName}-sql-${suffix}'
var dbName        = 'OpticaDB'
var planName      = '${projectName}-plan'
var apiAppName    = '${projectName}-api-${suffix}'
var staticAppName = '${projectName}-web-${suffix}'
var tags          = { project: projectName, environment: environment, managedBy: 'bicep' }

// ============================================================
// 1. Azure SQL Server
// ============================================================
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminUser
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Permitir tráfico desde otros servicios Azure (App Service → SQL)
resource sqlFirewallAzure 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  name: 'AllowAzureServices'
  parent: sqlServer
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================================
// 2. Azure SQL Database - Oferta gratuita (serverless, auto-pause)
//    NOTA: Limitada a 1 BD gratuita por suscripción, 32 GB storage.
//    Si ya tienes una BD gratuita, cambia useFreeLimit a false
//    y el SKU a 'Basic' (aprox. USD 5/mes).
// ============================================================
resource sqlDb 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  name: dbName
  parent: sqlServer
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5_1'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    useFreeLimit: true
    freeLimitExhaustionBehavior: 'AutoPause'
    autoPauseDelay: 60                        // se pausa tras 60 min sin actividad
    minCapacity: any(json('0.5'))
    requestedBackupStorageRedundancy: 'Local' // más barato que Geo
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// ============================================================
// 3. App Service Plan - F1 (Free)
//    Límites: 60 min CPU/día, 1 GB RAM, 1 GB storage, sin SSL custom
// ============================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  tags: tags
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    reserved: false // Windows
  }
}

// ============================================================
// 4. App Service - .NET 8 API
// ============================================================
resource apiApp 'Microsoft.Web/sites@2023-01-01' = {
  name: apiAppName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      use32BitWorkerProcess: true          // necesario en F1
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT',  value: environment }
        { name: 'Jwt__Key',                value: jwtKey }
        { name: 'Jwt__Issuer',             value: 'OpticaAPI' }
        { name: 'Jwt__Audience',           value: 'OpticaFrontend' }
        { name: 'AllowedOrigins',          value: 'https://${staticAppName}.azurestaticapps.net' }
        { name: 'WEBSITE_RUN_FROM_PACKAGE', value: '1' }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${dbName};User Id=${sqlAdminUser};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

// ============================================================
// 5. Static Web App - Free tier (React frontend)
//    NOTA: La región debe ser una de las soportadas por SWA.
// ============================================================
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticAppName
  location: staticWebAppLocation
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// ============================================================
// Outputs
// ============================================================
output apiUrl            string = 'https://${apiApp.properties.defaultHostName}'
output staticWebAppUrl   string = 'https://${staticWebApp.properties.defaultHostname}'
output sqlServerFqdn     string = sqlServer.properties.fullyQualifiedDomainName
output apiAppName        string = apiApp.name
output staticWebAppName  string = staticWebApp.name
output resourceGroupName string = resourceGroup().name
