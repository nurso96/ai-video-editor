# Production Deployment Guide

This guide covers deploying the AI Video Editor full-stack application to production.

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Redis server
- FFmpeg
- PostgreSQL (recommended for production, SQLite works for development)
- Nginx or similar reverse proxy (recommended)
- SSL certificate (for HTTPS)

## Backend Deployment

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Database (use PostgreSQL in production)
AIVE_DATABASE_URL=postgresql://user:password@localhost:5432/ai_video_editor

# Redis
AIVE_REDIS_URL=redis://localhost:6379/0

# AI Models
AIVE_WHISPER_MODEL=small.en
AIVE_CHAT_BACKEND=stub
AIVE_HF_TEXT_MODEL=distilgpt2

# Watermark
AIVE_WATERMARK_ENABLED=true
AIVE_WATERMARK_TEXT=ai-video-editor

# CORS (set to your frontend domain)
AIVE_CORS_ORIGINS=https://yourdomain.com

# Logging
AIVE_DEBUG=false
AIVE_LOG_LEVEL=INFO

# Media Storage
# For production, consider using S3 or similar
AIVE_MEDIA_ROOT=/var/www/media
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install gunicorn  # For production WSGI server
```

### 3. Database Setup

If using PostgreSQL:

```bash
# Install Alembic for migrations
pip install alembic

# Initialize Alembic (first time only)
alembic init alembic

# Generate migration from models
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

Or simply let the app create tables (development approach):
```python
# Tables are auto-created on startup via init_db() in backend/app.py
```

### 4. Start Redis

```bash
# Ubuntu/Debian
sudo systemctl start redis

# Or via Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. Start RQ Worker

Background render jobs require a worker process:

```bash
# In a separate terminal/process
rq worker renders --url redis://localhost:6379/0 --burst --max-jobs 10
```

For production, use a process manager like systemd or supervisor:

**systemd service example** (`/etc/systemd/system/ai-video-worker.service`):

```ini
[Unit]
Description=AI Video Editor RQ Worker
After=redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ai-video-editor
Environment="PATH=/var/www/ai-video-editor/venv/bin"
ExecStart=/var/www/ai-video-editor/venv/bin/rq worker renders --url redis://localhost:6379/0
Restart=always

[Install]
WantedBy=multi-user.target
```

### 6. Start Backend Server

**Development:**
```bash
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

**Production (using Gunicorn):**
```bash
gunicorn backend.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

**systemd service example** (`/etc/systemd/system/ai-video-backend.service`):

```ini
[Unit]
Description=AI Video Editor Backend
After=network.target redis.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/ai-video-editor
Environment="PATH=/var/www/ai-video-editor/venv/bin"
ExecStart=/var/www/ai-video-editor/venv/bin/gunicorn backend.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 7. Nginx Configuration

```nginx
upstream ai_video_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    client_max_body_size 500M;  # Allow large video uploads

    location / {
        proxy_pass http://ai_video_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeouts for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location /media/ {
        alias /var/www/ai-video-editor/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Frontend Deployment

### 1. Environment Setup

Create `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api
```

### 2. Install Dependencies

```bash
cd frontend
npm ci --production
```

### 3. Build Production Bundle

```bash
npm run build
```

This creates an optimized production build in `.next/`

### 4. Deployment Options

#### Option A: Next.js Standalone Server

```bash
# Run Next.js production server
npm start
```

**systemd service example** (`/etc/systemd/system/ai-video-frontend.service`):

```ini
[Unit]
Description=AI Video Editor Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ai-video-editor/frontend
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

**Nginx configuration:**

```nginx
upstream ai_video_frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location / {
        proxy_pass http://ai_video_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option B: Static Export (if no SSR needed)

```bash
# Configure next.config.js for static export
npm run build
npm run export  # Generates /out directory

# Serve with Nginx
```

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    root /var/www/ai-video-editor/frontend/out;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Option C: Vercel/Netlify (Serverless)

1. Connect repository to Vercel/Netlify
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api`
5. Deploy

## Docker Deployment

### Docker Compose Example

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - AIVE_DATABASE_URL=postgresql://postgres:password@db:5432/ai_video_editor
      - AIVE_REDIS_URL=redis://redis:6379/0
      - AIVE_CORS_ORIGINS=https://yourdomain.com
    volumes:
      - media_data:/app/media
    depends_on:
      - redis
      - db

  worker:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: rq worker renders --url redis://redis:6379/0
    environment:
      - AIVE_DATABASE_URL=postgresql://postgres:password@db:5432/ai_video_editor
      - AIVE_REDIS_URL=redis://redis:6379/0
    volumes:
      - media_data:/app/media
    depends_on:
      - redis
      - db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ai_video_editor
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  media_data:
  postgres_data:
```

**Dockerfile.backend:**

```dockerfile
FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY backend/ ./backend/
COPY .env .

EXPOSE 8000

CMD ["gunicorn", "backend.app:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

**frontend/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

EXPOSE 3000

CMD ["npm", "start"]
```

## Security Considerations

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Secure API keys**: Never commit secrets to git
3. **CORS**: Set specific allowed origins, not `*`
4. **File upload validation**: Validate file types and sizes
5. **Rate limiting**: Use nginx rate limiting or application-level limits
6. **Database**: Use strong passwords, enable SSL connections
7. **Media storage**: Consider signed URLs for sensitive content
8. **Regular updates**: Keep dependencies updated

## Monitoring & Logging

### Application Logs

- Backend logs to stdout (capture with systemd/Docker)
- Frontend logs to stdout
- RQ worker logs job progress

### Recommended Monitoring Tools

- **Sentry**: Error tracking
- **Prometheus + Grafana**: Metrics and dashboards
- **CloudWatch/DataDog**: Cloud monitoring
- **Uptime Robot**: Uptime monitoring

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/api/healthz

# Should return:
# {"status":"ok","redis":true,"timestamp":"..."}
```

## Scaling Considerations

1. **Horizontal scaling**: Run multiple backend/worker instances
2. **Load balancing**: Use nginx/AWS ELB for traffic distribution
3. **Object storage**: Move media to S3/CloudFlare R2
4. **CDN**: Use CloudFlare/CloudFront for static assets
5. **Database**: Use connection pooling, read replicas
6. **Queue**: Redis Cluster for high availability
7. **Caching**: Add Redis caching layer for API responses

## Backup & Recovery

1. **Database backups**: Daily automated backups
2. **Media files**: Regular S3 backups with versioning
3. **Configuration**: Version control for all config files
4. **Disaster recovery**: Document recovery procedures

## Performance Optimization

1. **Frontend**: Enable Next.js image optimization
2. **Backend**: Use async/await properly, optimize queries
3. **Media**: Compress videos, use appropriate formats
4. **Caching**: Leverage Redis for frequently accessed data
5. **Network**: Enable HTTP/2, compression

## Troubleshooting

### Backend won't start
- Check Redis connection
- Verify database URL
- Check FFmpeg installation
- Review logs: `journalctl -u ai-video-backend`

### Frontend build fails
- Clear `.next` directory
- Delete `node_modules`, reinstall
- Check Node version (18+)

### Render jobs fail
- Check RQ worker is running
- Verify FFmpeg is installed
- Check media directory permissions
- Review worker logs: `journalctl -u ai-video-worker`

### CORS errors
- Verify `AIVE_CORS_ORIGINS` includes frontend domain
- Check protocol (http vs https)
- Ensure NEXT_PUBLIC_API_BASE is correct

## Support

For issues or questions:
- Check logs first
- Review CLAUDE.md for architecture details
- See README_BACKEND.md for API documentation
- Run `test_api_endpoints.py` to verify backend
