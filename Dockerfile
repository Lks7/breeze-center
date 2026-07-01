# === 阶段1: 构建前端 ===
FROM node:20-alpine AS web-builder
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG http_proxy
ARG https_proxy
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN npm config set registry https://registry.npmmirror.com
WORKDIR /build
COPY web/package.json web/pnpm-lock.yaml ./
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile --ignore-workspace
COPY web/ ./
RUN pnpm --ignore-workspace build

# === 阶段2: 构建后端 ===
FROM golang:1.25-alpine AS server-builder
ENV GOPROXY=https://goproxy.cn,direct
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG http_proxy
ARG https_proxy
WORKDIR /build
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o breeze-center ./cmd/server

# === 阶段3: 运行时镜像 ===
FROM alpine:3.19
# 使用阿里云镜像加速
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add --no-cache ca-certificates tzdata wget
WORKDIR /app

# 复制编译产物
COPY --from=server-builder /build/breeze-center /app/
COPY --from=web-builder /build/dist /app/web/dist
COPY config/ /app/config/

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["/app/breeze-center", "-config", "/app/config"]
