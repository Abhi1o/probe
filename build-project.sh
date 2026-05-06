#!/bin/bash

# Probe Platform - Complete Build Script
# This script creates the entire project structure following the documentation

set -e

echo "🚀 Building Probe Platform..."
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directory structure
echo -e "${BLUE}📁 Creating directory structure...${NC}"

mkdir -p backend/src/{common/{decorators,filters,guards,interceptors,pipes,utils},config,modules/{auth/{strategies,guards,dto},users/{entities,dto},programs/{entities,dto},transactions/{entities,dto},monitor,indexer/{parsers,processors},analytics/{aggregators},alerts/{entities,dto,rules},notifications/{providers},solana/{rpc,utils}},database/prisma}

mkdir -p frontend/src/{app/{(auth)/{login,register},(dashboard)/{dashboard,programs,transactions,analytics,alerts,settings},api},components/{ui,dashboard,programs,transactions,charts,layout},lib/{api,websocket,solana,utils},hooks,store,types,config}

mkdir -p contracts/{programs/probe-sdk/src,tests}

mkdir -p scripts/{deployment,database,monitoring}

mkdir -p monitoring/{prometheus,grafana/dashboards}

mkdir -p .github/workflows

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create monitoring configs
echo -e "${BLUE}📊 Creating monitoring configurations...${NC}"

cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'probe-backend'
    static_configs:
      - targets: ['backend:9464']
    metrics_path: '/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

echo -e "${GREEN}✅ Monitoring configs created${NC}"

# Create deployment scripts
echo -e "${BLUE}🚀 Creating deployment scripts...${NC}"

cat > scripts/deployment/deploy-local.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Probe locally..."
docker-compose up -d
echo "✅ Deployment complete!"
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:3000"
echo "API Docs: http://localhost:3000/api/docs"
EOF

chmod +x scripts/deployment/deploy-local.sh

cat > scripts/database/init.sh << 'EOF'
#!/bin/bash
echo "🗄️  Initializing database..."
cd backend
npx prisma migrate deploy
npx prisma db seed
echo "✅ Database initialized!"
EOF

chmod +x scripts/database/init.sh

echo -e "${GREEN}✅ Scripts created${NC}"

# Create GitHub Actions workflow
cat > .github/workflows/ci.yml << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm test
      - name: Run linter
        run: cd backend && npm run lint

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npm test
      - name: Build
        run: cd frontend && npm run build
EOF

echo -e "${GREEN}✅ CI/CD workflow created${NC}"

echo ""
echo "================================"
echo -e "${GREEN}✅ Project structure complete!${NC}"
echo ""
echo "Next steps:"
echo "1. cd backend && npm install"
echo "2. cd frontend && npm install"
echo "3. Copy .env.example to .env and configure"
echo "4. Run: docker-compose up -d"
echo "5. Run: ./scripts/database/init.sh"
echo ""
echo "🎉 Happy coding!"
