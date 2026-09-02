#!/usr/bin/env bash
# ============================================================
#  Script de despliegue manual (alternativa al pipeline)
#  USO:
#    chmod +x infra/deploy.sh
#    ./infra/deploy.sh
# ============================================================
set -euo pipefail

# ---- Configuración (editar según tu entorno) ----
RESOURCE_GROUP="rg-optica-prod"
LOCATION="eastus"
PROJECT_NAME="optica"

# Leer secretos desde variables de entorno o pedir por consola
SQL_PASSWORD="${SQL_ADMIN_PASSWORD:-}"
JWT_SECRET="${JWT_KEY:-}"

if [ -z "$SQL_PASSWORD" ]; then
  read -rsp "Contraseña SQL admin (mín. 12 chars): " SQL_PASSWORD
  echo
fi

if [ -z "$JWT_SECRET" ]; then
  read -rsp "Clave JWT (mín. 32 chars): " JWT_SECRET
  echo
fi

# ---- Login (omitir si ya estás logueado) ----
echo "→ Verificando login en Azure..."
az account show > /dev/null 2>&1 || az login

# ---- Crear Resource Group ----
echo "→ Creando resource group '$RESOURCE_GROUP' en '$LOCATION'..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --tags project="$PROJECT_NAME" managedBy=bicep \
  --output table

# ---- Validar Bicep ----
echo "→ Validando template Bicep..."
az deployment group validate \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters \
      projectName="$PROJECT_NAME" \
      location="$LOCATION" \
      sqlAdminUser=opticaadmin \
      sqlAdminPassword="$SQL_PASSWORD" \
      jwtKey="$JWT_SECRET" \
      environment=Production \
  --output table

# ---- What-if ----
echo ""
echo "→ Preview de cambios (what-if):"
az deployment group what-if \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters \
      projectName="$PROJECT_NAME" \
      location="$LOCATION" \
      sqlAdminUser=opticaadmin \
      sqlAdminPassword="$SQL_PASSWORD" \
      jwtKey="$JWT_SECRET" \
      environment=Production

echo ""
read -rp "¿Continuar con el despliegue? (s/N): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
  echo "Despliegue cancelado."
  exit 0
fi

# ---- Desplegar ----
echo "→ Desplegando infraestructura..."
RESULT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters \
      projectName="$PROJECT_NAME" \
      location="$LOCATION" \
      sqlAdminUser=opticaadmin \
      sqlAdminPassword="$SQL_PASSWORD" \
      jwtKey="$JWT_SECRET" \
      environment=Production \
  --output json)

# ---- Mostrar outputs ----
API_URL=$(echo "$RESULT" | jq -r '.properties.outputs.apiUrl.value')
SWA_URL=$(echo "$RESULT" | jq -r '.properties.outputs.staticWebAppUrl.value')
API_APP=$(echo "$RESULT" | jq -r '.properties.outputs.apiAppName.value')
SWA_NAME=$(echo "$RESULT" | jq -r '.properties.outputs.staticWebAppName.value')
SQL_FQDN=$(echo "$RESULT" | jq -r '.properties.outputs.sqlServerFqdn.value')

echo ""
echo "============================================"
echo "  ✅  Infraestructura desplegada"
echo "============================================"
echo "  API URL:            $API_URL"
echo "  Frontend URL:       $SWA_URL"
echo "  App Service:        $API_APP"
echo "  Static Web App:     $SWA_NAME"
echo "  SQL Server FQDN:    $SQL_FQDN"
echo ""
echo "  Próximos pasos:"
echo "  1. Configura AZURE_API_APP_NAME=$API_APP en el pipeline de API"
echo "  2. Obtén el token del SWA:"
echo "     az staticwebapp secrets list --name $SWA_NAME --query 'properties.apiKey' -o tsv"
echo "  3. Configura AZURE_STATIC_WEB_APP_TOKEN con ese token"
echo "  4. Configura AZURE_API_URL=$API_URL en el pipeline de frontend"
echo "============================================"
