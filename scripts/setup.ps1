$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$VenvPython = Join-Path $Backend ".venv\Scripts\python.exe"

Write-Host "`n[NovaMarket] Preparando el proyecto..." -ForegroundColor Cyan

$Python = Get-ChildItem -Path "$env:USERPROFILE\.cache\codex-runtimes" -Filter python.exe -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*dependencies\python\python.exe" } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $Python) {
    $PythonCommand = Get-Command py -ErrorAction SilentlyContinue
    if ($PythonCommand) { $Python = $PythonCommand.Source }
}
if (-not $Python) {
    $PythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if ($PythonCommand) { $Python = $PythonCommand.Source }
}
if (-not $Python) {
    throw "No se encontró Python 3.11 o superior. Instálalo desde python.org y vuelve a ejecutar este script."
}

if (-not (Test-Path $VenvPython)) {
    Write-Host "Creando entorno virtual de Python..."
    & $Python -m venv (Join-Path $Backend ".venv")
}

Write-Host "Instalando dependencias de la API..."
& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r (Join-Path $Backend "requirements.txt")

Write-Host "Instalando dependencias de React..."
Push-Location $Frontend
try { npm install } finally { Pop-Location }

Write-Host "`nListo. Ejecuta .\scripts\start.ps1 para iniciar NovaMarket." -ForegroundColor Green

