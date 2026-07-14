import pytest
import httpx
from main import app

@pytest.fixture
async def async_client():
    """Returns an AsyncClient for testing FastAPI endpoints."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        yield client
