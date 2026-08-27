@echo off
REM ==============================================================================
REM Chakravyuh AI: Demo E-Commerce Target Application Launcher (Port 5000)
REM ==============================================================================

echo ==================================================================
echo   🛒 Starting Chakravyuh Demo E-Commerce App on Port 5000...
echo   Live Target for Hackathon 'Before & After' DoS & SOAR Demos
echo ==================================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

set PORT=5000
set HOST=0.0.0.0

node demo_app.js
pause
