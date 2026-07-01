# Breeze Center 部署手册

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 可用内存
- 10GB+ 可用磁盘空间

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url> breeze-center
cd breeze-center
```

### 2. 配置环境变量

复制并编辑配置文件：

```bash
cp server/config.yaml server/config.yaml.local
# 编辑 config.yaml.local，修改端口、数据库路径等
```

创建前端环境变量文件（如果需要和风天气）：

```bash
cd web
cp .env.local.example .env.local
# 编辑 .env.local，填入 VITE_QWEATHER_KEY
```

### 3. 构建并启动

```bash
docker-compose up -d --build
```

### 4. 验证运行

访问 http://localhost:3000，检查服务状态：

```bash
curl http://localhost:3000/api/health
```

## 配置说明

### 端口映射

默认端口 `3000`，可在 `docker-compose.yml` 中修改：

```yaml
ports:
  - "8080:3000"  # 映射到 8080
```

### 数据持久化

数据库和文件存储在 `./data` 目录：

```
data/
├── breeze.db       # SQLite 数据库
├── breeze.db-shm   # SQLite 共享内存
└── breeze.db-wal   # SQLite 预写日志
```

**备份建议**：定期备份 `./data` 目录。

### 环境变量

在 `docker-compose.yml` 中添加环境变量：

```yaml
environment:
  - TZ=Asia/Shanghai
  - LOG_LEVEL=info
```

## 反向代理配置

### Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Caddy 示例

```caddy
your-domain.com {
    reverse_proxy localhost:3000
}
```

## 升级指南

### 1. 备份数据

```bash
cp -r ./data ./data.backup.$(date +%Y%m%d)
```

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 重新构建并启动

```bash
docker-compose down
docker-compose up -d --build
```

### 4. 验证升级

```bash
docker-compose logs -f --tail=50
curl http://localhost:3000/api/health
```

## 故障排查

### 查看日志

```bash
docker-compose logs -f
```

### 容器状态

```bash
docker-compose ps
```

### 进入容器

```bash
docker-compose exec breeze-center sh
```

### 数据库问题

如果数据库损坏，从备份恢复：

```bash
docker-compose down
rm -rf ./data
cp -r ./data.backup.YYYYMMDD ./data
docker-compose up -d
```

## 性能优化

### 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  breeze-center:
    # ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 数据库优化

SQLite 已启用 WAL 模式，性能已优化。如需进一步优化：

1. 定期清理旧数据（RSS 文章、通知）
2. 考虑使用 SSD 存储
3. 避免频繁重启（WAL 需要checkpoint）

## 安全建议

1. **不要暴露到公网**：个人中心建议仅内网访问
2. **使用反向代理**：通过 Nginx/Caddy 添加 HTTPS
3. **定期备份**：数据无价，定期备份 `./data`
4. **更新镜像**：定期 `git pull` + 重新构建

## 监控建议

### 健康检查

Docker 已配置健康检查，可通过以下命令查看：

```bash
docker inspect breeze-center | grep -A10 Health
```

### 日志管理

建议配置日志轮转：

```yaml
services:
  breeze-center:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 常见问题

### Q: 端口 3000 被占用？

修改 `docker-compose.yml` 中的端口映射。

### Q: 数据库无法访问？

检查 `./data` 目录权限：`chmod -R 755 ./data`

### Q: RSS 抓取失败？

检查容器网络：`docker-compose exec breeze-center ping baidu.com`

### Q: 前端页面空白？

1. 检查前端构建是否成功：`docker-compose logs | grep "web-builder"`
2. 检查静态文件是否存在：`docker-compose exec breeze-center ls -la /app/web/dist`

---

**技术支持**: 提交 Issue 到项目仓库
