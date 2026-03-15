#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "========================================="
echo " Starting Modular Dashboard Locally"
echo "========================================="

# Start infrastructure containers
echo ""
echo "--- Starting infrastructure (Postgres, MongoDB, Redis) ---"
cd "$ROOT_DIR"
docker compose up postgres mongodb redis -d 2>/dev/null || docker-compose up postgres mongodb redis -d

echo "Waiting for databases to be ready..."
for i in {1..30}; do
  pg_ready=$(docker compose exec -T postgres pg_isready 2>/dev/null && echo "yes" || echo "no")
  redis_ready=$(docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG && echo "yes" || echo "no")
  if [ "$pg_ready" = "yes" ] && [ "$redis_ready" = "yes" ]; then
    echo "✅ All databases ready!"
    break
  fi
  printf "."
  sleep 2
done
echo ""

PIDS=()

# Start Auth Service
echo "Starting Auth Service (port 3001)..."
cd "$ROOT_DIR/backend/auth" && npx ts-node-dev --respawn src/server.ts &
PIDS+=($!)

# Start Layout Service
echo "Starting Layout Service (port 3002)..."
cd "$ROOT_DIR/backend/layout" && npx ts-node-dev --respawn src/server.ts &
PIDS+=($!)

# Start Widget Service
echo "Starting Widget Service (port 3003)..."
cd "$ROOT_DIR/backend/widget" && npx ts-node-dev --respawn src/server.ts &
PIDS+=($!)

# Start Connector Service
echo "Starting Connector Service (port 8000)..."
cd "$ROOT_DIR/backend/connector" && python3 -m uvicorn src.main:app --reload --port 8000 &
PIDS+=($!)

# Start Frontend
echo "Starting Frontend (port 5173)..."
cd "$ROOT_DIR/frontend" && npx vite --host &
PIDS+=($!)

echo ""
echo "========================================="
echo " All services starting!"
echo "========================================="
echo ""
echo "  Frontend:   http://localhost:5173"
echo "  Auth:       http://localhost:3001"
echo "  Layout:     http://localhost:3002"
echo "  Widget:     http://localhost:3003"
echo "  Connector:  http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to kill all child processes
cleanup() {
  echo ""
  echo "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  cd "$ROOT_DIR"
  docker compose stop postgres mongodb redis 2>/dev/null || true
  echo "All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
