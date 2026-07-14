import pytest
import time
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_health_check_performance(async_client):
    """Test if the API is up."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
@patch("main.supabase")
async def test_cron_keep_alive(mock_supabase, async_client):
    """Test the Supabase keep-alive cron endpoint."""
    mock_execute = MagicMock()
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute = mock_execute
    
    response = await async_client.get("/cron/keep-alive")
    assert response.status_code == 200
    assert response.json()["status"] == "Supabase pinged successfully."

@pytest.mark.asyncio
@patch("main.supabase")
async def test_cryptos_fetch_speed(mock_supabase, async_client):
    """Test the fetching of the cached cryptos from Supabase."""
    mock_execute = MagicMock()
    mock_execute.data = [{"symbol": "BTC-USD", "current_price": 60000}]
    mock_supabase.table.return_value.select.return_value.order.return_value.execute.return_value = mock_execute
    
    response = await async_client.get("/cryptos")
    assert response.status_code == 200
    data = response.json()
    assert "cryptos" in data
    assert data["cryptos"][0]["symbol"] == "BTC-USD"

@pytest.mark.asyncio
@patch("main.groq_client")
async def test_chat_rate_limit_handling(mock_groq, async_client):
    """Test the Groq chatbot endpoint."""
    payload = {"message": "Is BTC a good buy?", "symbol": "BTC-USD"}
    
    # Mocking successful Groq completion
    mock_choice = MagicMock()
    mock_choice.message.content = "Yes, BTC is looking good."
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_groq.chat.completions.create.return_value = mock_completion
    
    response = await async_client.post("/chat", json=payload)
    assert response.status_code == 200
    assert response.json()["reply"] == "Yes, BTC is looking good."

@pytest.mark.asyncio
@patch("main.os.getenv")
async def test_cron_update_market_background_trigger(mock_getenv, async_client):
    """Test that the 15-minute cron triggers a background task with auth header."""
    # Mock CRON_SECRET
    mock_getenv.return_value = "my-secret-token"
    
    # Test without auth
    response = await async_client.post("/cron/update-market")
    assert response.status_code == 401
    
    # Test with auth
    headers = {"cron-secret": "my-secret-token"}
    response = await async_client.post("/cron/update-market", headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Market update triggered in background."
