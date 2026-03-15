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
