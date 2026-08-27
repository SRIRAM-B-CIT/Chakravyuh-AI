# =========================================================================
# Chakravyuh AI: 1-Click Docker Startup Script for Windows (PowerShell)
# =========================================================================

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       🛡️  CHAKRAVYUH AI: WORLD MODEL CYBER DEFENSE CORE        " -ForegroundColor Cyan
Write-Host "                 Docker Containerized Environment               " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker availability
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop for Windows: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Docker environment detected." -ForegroundColor Green
Write-Host "[2/3] Building and starting Chakravyuh AI containers..." -ForegroundColor Green
Write-Host ""

# Start services via docker compose
docker compose up --build -d backend sniffer frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start Docker Compose services." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[3/3] Services successfully started!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " 🌐 Next.js Cyber Command Dashboard:  http://localhost:3000" -ForegroundColor Green
Write-Host " ⚡ FastAPI Backend & API Docs:       http://localhost:8000/docs" -ForegroundColor Green
Write-Host " 📡 Real-Time WebSocket Stream:       ws://localhost:8000/ws/stream" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Useful Management Commands:" -ForegroundColor Yellow
Write-Host "  - View live logs:            docker compose logs -f" -ForegroundColor White
Write-Host "  - View backend logs:         docker compose logs -f backend" -ForegroundColor White
Write-Host "  - View sniffer logs:         docker compose logs -f sniffer" -ForegroundColor White
Write-Host "  - Launch attack suite:       docker compose run --rm attack-suite" -ForegroundColor White
Write-Host "  - Stop all services:         docker compose down" -ForegroundColor White
Write-Host ""
