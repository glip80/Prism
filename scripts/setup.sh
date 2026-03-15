#!/bin/bash

set -e

echo "🚀 Setting up Modular Dashboard Platform..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }

# Create environment files
if [ ! -f .env ]; then
  cat > .env <<EOF
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/dashboard
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/dashboard
JWT_SECRET=$(openssl rand -hex 32)
EOF
  echo "✅ Created .env file"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
cd ..

# Setup backend services
echo "⚙️ Setting up backend services..."
for service in auth layout widget; do
  echo "  - Setting up $service-service..."
  cd backend/$service
  npm install
  cd ../..
done

# Setup Python connector service
echo "🐍 Setting up connector service..."
cd backend/connector
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cd ../..

# Setup E2E tests
echo "🎭 Setting up E2E tests..."
cd e2e
npm install
npx playwright install
cd ..

# Create VS Code workspace file
cat > modular-dashboard.code-workspace <<EOF
{
  "folders": [
    { "path": "." },
    { "path": "frontend" },
    { "path": "backend/auth" },
    { "path": "backend/layout" },
    { "path": "backend/widget" },
    { "path": "backend/connector" },
    { "path": "e2e" }
  ],
  "settings": {
    "typescript.tsdk": "frontend/node_modules/typescript/lib"
  },
  "launch": {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Debug All Services",
        "type": "node",
        "request": "attach",
        "port": 9229
      }
    ]
  }
}
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start development: npm run dev"
echo "  2. Open VS Code: code modular-dashboard.code-workspace"
echo "  3. Run tests: npm run test"
echo "  4. View logs: npm run dev:logs"
