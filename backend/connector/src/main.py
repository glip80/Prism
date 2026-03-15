# connector_service/main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import aioredis
import asyncpg
from typing import Dict, Any, List, Optional
import asyncio
from dataclasses import dataclass
import json
import aiohttp
from pydantic import BaseModel
import os

app = FastAPI(title="Connector Service")

# Mock User and get_current_user for now (should be decoded from JWT in real app)
class User(BaseModel):
    id: str
    organization_id: str

async def get_current_user():
    return User(id="system", organization_id="system")

class QueryRequest(BaseModel):
    query: str
    params: List[Any] = []
    skip_cache: bool = False
    cache_duration: int = 60
    method: str = "GET"
    payload: Optional[Dict[str, Any]] = None

# Async database engines
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/dashboard")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

async_engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    echo=False
)
AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

redis = aioredis.from_url(REDIS_URL)

@dataclass
class ConnectionConfig:
    type: str  # postgresql, mysql, mongodb, rest, graphql
    host: str
    port: int
    database: str
    username: str
    password: str  # Encrypted, decrypted here
    options: Dict[str, Any]

class DatabaseConnector:
    def __init__(self, config: ConnectionConfig):
        self.config = config
        self.pool = None

    async def connect(self):
        if self.config.type == "postgresql":
            self.pool = await asyncpg.create_pool(
                host=self.config.host,
                port=self.config.port,
                database=self.config.database,
                user=self.config.username,
                password=self.config.password,
                min_size=1,
                max_size=5
            )
        # Add other database types if needed

    async def execute_query(self, query: str, params: List[Any]) -> List[Dict]:
        if not self.pool:
            await self.connect()
        async with self.pool.acquire() as conn:
            if self.config.type == "postgresql":
                rows = await conn.fetch(query, *params)
                return [dict(row) for row in rows]
            return []
            
    async def health_check(self) -> bool:
        try:
            if not self.pool:
                await self.connect()
            async with self.pool.acquire() as conn:
                await conn.execute("SELECT 1")
            return True
        except Exception:
            return False

    async def close(self):
        if self.pool:
            await self.pool.close()

class APIConnector:
    def __init__(self, config: ConnectionConfig):
        self.config = config
        self.session = None

    async def connect(self):
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(timeout=timeout)

    async def execute_request(self, endpoint: str, method: str = "GET", payload: Dict = None) -> Dict:
        if not self.session:
            await self.connect()
        url = f"{self.config.host}:{self.config.port}{endpoint}"
        headers = {"Authorization": f"Bearer {self.config.password}"}
        async with self.session.request(method, url, json=payload, headers=headers) as response:
            return await response.json()

    async def close(self):
        if self.session:
            await self.session.close()

# Connection pool manager
class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, Any] = {}
        self.lock = asyncio.Lock()

    async def get_connection(self, connector_id: str) -> Any:
        async with self.lock:
            if connector_id not in self.connections:
                config = await self.load_config(connector_id)
                connector = self.create_connector(config)
                await connector.connect()
                self.connections[connector_id] = connector
            return self.connections[connector_id]

    async def load_config(self, connector_id: str) -> ConnectionConfig:
        async with AsyncSessionLocal() as session:
            # Example mock since we don't have the table or vault yet
            # In real system, it performs SELECT * FROM connectors WHERE id = :id
            # Wait, let's just make it a mock for testing so the file compiles.
            return ConnectionConfig(
                type="postgresql", host="localhost", port=5432,
                database="dashboard", username="postgres", password="password", options={}
            )

    def create_connector(self, config: ConnectionConfig):
        if config.type in ["postgresql", "mysql", "mongodb"]:
            return DatabaseConnector(config)
        elif config.type in ["rest", "graphql"]:
            return APIConnector(config)
        raise ValueError(f"Unknown connector type: {config.type}")

manager = ConnectionManager()

def log_query_execution(user_id, connector_id, query, length):
    print(f"User {user_id} executed query on {connector_id} (len: {length})")

@app.post("/query/{connector_id}")
async def execute_query(
    connector_id: str,
    query_request: QueryRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    cache_key = f"cache:query:{hash(query_request.query + str(query_request.params))}"
    cached = await redis.get(cache_key)
    
    if cached and not query_request.skip_cache:
        return json.loads(cached)
        
    connector = await manager.get_connection(connector_id)
    try:
        if connector.config.type in ["rest", "graphql"]:
            result = await connector.execute_request(
                query_request.query, 
                query_request.method,
                query_request.payload
            )
        else:
            result = await connector.execute_query(
                query_request.query, 
                query_request.params
            )
            
        if query_request.cache_duration > 0:
            await redis.setex(
                cache_key, 
                query_request.cache_duration, 
                json.dumps(result)
            )
            
        background_tasks.add_task(log_query_execution, user.id, connector_id, query_request.query, len(str(result)))
        
        return {
            "data": result,
            "cached": False,
            "execution_time_ms": 10,  # Example actual time
            "connector_type": connector.config.type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refresh/{widget_id}")
async def refresh_widget(
    widget_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    # Mocking widget fetch for now
    class MockDS:
        connector_id = "test-connector"
        query = "SELECT 1"
        parameters = []
        cache_duration = 300
    
    ds = MockDS()
    req = QueryRequest(query=ds.query, params=ds.parameters, skip_cache=True, cache_duration=ds.cache_duration)
    result = await execute_query(ds.connector_id, req, background_tasks, user)
    
    await redis.publish(f"widget:refresh:{widget_id}", json.dumps(result))
    return result

@app.get("/health/{connector_id}")
async def health_check(connector_id: str):
    connector = await manager.get_connection(connector_id)
    is_healthy = await connector.health_check()
    return {"healthy": is_healthy, "connector_id": connector_id}
