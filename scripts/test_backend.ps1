<#
PowerShell script de prueba para el backend del prototipo.
Uso:
  - Desde la raíz del proyecto ejecuta:
      pwsh ./scripts/test_backend.ps1
  - Opciones:
      -ChatId <chat_id>    (por defecto: LOCAL_TEST)
      -Backend <url>       (por defecto: lee `js/config.js` o usa un valor de ejemplo)

Qué hace:
  1) Detecta la URL del backend (lee `js/config.js` si existe)
  2) Construye un pedido de prueba y lo envía a `/submit_order`
    3) Hace polling a `/get_order/<order_id>` cada 5s durante 30s
  4) Lista `/get_orders` y filtra por `chat_id`
  5) Llama a `/reverse_geocode?lat=...&lon=...`
  6) Abre la factura en el navegador si hay `order_id`
#>

param(
    [string]$ChatId = "LOCAL_TEST",
    [string]$Backend = "",
    [int]$MaxSeconds = 30,
    [int]$Interval = 5
)

Set-StrictMode -Version Latest

Write-Host "Iniciando pruebas backend..." -ForegroundColor Green
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptDir\..\

# Intentar leer BACKEND_URL desde js/config.js si no se pasó por parámetro
if ([string]::IsNullOrWhiteSpace($Backend)) {
    $configPath = Join-Path (Get-Location) 'js\config.js'
    if (Test-Path $configPath) {
        $content = Get-Content $configPath -Raw -ErrorAction SilentlyContinue
        if ($content -match 'BACKEND_URL\s*=\s*"([^"]+)"') {
            $Backend = $matches[1]
            Write-Host "Backend leído desde js/config.js: $Backend"
        }
    }
}

if ([string]::IsNullOrWhiteSpace($Backend)) {
    Write-Warning "No se encontró BACKEND; usa el parámetro -Backend 'https://tu-backend' o actualiza js/config.js"
    Pop-Location
    exit 1
}

# Validar formato de URL
if ($Backend -notmatch '^https?://') {
    Write-Error "La URL del backend debe comenzar por http:// o https://. BACKEND='$Backend'"
    Pop-Location
    exit 1
}

# Construir pedido de prueba
$ts = [int64]((Get-Date).ToUniversalTime() - (Get-Date "1970-01-01T00:00:00Z")).TotalMilliseconds
$order = [pscustomobject]@{
    id            = "TEST-$ts"
    items         = @(
        @{ id = "pizza_margarita"; name = "Margarita"; price = 35.00; quantity = 1; addons = @() }
    )
    address       = "Prueba: Calle Falsa 123"
    location      = @{ latitude = -17.7833; longitude = -63.1821 }
    paymentMethod = "Efectivo"
    date          = (Get-Date).ToString("o")
    date_ts       = $ts
    channel       = "telegram_webapp"
    currency      = "Bs"
    status        = "Pendiente"
    total         = 35.00
}

$payload = [pscustomobject]@{
    chat_id           = $ChatId
    order             = $order
    notify_restaurant = $true
}

# Función segura para POST JSON y obtener cuerpo incluso en errores
function Invoke-JsonPost($uri, $obj) {
    try {
        $json = $obj | ConvertTo-Json -Depth 12
    }
    catch {
        Write-Warning "Error serializando objeto a JSON: $($_.Exception.Message)"
        return $null
    }

    try {
        $resp = Invoke-WebRequest -Uri $uri -Method Post -Body $json -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
        $body = $resp.Content
        try { return $body | ConvertFrom-Json } catch { return @{ raw = $body } }
    }
    catch {
        Write-Warning "Error POST $uri : $($_.Exception.Message)"
        try {
            $webResp = $_.Exception.Response
            if ($webResp -ne $null) {
                $stream = $webResp.GetResponseStream()
                $sr = New-Object System.IO.StreamReader($stream)
                $text = $sr.ReadToEnd()
                Write-Host "Server response body:`n$text" -ForegroundColor Yellow
            }
        }
        catch { }
        return $null
    }
}

function Invoke-JsonGet($uri) {
    try {
        return Invoke-RestMethod -Uri $uri -Method Get -ErrorAction Stop
    }
    catch {
        Write-Warning "Error GET $uri : $($_.Exception.Message)"
        return $null
    }
}

# 1) Enviar pedido
Write-Host "Enviando pedido de prueba a $Backend/submit_order ..." -ForegroundColor Cyan
$response = $null
try {
    $response = Invoke-JsonPost "$Backend/submit_order" $payload
}
catch {
    Write-Warning "Error ejecutando Invoke-JsonPost: $($_.Exception.Message)"
    $response = $null
}

if ($null -eq $response) {
    Write-Warning "submit_order devolvió respuesta vacía o fallo. Revisa el cuerpo del servidor más arriba (Server response body)."
}

if ($null -ne $response -and $response.order_id) {
    $orderId = $response.order_id
}
else {
    $orderId = $order.id
}
Write-Host "Respuesta submit_order. order_id: $orderId" -ForegroundColor Green

# 2) Polling a /get_order/<order_id>
$tries = [math]::Ceiling($MaxSeconds / $Interval)
Write-Host "Polling durante hasta $MaxSeconds segundos (intervalo $Interval s, $tries intentos)." -ForegroundColor DarkCyan
for ($i = 0; $i -lt $tries; $i++) {
    Write-Host "Polling $Backend/get_order/$orderId (intento $($i+1)/$tries)..."
    $res = Invoke-JsonGet "$Backend/get_order/$orderId"
    if ($null -ne $res) {
        Write-Host "  status: $($res.status)  id: $($res.id)" -ForegroundColor Cyan
        # Mostrar el JSON completo para diagnóstico
        try { Write-Host ($res | ConvertTo-Json -Depth 6) -ForegroundColor DarkGray } catch { }
        if ($res.status -and $res.status -ne 'Pendiente') { break }
    }
    Start-Sleep -Seconds $Interval
}

# 3) Listar /get_orders y filtrar por chat_id
Write-Host "Obteniendo todos los pedidos ($Backend/get_orders) y filtrando por chat_id=$ChatId" -ForegroundColor Cyan
$all = Invoke-JsonGet "$Backend/get_orders"
if ($null -ne $all) {
    $mine = $all | Where-Object { ([string]$_.chat_id) -eq $ChatId }
    if ($mine) {
        Write-Host "Pedidos encontrados para ${ChatId}:" -ForegroundColor Green
        $mine | Select-Object id, status, date | Format-Table -AutoSize
    }
    else {
        Write-Host "No se encontraron pedidos para $ChatId" -ForegroundColor Yellow
    }
}

# 4) Probar reverse_geocode
$lat = -17.7833; $lon = -63.1821
Write-Host "Probando reverse_geocode: $Backend/reverse_geocode?lat=$lat&lon=$lon" -ForegroundColor Cyan
$r = Invoke-JsonGet "$Backend/reverse_geocode?lat=$lat&lon=$lon"
if ($null -ne $r) { $r | Format-List * }

# 5) Abrir factura en el navegador
$facturaUrl = "$Backend/factura/$orderId"
Write-Host "Intentando abrir factura: $facturaUrl" -ForegroundColor Cyan
try { Start-Process $facturaUrl } catch { Write-Warning "No se pudo abrir factura: $($_.Exception.Message)" }

Pop-Location
Write-Host "Prueba finalizada." -ForegroundColor Green
