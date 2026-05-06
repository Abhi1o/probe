# Deployment Guide

## 🎯 Overview

Complete deployment guide for the Probe platform covering development, staging, and production environments.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Backup & Recovery](#backup--recovery)

## 🔧 Prerequisites

### Required Software

```bash
# Docker & Docker Compose
docker --version  # >= 24.0
docker-compose --version  # >= 2.20

# Node.js (for local development)
node --version  # >= 18.x
npm --version  # >= 9.x

# PostgreSQL Client (for database management)
psql --version  # >= 15.x
```

### Cloud Services (Production)

- **Hosting**: AWS, GCP, or DigitalOcean
- **Database**: Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- **Redis**: Managed Redis (AWS ElastiCache, Redis Cloud)
- **CDN**: CloudFlare or AWS CloudFront
- **Email**: SendGrid, AWS SES, or Mailgun
- **Monitoring**: Datadog, New Relic, or Grafana Cloud

## 🐳 Docker Deployment

### Docker Compose Setup

**`docker-compose.yml`**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: probe-postgres
    environment:
      POSTGRES_USER: probe
      POSTGRES_PASSWORD: probe_password
      POSTGRES_DB: probe
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - probe-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U probe"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: probe-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - probe-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: probe-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://probe:probe_password@postgres:5432/probe
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SOLANA_MAINNET_RPC: ${SOLANA_MAINNET_RPC}
      SOLANA_DEVNET_RPC: ${SOLANA_DEVNET_RPC}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - probe-network
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:3000/api/v1
        NEXT_PUBLIC_WS_URL: http://localhost:3000
    container_name: probe-frontend
    ports:
      - "3001:3000"
    depends_on:
      - backend
    networks:
      - probe-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: probe-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - probe-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  probe-network:
    driver: bridge
```

### Backend Dockerfile

**`backend/Dockerfile`**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile

**`frontend/Dockerfile`**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL

# Set environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

### Nginx Configuration

**`nginx/nginx.conf`**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Frontend
        location / {
            limit_req zone=general_limit burst=50 nodelay;
            
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Deploy with Docker Compose

```bash
# Create .env file
cp .env.example .env

# Edit .env with production values
nano .env

# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database (optional)
docker-compose exec backend npx prisma db seed

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🚀 Production Deployment

### AWS Deployment (ECS + RDS)

#### 1. Setup RDS PostgreSQL

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier probe-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username probe \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name probe-subnet-group \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"
```

#### 2. Setup ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id probe-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name probe-subnet-group \
  --security-group-ids sg-xxxxx
```

#### 3. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t probe-backend ./backend
docker tag probe-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/probe-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/probe-backend:latest

# Build and push frontend
docker build -t probe-frontend ./frontend
docker tag probe-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/probe-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/probe-frontend:latest
```

#### 4. Create ECS Task Definition

**`ecs-task-definition.json`**

```json
{
  "family": "probe-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "probe-backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/probe-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:probe/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxxx:secret:probe/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/probe-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 5. Create ECS Service

```bash
# Create ECS service
aws ecs create-service \
  --cluster probe-cluster \
  --service-name probe-backend \
  --task-definition probe-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxxxx:targetgroup/probe-backend/xxxxx,containerName=probe-backend,containerPort=3000"
```

### Kubernetes Deployment

**`k8s/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: probe-backend
  labels:
    app: probe-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: probe-backend
  template:
    metadata:
      labels:
        app: probe-backend
    spec:
      containers:
      - name: probe-backend
        image: probe-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: probe-secrets
              key: database-url
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: probe-backend-service
spec:
  selector:
    app: probe-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 📊 Monitoring & Logging

### Prometheus Configuration

**`prometheus.yml`**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'probe-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
```

### Grafana Dashboard

Import dashboard JSON for:
- API request rates
- Response times
- Error rates
- Database connections
- Redis cache hit rates
- WebSocket connections

### Application Logging

```typescript
// Winston logger configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

## 💾 Backup & Recovery

### Database Backup

```bash
# Automated daily backup script
#!/bin/bash

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/probe_backup_$DATE.sql"

# Create backup
pg_dump -h localhost -U probe -d probe > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://probe-backups/postgres/

# Delete local backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Database Restore

```bash
# Restore from backup
gunzip probe_backup_20260430_120000.sql.gz
psql -h localhost -U probe -d probe < probe_backup_20260430_120000.sql
```

### Redis Backup

```bash
# Save Redis snapshot
redis-cli BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backups/redis/dump_$(date +%Y%m%d).rdb
```

## 🔒 Security Checklist

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules
- [ ] Enable database encryption at rest
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up DDoS protection (CloudFlare)
- [ ] Regular security updates
- [ ] Implement backup strategy
- [ ] Configure monitoring and alerts

---

**Next**: [08-TESTING-STRATEGY.md](./08-TESTING-STRATEGY.md)
