#!/bin/bash

# breeze-center 一键启动脚本
# 支持 Linux / macOS

set -e

echo "========================================"
echo "breeze-center 启动脚本"
echo "========================================"
echo ""

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "[错误] 未找到 Go，请先安装 Go"
    exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "[错误] 未找到 pnpm，请先安装 pnpm"
    exit 1
fi

echo "[1/4] 检查后端二进制文件..."
if [ ! -f "server/bin/server" ]; then
    echo "[构建] 后端未编译，正在构建..."
    cd server
    go build -o bin/server ./cmd/server
    cd ..
    echo "[完成] 后端构建成功"
else
    echo "[跳过] 后端已编译"
fi

echo ""
echo "[2/4] 检查前端依赖..."
if [ ! -d "web/node_modules" ]; then
    echo "[安装] 前端依赖未安装，正在安装..."
    cd web
    pnpm install
    cd ..
    echo "[完成] 前端依赖安装成功"
else
    echo "[跳过] 前端依赖已安装"
fi

echo ""
echo "[3/4] 启动后端服务器 (端口 8080)..."
cd server
./bin/server --config ../config --data ../data &
BACKEND_PID=$!
cd ..
sleep 2

echo ""
echo "[4/4] 启动前端开发服务器 (端口 4321)..."
cd web
pnpm dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "启动完成！"
echo "========================================"
echo ""
echo "后端: http://localhost:8080"
echo "前端: http://localhost:4321"
echo "管理后台: http://localhost:4321/admin"
echo ""
echo "后端 PID: $BACKEND_PID"
echo "前端 PID: $FRONTEND_PID"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待 Ctrl+C
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止'; exit 0" INT

# 保持脚本运行
wait
