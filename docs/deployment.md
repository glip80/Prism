# Deployment Guide

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+ (for local development)
- Python 3.13+ (for connector service)

## Quick Start (Docker)

```bash
# Clone and start all services
git clone <repo-url> && cd modular-dashboard-platform
docker compose up --build -d

# Check status
docker compose ps
docker compose logs -f
```

The frontend will be available at `http://localhost:80`.

## Local Development

```bash
# Install all dependencies
make install

# Start infrastructure (DB, Redis, Mongo)
docker compose up postgres mongodb redis -d

# Start each service in separate terminals:
cd backend/auth && npm run dev
cd backend/layout && npm run dev
cd backend/widget && npm run dev
cd backend/connector && uvicorn src.main:app --reload --port 8000
cd frontend && npm run dev
```

## Environment Variables

Copy `.env.example` → `.env` in each service directory. Key variables:

| Variable | Service | Default |
|----------|---------|---------|
| `JWT_SECRET` | auth, layout, widget | `your_jwt_secret_here` |
| `DATABASE_URL` | auth, connector | `postgresql://app_user:app_password@localhost:5432/modular_db` |
| `MONGO_URI` | layout | `mongodb://localhost:27017/layout_service` |
| `REDIS_URL` | all | `redis://localhost:6379` |
| `CONNECTOR_API_URL` | widget | `http://localhost:8000` |

## Running Tests

```bash
# All tests
make test
# Or use the script
./scripts/test-all.sh
```

## Production Deployment

```bash
# Build and deploy
./scripts/deploy.sh production

# Or manually with Docker
docker compose -f infrastructure/docker/docker-compose.prod.yml up --build -d
```

For Kubernetes deployments, apply the manifests in `infrastructure/k8s/`:

```bash
kubectl apply -f infrastructure/k8s/base/
kubectl apply -f infrastructure/k8s/services/
kubectl apply -f infrastructure/k8s/ingress/
```
