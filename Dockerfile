# === 阶段1: 构建前端 ===
FROM node:20-alpine AS web-builder
WORKDIR /build
COPY web/package.json web/pnpm-lock.yaml ./
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

# === 阶段2: 构建后端 ===
FROM golang:1.23-alpine AS server-builder
WORKDIR /build
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o breeze-center ./cmd/server

# === 阶段3: 运行时镜像 ===
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app

# 复制编译产物
COPY --from=server-builder /build/breeze-center /app/
COPY --from=web-builder /build/dist /app/web/dist
COPY server/config.yaml /app/config.yaml

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["/app/breeze-center"]
