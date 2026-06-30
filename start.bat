@echo off
chcp 65001 >nul
echo ========================================
echo breeze-center 启动脚本
echo ========================================
echo.

REM 检查 Go 是否安装
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Go，请先安装 Go
    pause
    exit /b 1
)

REM 检查 pnpm 是否安装
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 pnpm，请先安装 pnpm
    pause
    exit /b 1
)

echo [1/4] 检查后端二进制文件...
if not exist "server\bin\server.exe" (
    echo [构建] 后端未编译，正在构建...
    cd server
    go build -o bin\server.exe .\cmd\server
    if %errorlevel% neq 0 (
        echo [错误] 后端构建失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [完成] 后端构建成功
) else (
    echo [跳过] 后端已编译
)

echo.
echo [2/4] 检查前端依赖...
if not exist "web\node_modules" (
    echo [安装] 前端依赖未安装，正在安装...
    cd web
    pnpm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [完成] 前端依赖安装成功
) else (
    echo [跳过] 前端依赖已安装
)

echo.
echo [3/4] 启动后端服务器 (端口 8080)...
start "breeze-center Backend" /MIN cmd /c "cd server && bin\server.exe --config ..\config --data ..\data"
timeout /t 2 /nobreak >nul

echo.
echo [4/4] 启动前端开发服务器 (端口 4321)...
start "breeze-center Frontend" cmd /c "cd web && pnpm dev"

echo.
echo ========================================
echo 启动完成！
echo ========================================
echo.
echo 后端: http://localhost:8080
echo 前端: http://localhost:4321
echo 管理后台: http://localhost:4321/admin
echo.
echo 按任意键打开浏览器...
pause >nul

start http://localhost:4321

echo.
echo 要停止服务器，请关闭对应的命令行窗口
echo.
