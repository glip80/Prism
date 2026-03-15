#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}

echo "========================================="
echo " Deploying to: $ENVIRONMENT"
echo "========================================="

# Build all services
echo "Building services..."
cd frontend && npm run build && cd ..
cd backend/auth && npm run build && cd ../..
cd backend/layout && npm run build && cd ../..
cd backend/widget && npm run build && cd ../..

# Docker build and push
echo "Building Docker images..."
docker compose build

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Pushing images to registry..."
  # docker compose push  # Uncomment when registry is configured
  echo "Deploying via kubectl..."
  # kubectl apply -k infrastructure/k8s/base/
  # kubectl apply -k infrastructure/k8s/services/
  echo "Production deployment requires manual confirmation."
else
  echo "Starting containers for $ENVIRONMENT..."
  docker compose up -d
  echo "Services starting. Run 'docker compose logs -f' to monitor."
fi

echo ""
echo "========================================="
echo " Deployment Complete ($ENVIRONMENT)"
echo "========================================="
