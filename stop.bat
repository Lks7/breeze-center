@echo off
chcp 65001 >nul
echo ========================================
echo breeze-center 停止脚本
echo ========================================
echo.

echo [1/2] 停止后端服务器...
taskkill /FI "WindowTitle eq breeze-center Backend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [完成] 后端已停止
) else (
    echo [跳过] 后端未运行
)

echo.
echo [2/2] 停止前端开发服务器...
taskkill /FI "WindowTitle eq breeze-center Frontend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [完成] 前端已停止
) else (
    echo [跳过] 前端未运行
)

echo.
echo ========================================
echo 所有服务已停止
echo ========================================
echo.
pause
