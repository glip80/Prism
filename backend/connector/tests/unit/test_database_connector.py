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
