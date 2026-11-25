# EcoAI setup for Windows PowerShell (ASCII only so Windows PowerShell 5.1 parses it correctly).
#   .\setup.ps1              -> installs PyTorch CUDA if nvidia-smi is found, otherwise CPU
#   .\setup.ps1 -Cpu         -> force the CPU build of PyTorch
#   .\setup.ps1 -SkipFrontend
param(
    [switch]$Cpu,
    [switch]$SkipFrontend
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host 'Python 3.10-3.12 not found. Install from https://www.python.org/downloads/ (tick "Add python.exe to PATH").' -ForegroundColor Red
    exit 1
}

Set-Location "$root\backend"
if (-not (Test-Path .venv)) { python -m venv .venv }
& .\.venv\Scripts\python.exe -m pip install --upgrade pip

$hasGpu = (-not $Cpu) -and [bool](Get-Command nvidia-smi -ErrorAction SilentlyContinue)
if ($hasGpu) {
    Write-Host 'NVIDIA GPU found -> installing PyTorch with CUDA 12.4' -ForegroundColor Green
    & .\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
} else {
    Write-Host 'Installing the CPU build of PyTorch' -ForegroundColor Yellow
    & .\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
}
& .\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt

if (-not (Test-Path "$root\.env")) { Copy-Item "$root\.env.example" "$root\.env" }

if (-not $SkipFrontend) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host 'Node.js 18+ not found (20 LTS recommended). Install from https://nodejs.org/ and run again.' -ForegroundColor Red
        exit 1
    }
    Set-Location "$root\frontend"
    npm install
}

Set-Location $root
Write-Host ''
Write-Host 'Done. Next steps:' -ForegroundColor Green
Write-Host '  1) Add model weights (README section 5)'
Write-Host '  2) Run .\start-backend.ps1 and .\start-frontend.ps1 in two separate windows'
