.PHONY: install dev build test clean docker-up docker-down

# Install all dependencies
install:
	cd frontend && npm install
	cd backend/auth && npm install
	cd backend/layout && npm install
	cd backend/widget && npm install
	cd backend/connector && pip install -r requirements.txt

# Run all services in dev mode (requires multiple terminals or a process manager)
dev:
	@echo "Starting all services in development mode..."
	@echo "Run each service individually:"
	@echo "  cd frontend && npm run dev"
	@echo "  cd backend/auth && npm run dev"
	@echo "  cd backend/layout && npm run dev"
	@echo "  cd backend/widget && npm run dev"
	@echo "  cd backend/connector && uvicorn src.main:app --reload --port 8000"

# Build all services
build:
	cd frontend && npm run build
	cd backend/auth && npm run build
	cd backend/layout && npm run build
	cd backend/widget && npm run build

# Run all tests
test:
	cd backend/auth && npm run test:unit:all
	cd backend/layout && npx jest
	cd backend/widget && npx jest
	cd frontend && npm run test
	cd backend/connector && python -m pytest tests/

# Clean build artifacts
clean:
	rm -rf frontend/dist
	rm -rf backend/auth/dist
	rm -rf backend/layout/dist
	rm -rf backend/widget/dist

# Docker
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
