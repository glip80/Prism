import os
import json
github_files = {
    ".github/workflows/ci-cd.yml": """name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      auth: ${{ steps.changes.outputs.auth }}
      layout: ${{ steps.changes.outputs.layout }}
      connector: ${{ steps.changes.outputs.connector }}
      widget: ${{ steps.changes.outputs.widget }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'frontend/**'
            auth:
              - 'backend/services/auth-service/**'
            layout:
              - 'backend/services/layout-service/**'
            connector:
              - 'backend/services/connector-service/**'
            widget:
              - 'backend/services/widget-service/**'

  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/services/auth-service/package-lock.json
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm ci
      
      - name: Lint Frontend
        run: cd frontend && npm run lint
      
      - name: Type Check Frontend
        run: cd frontend && npm run type-check

  test-frontend:
    runs-on: ubuntu-latest
    needs: [changes, lint-and-format]
    if: ${{ needs.changes.outputs.frontend == 'true' || github.event_name == 'push' }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install Dependencies
        run: cd frontend && npm ci
      
      - name: Run Unit Tests
        run: cd frontend && npm run test:unit:coverage
      
      - name: Run Integration Tests
        run: cd frontend && npm run test:integration
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  test-backend-auth:
    runs-on: ubuntu-latest
    needs: [changes]
    if: ${{ needs.changes.outputs.auth == 'true' || github.event_name == 'push' }}
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dashboard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: backend/services/auth-service/package-lock.json
      
      - name: Install Dependencies
        run: cd backend/services/auth-service && npm ci
      
      - name: Run Migrations
        run: cd backend/services/auth-service && npm run migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dashboard_test
      
      - name: Run Unit Tests
        run: cd backend/services/auth-service && npm run test:unit:coverage
      
      - name: Run Integration Tests
        run: cd backend/services/auth-service && npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dashboard_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/services/auth-service/coverage/lcov.info
          flags: auth-service

  test-backend-layout:
    runs-on: ubuntu-latest
    needs: [changes]
    if: ${{ needs.changes.outputs.layout == 'true' || github.event_name == 'push' }}
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dashboard_test
        ports:
          - 5432:5432
      mongo:
        image: mongo:7-jammy
        ports:
          - 27017:27017
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Dependencies
        run: cd backend/services/layout-service && npm ci
      
      - name: Run Tests
        run: cd backend/services/layout-service && npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dashboard_test
          MONGODB_URL: mongodb://localhost:27017/dashboard_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/services/layout-service/coverage/lcov.info
          flags: layout-service

  test-e2e:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend-auth]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Dependencies
        run: |
          cd frontend && npm ci
          npx playwright install --with-deps
      
      - name: Start Services
        run: |
          docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
          sleep 30
      
      - name: Run E2E Tests
        run: cd frontend && npm run test:e2e
      
      - name: Upload E2E Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend-auth, test-backend-layout]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [frontend, auth-service, layout-service, connector-service, widget-service]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ matrix.service }}
      
      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service == 'frontend' && 'frontend' || format('backend/services/{0}', matrix.service) }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Staging
        run: |
          echo "Deploying to staging environment..."
          # Add your staging deployment commands here

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Production
        run: |
          echo "Deploying to production environment..."
          # Add your production deployment commands here
""",

    ".github/workflows/pr-validation.yml": """name: PR Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check PR Title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            test
            chore
          requireScope: false
      
      - name: Lint Code
        uses: wearerequired/lint-action@v2
        with:
          eslint: true
          eslint_dir: frontend/
          prettier: true
          prettier_dir: frontend/
      
      - name: Check for Secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug --only-verified
""",

    ".github/workflows/nightly-tests.yml": """name: Nightly Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM daily
  workflow_dispatch:

jobs:
  full-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        run: |
          docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
          sleep 60
      
      - name: Run Full Test Suite
        run: |
          make test-all
          cd frontend && npm run test:e2e:full
      
      - name: Performance Tests
        run: |
          cd frontend && npm run test:perf
      
      - name: Security Scan
        uses: securecodewarrior/github-action-add-sarif@v1
      
      - name: Cleanup
        if: always()
        run: docker-compose down -v
      
      - name: Notify Slack
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#alerts'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
"""
}

# Write GitHub workflow files
for filename, content in github_files.items():
    filepath = f"modular-dashboard-platform/{filename}"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)

print("GitHub Actions workflows created!")