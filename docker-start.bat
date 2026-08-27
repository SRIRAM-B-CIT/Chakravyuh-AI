@echo off
REM =========================================================================
REM Chakravyuh AI: 1-Click Docker Startup Script for Windows (CMD)
REM =========================================================================

echo ================================================================
echo        [+] CHAKRAVYUH AI: WORLD MODEL CYBER DEFENSE CORE
echo                 Docker Containerized Environment
echo ================================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not running.
    echo Please make sure Docker Desktop for Windows is installed and running:
    echo https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [1/3] Docker detected.
echo [2/3] Building and launching Chakravyuh AI containers...
echo.

docker compose up --build -d backend sniffer frontend

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start Docker Compose services.
    pause
    exit /b 1
)

echo.
echo [3/3] All services started successfully!
echo ================================================================
echo  * Next.js Command Dashboard:  http://localhost:3000
echo  * FastAPI Backend & API Docs: http://localhost:8000/docs
echo  * WebSocket Stream:           ws://localhost:8000/ws/stream
echo ================================================================
echo.
echo Useful Commands:
echo   - View live logs:      docker compose logs -f
echo   - View sniffer logs:   docker compose logs -f sniffer
echo   - Launch attack suite: docker compose run --rm attack-suite
echo   - Stop all services:   docker compose down
echo.
pause
