@echo off
echo ========================================
echo breeze-center Stop Script
echo ========================================
echo.

echo [1/2] Stopping backend server...
taskkill /FI "WindowTitle eq breeze-center Backend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [DONE] Backend stopped
) else (
    echo [SKIP] Backend not running
)

echo.
echo [2/2] Stopping frontend dev server...
taskkill /FI "WindowTitle eq breeze-center Frontend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [DONE] Frontend stopped
) else (
    echo [SKIP] Frontend not running
)

echo.
echo ========================================
echo All services stopped
echo ========================================
echo.
pause
