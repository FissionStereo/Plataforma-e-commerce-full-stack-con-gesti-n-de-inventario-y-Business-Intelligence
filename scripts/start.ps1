$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Backend ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    throw "Primero ejecuta .\scripts\setup.ps1"
}

Write-Host "`nIniciando NovaMarket..." -ForegroundColor Cyan
$Api = Start-Process -FilePath $Python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" -WorkingDirectory $Backend -PassThru
$Web = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $Frontend -PassThru

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"
Write-Host "Tienda: http://127.0.0.1:5173"
Write-Host "Admin:  http://127.0.0.1:5173/admin"
Write-Host "API:    http://127.0.0.1:8000/docs"
Write-Host "`nCierra esta ventana para detener los servicios."

try {
    Wait-Process -Id $Api.Id, $Web.Id
}
finally {
    Stop-Process -Id $Api.Id, $Web.Id -Force -ErrorAction SilentlyContinue
}

