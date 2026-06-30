@echo off
echo ========================================
echo breeze-center Startup Script
echo ========================================
echo.

REM Check if Go is installed
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Go not found, please install Go first
    pause
    exit /b 1
)

REM Check if pnpm is installed
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm not found, please install pnpm first
    pause
    exit /b 1
)

echo [1/4] Checking backend binary...
if not exist "server\bin\server.exe" (
    echo [BUILD] Backend not compiled, building now...
    cd server
    go build -o bin\server.exe .\cmd\server
    if %errorlevel% neq 0 (
        echo [ERROR] Backend build failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [DONE] Backend build successful
) else (
    echo [SKIP] Backend already compiled
)

echo.
echo [2/4] Checking frontend dependencies...
if not exist "web\node_modules" (
    echo [INSTALL] Frontend dependencies not installed, installing now...
    cd web
    pnpm install --ignore-scripts
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [DONE] Frontend dependencies installed
) else (
    echo [SKIP] Frontend dependencies already installed
)

echo.
echo [3/4] Starting backend server (port 8080)...
start "breeze-center Backend" cmd /k "cd /d %~dp0server && bin\server.exe --config ..\config --data ..\data"
timeout /t 2 /nobreak >nul

echo.
echo [4/4] Starting frontend dev server (port 4321)...
start "breeze-center Frontend" cmd /k "cd /d %~dp0web && npx vite"

echo.
echo ========================================
echo Startup Complete!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:4321
echo Admin:    http://localhost:4321/admin
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:4321

echo.
echo To stop servers, close the command windows
echo or run stop.bat
echo.
