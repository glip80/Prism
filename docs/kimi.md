I can't generate downloadable files or create a complete VS Code solution package for you. However, I can provide you with the comprehensive file structure and all necessary code that you can easily copy into a VS Code workspace.

Here's the complete project structure with CI/CD, backend tests, UI tests, and integration tests:

## Project Structure

```
modular-dashboard-platform/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.test.yml
│   └── docker-compose.prod.yml
├── backend/
│   ├── auth-service/
│   ├── layout-service/
│   ├── widget-service/
│   └── connector-service/
├── frontend/
│   ├── src/
│   └── tests/
├── e2e/
│   └── playwright/
├── k8s/
│   ├── base/
│   └── overlays/
└── scripts/
    ├── setup.sh
    └── test.sh
```

Let me create the key configuration files:

### 1. VS Code Configuration

**`.vscode/settings.json`**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "frontend/node_modules/typescript/lib",
  "eslint.workingDirectories": ["./frontend", "./backend/auth", "./backend/layout"],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "jest.autoRun": "off",
  "docker-compose.files": ["docker/docker-compose.yml", "docker/docker-compose.test.yml"]
}
```

**`.vscode/extensions.json`**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker",
    "Orta.vscode-jest",
    "ms-playwright.playwright",
    "github.vscode-github-actions",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

**`.vscode/launch.json`**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/src/*"
      }
    },
    {
      "name": "Debug Auth Service",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/backend/auth",
      "remoteRoot": "/app",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Layout Service",
      "type": "node",
      "request": "attach",
      "port": 9230,
      "restart": true,
      "localRoot": "${workspaceFolder}/backend/layout",
      "remoteRoot": "/app"
    },
    {
      "name": "Run All Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:all"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ],
  "compounds": [
    {
      "name": "Debug Full Stack",
      "configurations": ["Debug Auth Service", "Debug Frontend"]
    }
  ]
}
```

### 2. CI/CD GitHub Actions

**`.github/workflows/ci.yml`**:
```yaml
name: CI - Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      e2e: ${{ steps.filter.outputs.e2e }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend:
              - 'frontend/**'
              - '.github/workflows/**'
            backend:
              - 'backend/**'
              - '.github/workflows/**'
            e2e:
              - 'e2e/**'
              - 'frontend/**'
              - 'backend/**'

  frontend-lint-and-test:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ./frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

      - name: Unit Tests
        run: npm run test:unit -- --coverage --coverageReporters=lcov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  backend-tests:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, layout, widget, connector]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: test_dashboard
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
      mongo:
        image: mongo:7-jammy
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js (for Node services)
        if: matrix.service != 'connector'
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: ./backend/${{ matrix.service }}/package-lock.json

      - name: Setup Python (for Connector)
        if: matrix.service == 'connector'
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Node dependencies
        if: matrix.service != 'connector'
        working-directory: ./backend/${{ matrix.service }}
        run: npm ci

      - name: Install Python dependencies
        if: matrix.service == 'connector'
        working-directory: ./backend/connector
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov

      - name: Run Node.js Unit Tests
        if: matrix.service != 'connector'
        working-directory: ./backend/${{ matrix.service }}
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test_dashboard
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key

      - name: Run Python Unit Tests
        if: matrix.service == 'connector'
        working-directory: ./backend/connector
        run: pytest tests/unit -v --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test_dashboard

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/${{ matrix.service }}/coverage/lcov.info,./backend/connector/coverage.xml
          flags: backend-${{ matrix.service }}

  integration-tests:
    needs: [frontend-lint-and-test, backend-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Compose
        uses: docker/setup-buildx-action@v3

      - name: Start Test Environment
        working-directory: ./docker
        run: docker-compose -f docker-compose.test.yml up -d --build

      - name: Wait for services
        run: |
          sleep 30
          docker ps

      - name: Run Integration Tests
        working-directory: ./backend
        run: npm run test:integration
        env:
          API_GATEWAY: http://localhost:8080

      - name: Cleanup
        if: always()
        working-directory: ./docker
        run: docker-compose -f docker-compose.test.yml down -v

  e2e-tests:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' || needs.changes.outputs.backend == 'true' || needs.changes.outputs.e2e == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install Playwright
        working-directory: ./e2e
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Start Application Stack
        working-directory: ./docker
        run: |
          docker-compose up -d
          sleep 60

      - name: Run E2E Tests
        working-directory: ./e2e
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/

      - name: Cleanup
        if: always()
        working-directory: ./docker
        run: docker-compose down -v

  build-and-push:
    needs: [frontend-lint-and-test, backend-tests, integration-tests]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [frontend, auth, layout, widget, connector]
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
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service == 'frontend' && 'frontend' || 'backend/' + matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3. Docker Compose for Testing

**`docker/docker-compose.test.yml`**:
```yaml
version: '3.8'

services:
  # Test databases
  test-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: dashboard_test
    volumes:
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5

  test-redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  test-mongo:
    image: mongo:7-jammy
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 5s
      timeout: 5s
      retries: 5

  # Services under test
  auth-service-test:
    build:
      context: ../backend/auth
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@test-postgres:5432/dashboard_test
      - REDIS_URL=redis://test-redis:6379
      - JWT_SECRET=test-secret-12345
    depends_on:
      test-postgres:
        condition: service_healthy
      test-redis:
        condition: service_healthy
    volumes:
      - ../backend/auth:/app
      - /app/node_modules
    command: npm run test:watch

  # API Gateway for integration tests
  test-gateway:
    image: nginx:alpine
    volumes:
      - ./nginx.test.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "8080:80"
    depends_on:
      - auth-service-test
      - layout-service-test

  # Newman/Postman for API testing
  newman:
    image: postman/newman:alpine
    volumes:
      - ../tests/integration:/etc/newman
    command: run collection.json --environment environment.json
    depends_on:
      - test-gateway
```

### 4. Backend Test Examples

**`backend/auth/tests/unit/auth.controller.test.ts`**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from '../../src/controllers/auth.controller';
import { UserService } from '../../src/services/user.service';
import { RedisClient } from '../../src/utils/redis';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUserService: UserService;
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockUserService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      validatePassword: vi.fn(),
    } as any;

    mockRedis = {
      setex: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    } as any;

    controller = new AuthController(mockUserService, mockRedis);
  });

  describe('POST /login', () => {
    it('should return JWT token for valid credentials', async () => {
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        password_hash: 'hashedpass',
        is_active: true,
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockUserService.validatePassword.mockResolvedValue(true);

      const req = {
        body: { email: 'test@example.com', password: 'password123' },
      } as any;

      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: expect.any(String),
          user: expect.objectContaining({
            id: 'uuid-123',
            email: 'test@example.com',
          }),
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const req = {
        body: { email: 'wrong@example.com', password: 'wrongpass' },
      } as any;

      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      } as any;

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('RBAC', () => {
    it('should check permissions correctly', async () => {
      const userId = 'user-123';
      const requiredPermission = 'layout:create';

      mockRedis.get.mockResolvedValue(
        JSON.stringify(['layout:create', 'layout:read'])
      );

      const result = await controller.checkPermission(
        userId,
        requiredPermission
      );

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(`permissions:${userId}`);
    });
  });
});
```

**`backend/layout/tests/integration/layout.api.test.ts`**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDB, teardownTestDB } from '../utils/test-db';

describe('Layout API Integration', () => {
  let app: any;
  let authToken: string;
  let testLayoutId: string;

  beforeAll(async () => {
    await setupTestDB();
    app = createApp();

    // Get auth token
    const loginRes = await supertest(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'testpass' });

    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/v1/layouts', () => {
    it('should create a new layout', async () => {
      const layoutData = {
        title: 'Test Dashboard',
        description: 'Integration test layout',
        layout_config: {
          breakpoints: { lg: 1200, md: 996 },
          cols: { lg: 12, md: 10 },
          rowHeight: 100,
          margin: [10, 10],
        },
        widgets: [
          {
            id: 'widget-1',
            type: 'metric',
            title: 'Test Metric',
            x: 0,
            y: 0,
            w: 4,
            h: 2,
            config: {
              dataSource: {
                connector_id: 'conn-123',
                query: 'SELECT count(*) FROM users',
                refreshInterval: 60000,
              },
            },
          },
        ],
      };

      const response = await supertest(app)
        .post('/api/v1/layouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(layoutData)
        .expect(201);

      testLayoutId = response.body.id;
      expect(response.body.title).toBe(layoutData.title);
      expect(response.body.widgets).toHaveLength(1);
    });
  });

  describe('GET /api/v1/layouts/:id', () => {
    it('should retrieve layout with caching', async () => {
      // First request - cache miss
      const res1 = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res1.headers['x-cache']).toBe('MISS');

      // Second request - cache hit
      const res2 = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res2.headers['x-cache']).toBe('HIT');
    });
  });

  describe('Layout Versioning', () => {
    it('should create version on update', async () => {
      const update = {
        title: 'Updated Dashboard',
        changeSummary: 'Updated title',
      };

      const res = await supertest(app)
        .put(`/api/v1/layouts/${testLayoutId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(update)
        .expect(200);

      expect(res.body.version).toBe(2);

      // Check version exists
      const versions = await supertest(app)
        .get(`/api/v1/layouts/${testLayoutId}/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(versions.body).toHaveLength(2);
    });
  });
});
```

**`backend/connector/tests/unit/test_database_connector.py`**:
```python
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from app.connectors.database_connector import DatabaseConnector, ConnectionConfig

@pytest.fixture
def pg_config():
    return ConnectionConfig(
        type="postgresql",
        host="localhost",
        port=5432,
        database="test",
        username="test",
        password="testpass",
        options={}
    )

@pytest.fixture
def mock_pool():
    pool = AsyncMock()
    conn = AsyncMock()
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    return pool, conn

@pytest.mark.asyncio
async def test_postgresql_query_execution(pg_config, mock_pool):
    pool, conn = mock_pool
    
    with patch('asyncpg.create_pool', return_value=pool):
        connector = DatabaseConnector(pg_config)
        await connector.connect()
        
        # Mock fetch result
        conn.fetch.return_value = [
            {'id': 1, 'name': 'Test'},
            {'id': 2, 'name': 'Test 2'}
        ]
        
        result = await connector.execute_query(
            "SELECT * FROM users WHERE active = $1",
            [True]
        )
        
        assert len(result) == 2
        assert result[0]['name'] == 'Test'
        conn.fetch.assert_called_once_with(
            "SELECT * FROM users WHERE active = $1",
            True
        )

@pytest.mark.asyncio
async def test_connection_health_check(pg_config, mock_pool):
    pool, conn = mock_pool
    
    with patch('asyncpg.create_pool', return_value=pool):
        connector = DatabaseConnector(pg_config)
        await connector.connect()
        
        conn.execute.return_value = None
        
        is_healthy = await connector.health_check()
        assert is_healthy is True

@pytest.mark.asyncio
async def test_connection_retry_on_failure(pg_config):
    with patch('asyncpg.create_pool', side_effect=[
        Exception("Connection failed"),
        AsyncMock()  # Success on retry
    ]):
        connector = DatabaseConnector(pg_config)
        
        # Should retry and eventually succeed
        await connector.connect_with_retry(max_retries=2)
        assert connector.pool is not None
```

### 5. Frontend Tests

**`frontend/tests/unit/components/GridLayout.test.tsx`**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridLayout } from '../../../src/components/Dashboard/GridLayout';
import { LayoutProvider } from '../../../src/contexts/LayoutContext';

const mockLayout = {
  id: 'layout-1',
  widgets: [
    {
      id: 'widget-1',
      type: 'chart',
      title: 'Revenue Chart',
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      config: {
        dataSource: {
          connector_id: 'conn-1',
          query: 'SELECT * FROM revenue',
          refreshInterval: 300000,
        },
      },
    },
  ],
};

describe('GridLayout', () => {
  const mockOnLayoutChange = vi.fn();
  const mockOnWidgetRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders widgets with correct positioning', () => {
    render(
      <LayoutProvider>
        <GridLayout
          layout={mockLayout}
          onLayoutChange={mockOnLayoutChange}
          onWidgetRemove={mockOnWidgetRemove}
        />
      </LayoutProvider>
    );

    expect(screen.getByText('Revenue Chart')).toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <GridLayout
          layout={mockLayout}
          onLayoutChange={mockOnLayoutChange}
          onWidgetRemove={mockOnWidgetRemove}
        />
      </LayoutProvider>
    );

    const widget = screen.getByTestId('widget-widget-1');
    
    // Simulate drag
    await user.pointer([
      { keys: '[MouseLeft>]', target: widget },
      { target: { x: 100, y: 100 } },
      { keys: '[/MouseLeft]' },
    ]);

    await waitFor(() => {
      expect(mockOnLayoutChange).toHaveBeenCalled();
    });
  });

  it('opens widget config on click', async () => {
    const user = userEvent.setup();
    
    render(
      <LayoutProvider>
        <GridLayout
          layout={mockLayout}
          onLayoutChange={mockOnLayoutChange}
          onWidgetRemove={mockOnWidgetRemove}
        />
      </LayoutProvider>
    );

    const settingsBtn = screen.getByLabelText('Widget settings');
    await user.click(settingsBtn);

    expect(screen.getByText('Widget Configuration')).toBeInTheDocument();
  });
});
```

**`frontend/tests/unit/hooks/useWidgetData.test.ts`**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWidgetData } from '../../../src/hooks/useWidgetData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWidgetData', () => {
  const mockDataSource = {
    connector_id: 'conn-1',
    query: 'SELECT * FROM sales',
    parameters: ['30d'],
    refreshInterval: 5000,
    cacheDuration: 30000,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches data on mount', async () => {
    const mockData = [{ id: 1, revenue: 1000 }];
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ data: mockData }),
      ok: true,
    });

    const { result } = renderHook(
      () => useWidgetData(mockDataSource),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('auto-refreshes based on interval', async () => {
    vi.useFakeTimers();
    
    const mockData1 = [{ revenue: 1000 }];
    const mockData2 = [{ revenue: 2000 }];
    
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockData1 }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockData2 }),
        ok: true,
      });

    const { result } = renderHook(
      () => useWidgetData(mockDataSource),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Advance timer by refresh interval
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    vi.useRealTimers();
  });

  it('manual refresh bypasses cache', async () => {
    const mockData = [{ id: 1 }];
    (global.fetch as any).mockResolvedValue({
      json: async () => ({ data: mockData }),
      ok: true,
    });

    const { result } = renderHook(
      () => useWidgetData(mockDataSource),
      { wrapper: createWrapper() }
    );

    await waitFor(() => result.current.isSuccess);

    // Manual refresh
    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"skip_cache":true'),
        })
      );
    });
  });
});
```

### 6. E2E Tests with Playwright

**`e2e/tests/dashboard.spec.ts`**:
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
  });

  test('user can create a new dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    
    await dashboard.createNewDashboard('Sales Q1 2024');
    
    await expect(page.getByText('Sales Q1 2024')).toBeVisible();
    await expect(page.getByText('Dashboard created successfully')).toBeVisible();
  });

  test('user can add widgets dynamically', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Test Dashboard');

    // Add chart widget
    await dashboard.addWidget('chart', {
      title: 'Revenue Trend',
      dataSource: {
        connector: 'PostgreSQL Production',
        query: 'SELECT date, revenue FROM sales',
      },
    });

    await expect(page.getByText('Revenue Trend')).toBeVisible();
    await expect(page.locator('[data-testid="chart-widget"]')).toBeVisible();
  });

  test('widgets auto-refresh data', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Real-time Dashboard');

    // Set refresh interval to 5 seconds for testing
    await dashboard.configureWidgetRefresh('widget-1', 5000);

    const initialData = await dashboard.getWidgetData('widget-1');
    
    // Wait for refresh
    await page.waitForTimeout(5500);
    
    const updatedData = await dashboard.getWidgetData('widget-1');
    expect(updatedData).not.toEqual(initialData);
  });

  test('theme switching works across session', async ({ page, context }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Test Dashboard');

    // Switch to dark theme
    await dashboard.switchTheme('dark');
    
    const bgColor = await page.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe('rgb(20, 20, 20)'); // Dark theme background

    // Open new tab, theme should persist
    const newPage = await context.newPage();
    await newPage.goto('/dashboards');
    
    const newBgColor = await newPage.evaluate(() => 
      getComputedStyle(document.body).backgroundColor
    );
    expect(newBgColor).toBe('rgb(20, 20, 20)');
  });

  test('layout versioning and restore', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.openDashboard('Version Test');

    // Make changes
    await dashboard.moveWidget('widget-1', { x: 100, y: 100 });
    await dashboard.saveLayout('Moved widget position');

    // Check version created
    await dashboard.openVersionHistory();
    await expect(page.getByText('Moved widget position')).toBeVisible();

    // Restore previous version
    await dashboard.restoreVersion(1);
    await expect(page.getByText('Layout restored to version 1')).toBeVisible();
  });

  test('RBAC - viewer cannot edit', async ({ browser }) => {
    // Login as viewer
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    
    const loginPage = new LoginPage(viewerPage);
    await loginPage.goto();
    await loginPage.login('viewer@example.com', 'password123');

    const dashboard = new DashboardPage(viewerPage);
    await dashboard.openDashboard('Shared Dashboard');

    // Verify edit controls are hidden
    await expect(viewerPage.getByText('Add Widget')).not.toBeVisible();
    await expect(viewerPage.getByLabel('Edit layout')).not.toBeVisible();
  });
});
```

**`e2e/pages/DashboardPage.ts`**:
```typescript
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly addWidgetButton: Locator;
  readonly themeSwitcher: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addWidgetButton = page.getByText('Add Widget');
    this.themeSwitcher = page.getByLabel('Switch theme');
  }

  async goto() {
    await this.page.goto('/dashboards');
  }

  async createNewDashboard(title: string) {
    await this.page.getByText('New Dashboard').click();
    await this.page.fill('[name="title"]', title);
    await this.page.getByText('Create').click();
  }

  async openDashboard(title: string) {
    await this.page.getByText(title).click();
    await this.page.waitForSelector('[data-testid="grid-layout"]');
  }

  async addWidget(type: string, config: any) {
    await this.addWidgetButton.click();
    await this.page.getByText(type, { exact: false }).click();
    
    await this.page.fill('[name="title"]', config.title);
    
    if (config.dataSource) {
      await this.page.getByText('Select Data Source').click();
      await this.page.getByText(config.dataSource.connector).click();
      await this.page.fill('[name="query"]', config.dataSource.query);
    }
    
    await this.page.getByText('Save Widget').click();
  }

  async moveWidget(widgetId: string, position: { x: number; y: number }) {
    const widget = this.page.locator(`[data-widget-id="${widgetId}"]`);
    await widget.dragTo(this.page.locator('.grid-drop-zone'), {
      targetPosition: position,
    });
  }

  async switchTheme(theme: 'light' | 'dark') {
    await this.themeSwitcher.click();
    await this.page.getByText(theme === 'dark' ? 'Dark Mode' : 'Light Mode').click();
  }

  async configureWidgetRefresh(widgetId: string, intervalMs: number) {
    await this.page.click(`[data-widget-id="${widgetId}"] [aria-label="Settings"]`);
    await this.page.fill('[name="refreshInterval"]', (intervalMs / 1000).toString());
    await this.page.getByText('Save').click();
  }

  async getWidgetData(widgetId: string) {
    return this.page.evaluate((id) => {
      const widget = document.querySelector(`[data-widget-id="${id}"]`);
      return widget?.getAttribute('data-value');
    }, widgetId);
  }

  async saveLayout(changeSummary: string) {
    await this.page.getByText('Save Layout').click();
    await this.page.fill('[name="changeSummary"]', changeSummary);
    await this.page.getByText('Confirm').click();
  }

  async openVersionHistory() {
    await this.page.getByText('History').click();
    await this.page.waitForSelector('[data-testid="version-list"]');
  }

  async restoreVersion(versionNumber: number) {
    await this.page.click(`[data-version="${versionNumber}"] [aria-label="Restore"]`);
    await this.page.getByText('Restore').click();
  }
}
```

### 5. Test Scripts

**`package.json` (root)**:
```json
{
  "name": "modular-dashboard-platform",
  "version": "1.0.0",
  "scripts": {
    "setup": "./scripts/setup.sh",
    "dev": "docker-compose -f docker/docker-compose.yml up -d",
    "dev:logs": "docker-compose -f docker/docker-compose.yml logs -f",
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "concurrently \"npm run test:unit:frontend\" \"npm run test:unit:backend\"",
    "test:unit:frontend": "cd frontend && npm run test:unit",
    "test:unit:backend": "cd backend && npm run test:unit:all",
    "test:integration": "docker-compose -f docker/docker-compose.test.yml up --abort-on-container-exit",
    "test:e2e": "cd e2e && npx playwright test",
    "test:e2e:ui": "cd e2e && npx playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "build": "docker-compose -f docker/docker-compose.yml build",
    "build:prod": "docker-compose -f docker/docker-compose.prod.yml build",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:prod": "./scripts/deploy.sh production"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "concurrently": "^8.2.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,jsx,json,md}": ["prettier --write"]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit"
    }
  }
}
```

### 6. Setup Script

**`scripts/setup.sh`**:
```bash
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
python -m venv venv
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
```

To use this in VS Code:

1. Create a folder structure and copy all these files
2. Run `./scripts/setup.sh` to initialize
3. Open `modular-dashboard.code-workspace` in VS Code
4. Use the Run and Debug panel (Ctrl+Shift+D) to start debugging
5. Use the Terminal to run `npm run test` for full test suite

The setup includes:
- **Unit Tests**: Vitest (frontend) + Jest/Vitest (Node) + pytest (Python)
- **Integration Tests**: Supertest for API + Docker Compose test environment
- **E2E Tests**: Playwright with Page Object Model
- **CI/CD**: GitHub Actions with matrix builds, caching, and multi-environment deployment
- **VS Code**: Pre-configured debugging, extensions, and workspace settings