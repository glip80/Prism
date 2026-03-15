I'll continue from where we stopped - creating the comprehensive VS Code solution. Let me complete the remaining critical files including Kubernetes manifests, additional backend services, and the complete project structure.

## 7. Kubernetes Manifests

**`k8s/base/namespace.yaml`**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dashboard-prod
  labels:
    name: dashboard-prod
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: dashboard-staging
  labels:
    name: dashboard-staging
    environment: staging
```

**`k8s/base/configmap.yaml`**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dashboard-config
  namespace: dashboard-prod
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  JWT_EXPIRES_IN: "24h"
  REDIS_POOL_SIZE: "20"
  POSTGRES_POOL_SIZE: "20"
  WIDGET_REFRESH_MAX_INTERVAL: "3600000"
  MAX_WIDGETS_PER_LAYOUT: "50"
  ENABLE_REALTIME: "true"
  METRICS_ENABLED: "true"
```

**`k8s/base/secrets.yaml`** (template - use Sealed Secrets or External Secrets Operator in production):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dashboard-secrets
  namespace: dashboard-prod
type: Opaque
stringData:
  JWT_SECRET: "<base64-encoded-secret>"
  DATABASE_URL: "<base64-encoded-connection-string>"
  REDIS_URL: "<base64-encoded-redis-url>"
  MONGODB_URL: "<base64-encoded-mongodb-url>"
  ENCRYPTION_KEY: "<base64-encoded-aes-key>"
```

**`k8s/base/auth-service.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: dashboard-prod
  labels:
    app: auth-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
    spec:
      serviceAccountName: dashboard-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: auth-service
          image: ghcr.io/your-org/dashboard-platform/auth:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
            - containerPort: 9229
              name: debug
          envFrom:
            - configMapRef:
                name: dashboard-config
            - secretRef:
                name: dashboard-secrets
          env:
            - name: SERVICE_NAME
              value: "auth-service"
            - name: PORT
              value: "3000"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: dashboard-prod
  labels:
    app: auth-service
spec:
  selector:
    app: auth-service
  ports:
    - port: 3000
      targetPort: 3000
      name: http
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: dashboard-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

**`k8s/base/layout-service.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: layout-service
  namespace: dashboard-prod
  labels:
    app: layout-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: layout-service
  template:
    metadata:
      labels:
        app: layout-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3002"
    spec:
      serviceAccountName: dashboard-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
        - name: layout-service
          image: ghcr.io/your-org/dashboard-platform/layout:latest
          ports:
            - containerPort: 3002
          envFrom:
            - configMapRef:
                name: dashboard-config
            - secretRef:
                name: dashboard-secrets
          env:
            - name: SERVICE_NAME
              value: "layout-service"
            - name: PORT
              value: "3002"
          resources:
            requests:
              memory: "512Mi"
              cpu: "300m"
            limits:
              memory: "1Gi"
              cpu: "600m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3002
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3002
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: layout-service
  namespace: dashboard-prod
spec:
  selector:
    app: layout-service
  ports:
    - port: 3002
      targetPort: 3002
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: layout-service-hpa
  namespace: dashboard-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: layout-service
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 70
          type: Utilization
```

**`k8s/base/ingress.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dashboard-ingress
  namespace: dashboard-prod
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://dashboard.yourdomain.com"
    nginx.ingress.kubernetes.io/websocket-services: "widget-service"
spec:
  tls:
    - hosts:
        - dashboard.yourdomain.com
        - api.yourdomain.com
      secretName: dashboard-tls
  rules:
    - host: dashboard.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
    - host: api.yourdomain.com
      http:
        paths:
          - path: /api/v1/auth
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 3000
          - path: /api/v1/layouts
            pathType: Prefix
            backend:
              service:
                name: layout-service
                port:
                  number: 3002
          - path: /api/v1/widgets
            pathType: Prefix
            backend:
              service:
                name: widget-service
                port:
                  number: 3003
          - path: /api/v1/connectors
            pathType: Prefix
            backend:
              service:
                name: connector-service
                port:
                  number: 3004
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: widget-service
                port:
                  number: 3003
```

**`k8s/base/network-policy.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: dashboard-network-policy
  namespace: dashboard-prod
spec:
  podSelector:
    matchLabels:
      app: dashboard
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
        - protocol: TCP
          port: 3002
        - protocol: TCP
          port: 3003
        - protocol: TCP
          port: 3004
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - podSelector:
            matchLabels:
              app: mongo
      ports:
        - protocol: TCP
          port: 27017
```

**`k8s/overlays/staging/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: dashboard-staging

resources:
  - ../../base

namePrefix: staging-

commonLabels:
  environment: staging

replicas:
  - name: auth-service
    count: 2
  - name: layout-service
    count: 2

images:
  - name: ghcr.io/your-org/dashboard-platform/auth
    newTag: staging-latest
  - name: ghcr.io/your-org/dashboard-platform/layout
    newTag: staging-latest

patchesStrategicMerge:
  - configmap-patch.yaml

patches:
  - target:
      kind: Ingress
      name: dashboard-ingress
    patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: staging-dashboard.yourdomain.com
      - op: replace
        path: /spec/rules/1/host
        value: staging-api.yourdomain.com
```

## 8. Additional Backend Services Implementation

**`backend/widget/src/services/websocket.service.ts`**:
```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisClient } from '../utils/redis';
import { WidgetService } from './widget.service';
import { logger } from '../utils/logger';

export class WebSocketService {
  private io: Server;
  private widgetSubscriptions: Map<string, Set<string>> = new Map();

  constructor(
    httpServer: any,
    private redis: RedisClient,
    private widgetService: WidgetService
  ) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    this.io.adapter(createAdapter(pubClient, subClient));

    this.setupEventHandlers();
    this.setupRedisSubscriptions();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('subscribe_widget', async (widgetId: string) => {
        await this.handleWidgetSubscription(socket, widgetId);
      });

      socket.on('unsubscribe_widget', (widgetId: string) => {
        this.handleWidgetUnsubscription(socket, widgetId);
      });

      socket.on('refresh_widget', async (widgetId: string) => {
        await this.handleManualRefresh(socket, widgetId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleWidgetSubscription(socket: any, widgetId: string): Promise<void> {
    try {
      // Join widget room
      socket.join(`widget:${widgetId}`);
      
      // Track subscription
      if (!this.widgetSubscriptions.has(widgetId)) {
        this.widgetSubscriptions.set(widgetId, new Set());
      }
      this.widgetSubscriptions.get(widgetId)!.add(socket.id);

      // Send initial data
      const data = await this.widgetService.getWidgetData(widgetId);
      socket.emit(`widget:${widgetId}:data`, data);

      // Start auto-refresh if first subscriber
      if (this.widgetSubscriptions.get(widgetId)!.size === 1) {
        await this.startAutoRefresh(widgetId);
      }

      logger.info(`Socket ${socket.id} subscribed to widget ${widgetId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to subscribe to widget' });
      logger.error('Widget subscription error:', error);
    }
  }

  private handleWidgetUnsubscription(socket: any, widgetId: string): void {
    socket.leave(`widget:${widgetId}`);
    
    const subscribers = this.widgetSubscriptions.get(widgetId);
    if (subscribers) {
      subscribers.delete(socket.id);
      
      // Stop auto-refresh if no subscribers
      if (subscribers.size === 0) {
        this.stopAutoRefresh(widgetId);
        this.widgetSubscriptions.delete(widgetId);
      }
    }
  }

  private async handleManualRefresh(socket: any, widgetId: string): Promise<void> {
    try {
      const data = await this.widgetService.refreshWidgetData(widgetId);
      this.io.to(`widget:${widgetId}`).emit(`widget:${widgetId}:update`, data);
      
      // Log refresh action
      logger.info(`Manual refresh triggered for widget ${widgetId} by ${socket.id}`);
    } catch (error) {
      socket.emit('error', { message: 'Refresh failed' });
    }
  }

  private handleDisconnect(socket: any): void {
    // Clean up all subscriptions for this socket
    this.widgetSubscriptions.forEach((subscribers, widgetId) => {
      if (subscribers.has(socket.id)) {
        this.handleWidgetUnsubscription(socket, widgetId);
      }
    });
    logger.info(`Client disconnected: ${socket.id}`);
  }

  private async startAutoRefresh(widgetId: string): Promise<void> {
    const widget = await this.widgetService.getWidget(widgetId);
    if (!widget?.config?.dataSource?.refreshInterval) return;

    const interval = setInterval(async () => {
      try {
        const data = await this.widgetService.refreshWidgetData(widgetId);
        this.io.to(`widget:${widgetId}`).emit(`widget:${widgetId}:update`, {
          data,
          timestamp: new Date().toISOString(),
          cached: false,
        });
      } catch (error) {
        logger.error(`Auto-refresh failed for widget ${widgetId}:`, error);
      }
    }, widget.config.dataSource.refreshInterval);

    // Store interval reference
    (global as any).widgetIntervals = (global as any).widgetIntervals || new Map();
    (global as any).widgetIntervals.set(widgetId, interval);
  }

  private stopAutoRefresh(widgetId: string): void {
    const intervals = (global as any).widgetIntervals;
    if (intervals?.has(widgetId)) {
      clearInterval(intervals.get(widgetId));
      intervals.delete(widgetId);
    }
  }

  private setupRedisSubscriptions(): void {
    // Subscribe to Redis pub/sub for cross-instance updates
    const subscriber = this.redis.duplicate();
    subscriber.subscribe('widget:refresh:*');
    subscriber.on('message', (channel, message) => {
      const widgetId = channel.split(':')[2];
      const data = JSON.parse(message);
      this.io.to(`widget:${widgetId}`).emit(`widget:${widgetId}:update`, data);
    });
  }

  broadcastLayoutUpdate(layoutId: string, update: any): void {
    this.io.to(`layout:${layoutId}`).emit('layout:update', update);
  }
}
```

**`backend/connector/src/adapters/postgresql.adapter.py`**:
```python
from typing import List, Dict, Any, Optional
import asyncpg
import logging
from dataclasses import dataclass
from .base import DatabaseAdapter

logger = logging.getLogger(__name__)

@dataclass
class PostgresConfig:
    host: str
    port: int = 5432
    database: str
    user: str
    password: str
    ssl_mode: str = "prefer"
    max_connections: int = 20
    command_timeout: int = 60

class PostgreSQLAdapter(DatabaseAdapter):
    def __init__(self, config: PostgresConfig):
        self.config = config
        self.pool: Optional[asyncpg.Pool] = None
        self._connection_lock = asyncio.Lock()

    async def connect(self) -> None:
        """Initialize connection pool"""
        async with self._connection_lock:
            if self.pool is not None:
                return

            try:
                self.pool = await asyncpg.create_pool(
                    host=self.config.host,
                    port=self.config.port,
                    database=self.config.database,
                    user=self.config.user,
                    password=self.config.password,
                    ssl=self.config.ssl_mode,
                    min_size=5,
                    max_size=self.config.max_connections,
                    command_timeout=self.config.command_timeout,
                    server_settings={
                        'application_name': 'modular_dashboard'
                    }
                )
                logger.info(f"Connected to PostgreSQL at {self.config.host}:{self.config.port}")
            except Exception as e:
                logger.error(f"Failed to connect to PostgreSQL: {e}")
                raise

    async def disconnect(self) -> None:
        """Close all connections"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("PostgreSQL connections closed")

    async def execute_query(
        self, 
        query: str, 
        parameters: List[Any] = None,
        timeout: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Execute query and return results as list of dicts"""
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            try:
                # Set statement timeout if specified
                if timeout:
                    await conn.execute(f"SET statement_timeout = {timeout * 1000}")

                # Execute query
                rows = await conn.fetch(query, *(parameters or []))
                
                # Convert to dict
                results = []
                for row in rows:
                    row_dict = {}
                    for key in row.keys():
                        value = row[key]
                        # Handle special types
                        if isinstance(value, asyncpg.Record):
                            row_dict[key] = dict(value)
                        elif isinstance(value, (asyncpg.pgproto.types.UUID)):
                            row_dict[key] = str(value)
                        else:
                            row_dict[key] = value
                    results.append(row_dict)
                
                return results

            except asyncpg.PostgresError as e:
                logger.error(f"Query execution failed: {e}")
                raise QueryExecutionError(f"PostgreSQL error: {e}")

    async def test_connection(self) -> bool:
        """Health check"""
        try:
            result = await self.execute_query("SELECT 1 as health_check")
            return result[0]["health_check"] == 1
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

    async def get_schema(self) -> Dict[str, Any]:
        """Introspect database schema for query builder"""
        query = """
            SELECT 
                table_schema,
                table_name,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name, ordinal_position
        """
        
        rows = await self.execute_query(query)
        
        schema = {}
        for row in rows:
            schema_name = row["table_schema"]
            table_name = row["table_name"]
            full_name = f"{schema_name}.{table_name}"
            
            if full_name not in schema:
                schema[full_name] = {
                    "schema": schema_name,
                    "table": table_name,
                    "columns": []
                }
            
            schema[full_name]["columns"].append({
                "name": row["column_name"],
                "type": row["data_type"],
                "nullable": row["is_nullable"] == "YES"
            })
        
        return schema

    async def explain_query(self, query: str, parameters: List[Any] = None) -> Dict[str, Any]:
        """Get query execution plan"""
        explain_query = f"EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) {query}"
        result = await self.execute_query(explain_query, parameters)
        return result[0]["QUERY PLAN"][0] if result else {}
```

## 9. Frontend Advanced Components

**`frontend/src/components/Widgets/ChartWidget/ChartRenderer.tsx`**:
```typescript
import React, { useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../../../hooks/useTheme';
import { ChartConfig, ChartType } from '../../../types/widget';

interface ChartRendererProps {
  data: any[];
  config: ChartConfig;
  onDataPointClick?: (data: any) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  data,
  config,
  onDataPointClick,
}) => {
  const { theme } = useTheme();

  const chartProps = useMemo(() => ({
    width: '100%',
    height: '100%',
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  }), [data]);

  const handleClick = useCallback((entry: any) => {
    if (onDataPointClick && config.interactions?.clickAction === 'drillDown') {
      onDataPointClick(entry);
    }
  }, [onDataPointClick, config.interactions]);

  const renderChart = () => {
    const { type, xAxis, yAxis, colors } = config;

    const axisProps = {
      xAxis: {
        dataKey: xAxis,
        stroke: theme.colors.textMuted,
        style: { fontSize: 12 },
      },
      yAxis: {
        stroke: theme.colors.textMuted,
        style: { fontSize: 12 },
      },
      grid: {
        stroke: theme.colors.border,
        strokeDasharray: '3 3',
      },
      tooltip: {
        contentStyle: {
          backgroundColor: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 4,
        },
        labelStyle: { color: theme.colors.text },
        itemStyle: { color: theme.colors.text },
      },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid {...axisProps.grid} />
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...axisProps.tooltip} />
            <Legend />
            {yAxis.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors?.[index] || COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, onClick: handleClick }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid {...axisProps.grid} />
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...axisProps.tooltip} />
            <Legend />
            {yAxis.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors?.[index] || COLORS[index % COLORS.length]}
                onClick={handleClick}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid {...axisProps.grid} />
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...axisProps.tooltip} />
            <Legend />
            {yAxis.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors?.[index] || COLORS[index % COLORS.length]}
                fill={colors?.[index] || COLORS[index % COLORS.length]}
                fillOpacity={0.3}
                onClick={handleClick}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart width={400} height={400}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxis[0]}
              nameKey={xAxis}
              onClick={handleClick}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors?.[index] || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip {...axisProps.tooltip} />
          </PieChart>
        );

      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
};
```

**`frontend/src/components/Dashboard/Toolbar/RefreshControls.tsx`**:
```typescript
import React, { useState, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { dashboardState } from '../../../stores/layoutStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Button, Select, Tooltip, Badge } from '../../Common';
import { Play, Pause, RotateCw, Clock, Settings } from 'lucide-react';

interface RefreshControlsProps {
  layoutId: string;
}

export const RefreshControls: React.FC<RefreshControlsProps> = ({ layoutId }) => {
  const [dashboard, setDashboard] = useRecoilState(dashboardState);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [globalInterval, setGlobalInterval] = useState(30000);
  const { refreshWidget, refreshAllWidgets } = useWebSocket();

  const handleGlobalRefresh = useCallback(async () => {
    await refreshAllWidgets(layoutId);
  }, [layoutId, refreshAllWidgets]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(!isAutoRefresh);
    // Broadcast to all widgets
    dashboard.widgets.forEach(widget => {
      if (widget.config.dataSource?.refreshInterval) {
        // Update via WebSocket or API
      }
    });
  }, [isAutoRefresh, dashboard.widgets]);

  const handleIntervalChange = useCallback((value: string) => {
    const interval = parseInt(value, 10);
    setGlobalInterval(interval);
    
    // Update all widgets with new interval
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => ({
        ...w,
        config: {
          ...w.config,
          dataSource: {
            ...w.config.dataSource,
            refreshInterval: interval,
          },
        },
      })),
    }));
  }, [setDashboard]);

  const intervals = [
    { value: '5000', label: '5s' },
    { value: '10000', label: '10s' },
    { value: '30000', label: '30s' },
    { value: '60000', label: '1m' },
    { value: '300000', label: '5m' },
    { value: '600000', label: '10m' },
  ];

  return (
    <div className="flex items-center gap-2 bg-surface rounded-lg p-2 border border-border">
      <Tooltip content="Refresh all widgets">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGlobalRefresh}
          icon={<RotateCw className="w-4 h-4" />}
        >
          Refresh All
        </Button>
      </Tooltip>

      <div className="h-4 w-px bg-border mx-1" />

      <Tooltip content={isAutoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}>
        <Button
          variant={isAutoRefresh ? 'primary' : 'secondary'}
          size="sm"
          onClick={toggleAutoRefresh}
          icon={isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        >
          {isAutoRefresh ? 'On' : 'Off'}
        </Button>
      </Tooltip>

      <Select
        value={globalInterval.toString()}
        onChange={handleIntervalChange}
        options={intervals}
        icon={<Clock className="w-4 h-4" />}
        disabled={!isAutoRefresh}
        className="w-24"
      />

      <Badge variant={isAutoRefresh ? 'success' : 'default'}>
        {dashboard.widgets.filter(w => w.config.dataSource?.refreshInterval).length} active
      </Badge>

      <Tooltip content="Configure refresh policies">
        <Button
          variant="ghost"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
        />
      </Tooltip>
    </div>
  );
};
```

## 10. Database Migration System

**`backend/migrations/001_initial_schema.sql`**:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with soft delete
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Roles and permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Role mapping with time-bound support
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id, organization_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_org ON user_roles(organization_id) WHERE is_active = true;

-- Organizations (multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    billing_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 5,
    max_dashboards INTEGER DEFAULT 10,
    storage_quota_mb INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Organization members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- Data connectors
CREATE TABLE connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('postgresql', 'mysql', 'mongodb', 'rest', 'graphql', 'snowflake', 'bigquery')),
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT NOT NULL,
    connection_options JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'unhealthy', 'unknown', 'checking')),
    last_health_check TIMESTAMP,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_connectors_org ON connectors(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_connectors_type ON connectors(type);

-- Audit logging (partitioned by month for performance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'LOGIN', 'LOGOUT')),
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_y2024m02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... add more partitions as needed

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Layout versions (for point-in-time recovery)
CREATE TABLE layout_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id VARCHAR(255) NOT NULL,
    version_number INTEGER NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    change_summary TEXT,
    change_type VARCHAR(50) DEFAULT 'manual', -- manual, auto, restore, import
    layout_snapshot JSONB NOT NULL,
    widgets_snapshot JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(layout_id, version_number)
);

CREATE INDEX idx_layout_versions_layout ON layout_versions(layout_id, version_number DESC);
CREATE INDEX idx_layout_versions_org ON layout_versions(organization_id, created_at DESC);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    replaced_by UUID REFERENCES refresh_tokens(id),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- API keys for service-to-service or external access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(8) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    scopes JSONB NOT NULL DEFAULT '[]',
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_api_keys_org ON api_keys(organization_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('super_admin', 'Full system access', '["*"]', true),
('admin', 'Organization admin', '["layout:*", "widget:*", "connector:*", "user:read", "user:update", "settings:read", "settings:update"]', true),
('editor', 'Can create and edit dashboards', '["layout:create", "layout:read", "layout:update", "widget:*", "connector:read", "connector:test"]', true),
('viewer', 'View-only access', '["layout:read", "widget:read", "connector:read"]', true),
('connector_manager', 'Manage data connections', '["connector:*", "layout:read"]', true);

-- Insert system user (for automated operations)
INSERT INTO users (id, email, password_hash, first_name, is_superuser, is_active) VALUES
('00000000-0000-0000-0000-000000000000', 'system@internal.local', 'SYSTEM', 'System', true, true);
```

**`backend/migrations/002_add_widget_policies.sql`**:
```sql
-- Add refresh policies to widgets (stored in MongoDB, but tracked in SQL for analytics)
CREATE TABLE widget_refresh_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_id VARCHAR(255) NOT NULL,
    layout_id VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('interval', 'realtime', 'manual', 'schedule')),
    interval_ms INTEGER,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_refresh_at TIMESTAMP,
    next_scheduled_refresh TIMESTAMP,
    refresh_count INTEGER DEFAULT 0,
    avg_refresh_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_widget_policies_widget ON widget_refresh_policies(widget_id);
CREATE INDEX idx_widget_policies_next_refresh ON widget_refresh_policies(next_scheduled_refresh) WHERE is_active = true;

-- Query performance tracking
CREATE TABLE query_performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64) NOT NULL,
    connector_id UUID REFERENCES connectors(id),
    widget_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    query_text TEXT,
    execution_time_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    cache_hit BOOLEAN DEFAULT false,
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT,
    execution_plan JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_perf_hash ON query_performance_logs(query_hash, executed_at DESC);
CREATE INDEX idx_query_perf_connector ON query_performance_logs(connector_id, executed_at DESC);

-- Add trigger function for query hash generation
CREATE OR REPLACE FUNCTION generate_query_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.query_hash = encode(digest(NEW.query_text, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_query_hash BEFORE INSERT ON query_performance_logs
    FOR EACH ROW EXECUTE FUNCTION generate_query_hash();
```

## 11. Monitoring & Observability

**`monitoring/prometheus/prometheus.yml`**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - dashboard-prod
            - dashboard-staging
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3000']
    metrics_path: /metrics

  - job_name: 'layout-service'
    static_configs:
      - targets: ['layout-service:3002']

  - job_name: 'widget-service'
    static_configs:
      - targets: ['widget-service:3003']

  - job_name: 'connector-service'
    static_configs:
      - targets: ['connector-service:3004']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**`monitoring/grafana/dashboards/dashboard-overview.json`** (excerpt):
```json
{
  "dashboard": {
    "title": "Modular Dashboard Platform - Overview",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate by Service",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ],
        "yAxes": [
          {
            "label": "req/s",
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Average Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "p95 {{service}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Active WebSocket Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(websocket_connections_active)",
            "legendFormat": "Connections"
          }
        ]
      },
      {
        "id": 4,
        "title": "Widget Refresh Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(widget_refresh_total[1m])) by (status)",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count{state=\"active\"}",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

**`backend/shared/logger.ts`**:
```typescript
import pino from 'pino';
import { context, trace } from '@opentelemetry/api';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: process.env.SERVICE_NAME || 'unknown',
    pid: process.pid,
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    log: (obj) => {
      // Add OpenTelemetry trace context
      const span = trace.getSpan(context.active());
      if (span) {
        const spanContext = span.spanContext();
        obj.trace_id = spanContext.traceId;
        obj.span_id = spanContext.spanId;
        obj.trace_flags = spanContext.traceFlags;
      }
      return obj;
    },
  },
  redact: {
    paths: [
      '*.password',
      '*.password_hash',
      '*.token',
      '*.access_token',
      '*.refresh_token',
      '*.secret',
      '*.api_key',
      '*.credentials',
      '*.credentials_encrypted',
      'config.password',
      'config.apiKey',
    ],
    remove: true,
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : {
          target: 'pino-socket',
          options: {
            address: process.env.LOGSTASH_HOST || 'logstash',
            port: parseInt(process.env.LOGSTASH_PORT || '5000'),
            mode: 'tcp',
          },
        },
});

// Request context logger
export const getRequestLogger = (req: any) => {
  return logger.child({
    request_id: req.id,
    user_id: req.user?.id,
    organization_id: req.user?.organization_id,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
  });
};

// Audit logger for compliance
export const auditLogger = pino({
  level: 'info',
  base: { type: 'audit', service: process.env.SERVICE_NAME },
}).child({});

export default logger;
```

## 12. Complete Project Setup Instructions

**`README.md`**:
```markdown
# Modular Dashboard Platform (MDP)

Enterprise-grade, containerized dashboard system with real-time capabilities, multi-database support, and comprehensive RBAC.

## Quick Start

### Prerequisites
- Docker 24.0+
- Node.js 20+
- Python 3.11+ (for connector service)
- VS Code with recommended extensions

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/modular-dashboard-platform.git
cd modular-dashboard-platform
./scripts/setup.sh
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Development Environment
```bash
npm run dev
# Or use VS Code: Ctrl+Shift+P > "Tasks: Run Task" > "Start Development Stack"
```

### 4. Access Services
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- API Docs: http://localhost:8080/api/docs
- Grafana: http://localhost:3001
- Kibana: http://localhost:5601

## Development Workflow

### VS Code Workspace
Open `modular-dashboard.code-workspace` for multi-root workspace with:
- Integrated debugging for all services
- Shared TypeScript configuration
- Unified linting and formatting

### Running Tests
```bash
# All tests
npm run test

# Specific suites
npm run test:unit:frontend
npm run test:unit:backend
npm run test:integration
npm run test:e2e

# Watch mode
cd frontend && npm run test:watch
```

### Database Migrations
```bash
# Create new migration
npm run migrate:create -- --name add_user_preferences

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down

# MongoDB migrations
npm run migrate:mongo
```

### Adding a New Widget Type
1. Create component in `frontend/src/components/Widgets/`
2. Add to widget registry: `frontend/src/registry/widgets.ts`
3. Define config schema in `backend/shared/schemas/widget.ts`
4. Add database migration if needed
5. Write tests in `frontend/tests/unit/widgets/` and `backend/tests/integration/`

## Architecture Decisions

### Why Microservices?
- **Auth Service**: Isolated security boundary, can be swapped with external IdP
- **Layout Service**: High read/write ratio, benefits from MongoDB flexibility
- **Widget Service**: WebSocket-heavy, separate scaling from REST APIs
- **Connector Service**: Python ecosystem for data science libraries

### Database Selection
| Data | Store | Reason |
|------|-------|--------|
| Users, RBAC, Audit | PostgreSQL | ACID compliance, complex queries |
| Layouts, Widgets | MongoDB | Schema flexibility, JSON native |
| Sessions, Cache, Pub/Sub | Redis | Speed, TTL support |
| Logs, Metrics | Elasticsearch | Full-text search, time-series |

## Deployment

### Staging
```bash
kubectl apply -k k8s/overlays/staging/
```

### Production
```bash
# Requires sealed secrets or external secrets operator
kubectl apply -k k8s/overlays/production/
```

### Monitoring Stack
```bash
kubectl apply -f monitoring/
```

## Security Checklist
- [ ] Rotate JWT secrets (90 days)
- [ ] Review audit logs monthly
- [ ] Update dependency vulnerabilities
- [ ] Backup encryption keys
- [ ] Review RBAC assignments
- [ ] Penetration testing (annual)

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT License - see [LICENSE](./LICENSE)
```

This completes the comprehensive VS Code solution with:
- ✅ Full microservices architecture (4 services)
- ✅ Docker & Kubernetes deployment
- ✅ CI/CD with GitHub Actions
- ✅ Comprehensive testing (unit, integration, E2E)
- ✅ Database migrations (PostgreSQL + MongoDB)
- ✅ Monitoring with Prometheus/Grafana
- ✅ Security (RBAC, audit logging, encryption)
- ✅ Real-time WebSocket support
- ✅ Multi-tenant architecture

To use: Copy all files into the structure shown, run `./scripts/setup.sh`, and open in VS Code.