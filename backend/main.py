import os
import json
import httpx
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, BackgroundTasks, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

# Import our new, lightweight math engine
import trading_math

# --- Setup & Configuration ---
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# Supabase Setup
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = None
if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Supabase init error: {e}")

# Groq Setup
groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = None
if groq_api_key:
    try:
        groq_client = Groq(api_key=groq_api_key)
    except Exception as e:
        print(f"Groq init error: {e}")

# NewsAPI Setup
news_api_key = os.getenv("NEWS_API_KEY")

app = FastAPI(title="Crypto Value Analyzer (Hostinger KVM Optimized)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

TRACKED_CRYPTOS = [
    "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "ADA-USD", "AVAX-USD", 
    "DOGE-USD", "LINK-USD", "DOT-USD", "MATIC-USD", "LTC-USD", "BCH-USD", 
    "UNI-USD", "ATOM-USD", "XLM-USD", "ALGO-USD", "NEAR-USD", "AAVE-USD",
    "SNX-USD", "MKR-USD", "GRT-USD", "FTM-USD", "SAND-USD", "MANA-USD"
]

# --- Async Data Fetchers ---

async def fetch_news_headlines(symbol: str) -> str:
    """Fetches recent news headlines for RAG injection."""
    if not news_api_key:
        return "No recent news available (API Key missing)."
    
    coin_ticker = symbol.split('-')[0]
    # Query for the last 3 days
    from_date = (datetime.now(timezone.utc) - timedelta(days=3)).strftime('%Y-%m-%d')
    url = f"https://newsapi.org/v2/everything?q={coin_ticker}+crypto&from={from_date}&sortBy=publishedAt&apiKey={news_api_key}&pageSize=3"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                articles = data.get("articles", [])
                if not articles:
                    return "No recent news found."
                headlines = [f"- {a.get('title')} ({a.get('source', {}).get('name')})" for a in articles]
                return "\n".join(headlines)
    except Exception as e:
        print(f"News fetch error for {symbol}: {e}")
        
    return "Error fetching news."

async def fetch_groq_sentiment(symbol: str, headlines: str) -> dict:
    """Uses Groq with RAG (Recent Headlines) for accurate sentiment."""
    if not groq_client:
        return {"sentiment": "ok", "analysis": "AI Offline."}
        
    prompt = f"""
    You are a quantitative crypto analyst. Based ONLY on the following recent news headlines, determine the current market sentiment for {symbol}.
    
    Recent Headlines:
    {headlines}
    
    Respond EXACTLY in this JSON format:
    {{
        "sentiment": "good" | "ok" | "bad",
        "analysis": "1-2 sentence justification based on the headlines provided."
    }}
    """
    try:
        # Run synchronous Groq API call in a thread to not block async loop
        def _call_groq():
            return groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
        chat_completion = await asyncio.to_thread(_call_groq)
        text = chat_completion.choices[0].message.content.strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Groq API Error for {symbol}: {e}")
        return {"sentiment": "ok", "analysis": "AI analysis failed."}

async def fetch_coinbase_candles_async(client: httpx.AsyncClient, symbol: str, days: int = 200) -> list[float]:
    """Lightweight async fetcher returning only close prices."""
    url = f"https://api.exchange.coinbase.com/products/{symbol}/candles"
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)
    
    params = {
        "start": start_time.isoformat(),
        "end": end_time.isoformat(),
        "granularity": 86400  # 1 day candles
    }
    
    try:
        response = await client.get(url, params=params, timeout=10.0)
        if response.status_code == 200:
            data = response.json()
            # Coinbase returns: [ [time, low, high, open, close, volume], ... ]
            # It's sorted descending by time, so we reverse it for our math engine
            data.reverse()
            close_prices = [float(candle[4]) for candle in data]
            return close_prices
        elif response.status_code == 429:
            print(f"Rate limited by Coinbase for {symbol}")
            return []
    except Exception as e:
        print(f"Coinbase fetch error for {symbol}: {e}")
        
    return []

# --- Core Algorithm ---

async def analyze_and_upsert_symbol(client: httpx.AsyncClient, symbol: str):
    """Fetches data, runs the 4 math models, fetches AI sentiment, and saves to Supabase."""
    print(f"Analyzing {symbol}...")
    close_prices = await fetch_coinbase_candles_async(client, symbol, days=200)
    
    if not close_prices or len(close_prices) < 30:
        print(f"Insufficient data for {symbol}")
        return
        
    # Run Math Models
    consensus = trading_math.calculate_consensus(close_prices)
    current_price = close_prices[-1]
    
    # Run AI RAG Model
    headlines = await fetch_news_headlines(symbol)
    ai_data = await fetch_groq_sentiment(symbol, headlines)
    
    sentiment_word = ai_data.get("sentiment", "ok").lower()
    ai_analysis = ai_data.get("analysis", "No detailed analysis available.")
    
    # AI modifies the final signal slightly
    final_signal = consensus["final_signal"]
    score = consensus["score"]
    
    if sentiment_word == "good": 
        score = min(100, score + 10)
    elif sentiment_word == "bad": 
        score = max(0, score - 10)

    # Note: For stablecoins, we check if they are in the crypto_metadata table
    # This logic is handled dynamically. The math is done regardless, but if it's a stablecoin, 
    # we can overwrite the signal based on the peg. We will fetch metadata first.
    is_stablecoin = False
    peg_target = 1.00
    peg_tolerance = 0.02
    
    if supabase:
        try:
            # Query metadata (The populate pattern)
            meta_resp = supabase.table("crypto_metadata").select("*").eq("symbol", symbol).execute()
            if meta_resp.data:
                metadata = meta_resp.data[0]
                is_stablecoin = metadata.get("is_stablecoin", False)
                peg_target = metadata.get("peg_target", 1.0)
                peg_tolerance = metadata.get("peg_tolerance", 0.02)
        except Exception as e:
            print(f"Metadata fetch failed for {symbol}: {e}")
            
    if is_stablecoin:
        if current_price < (peg_target - peg_tolerance): 
            final_signal = "SELL (DE-PEG)"
            score = 0.0
        elif current_price > (peg_target + peg_tolerance): 
            final_signal = "BUY (PREMIUM)"
            score = 100.0
        else: 
            final_signal = "HOLD (PEG INTACT)"
            score = 50.0

    # Save to Supabase
    if supabase:
        try:
            coin_ticker = symbol.split('-')[0]
            ai_links = [
                f"https://finance.yahoo.com/quote/{symbol}/news/",
                f"https://news.google.com/search?q={coin_ticker}+crypto+news"
            ]
            
            payload = {
                "symbol": symbol, 
                "current_price": round(current_price, 3), 
                "final_score": round(score, 1),
                "signal": final_signal,
                "components": {
                    "indicators": consensus["indicators"],
                    "ai_sentiment": sentiment_word,
                    "ai_analysis": ai_analysis,
                    "ai_links": ai_links,
                    "recent_headlines": headlines
                },
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            # Add margin for backward compatibility with frontend
            payload["margin"] = round(score - 50, 1)
            payload["weighted_avg"] = round(trading_math.calculate_sma(close_prices, 20)[-1], 3)
            
            supabase.table("cryptos").upsert(payload).execute()
            print(f"Successfully upserted {symbol}")
        except Exception as e:
            print(f"Supabase upsert failed for {symbol}: {e}")

async def run_market_update():
    """Background task executed by cron."""
    print("Starting market update cron...")
    # Process in chunks of 4 to prevent aggressive rate limits from Coinbase/NewsAPI
    chunk_size = 4
    async with httpx.AsyncClient() as client:
        for i in range(0, len(TRACKED_CRYPTOS), chunk_size):
            chunk = TRACKED_CRYPTOS[i:i+chunk_size]
            tasks = [analyze_and_upsert_symbol(client, sym) for sym in chunk]
            await asyncio.gather(*tasks)
            # Sleep between chunks to respect API limits
            await asyncio.sleep(2)
    print("Market update complete.")

# --- API Endpoints ---

@app.get("/")
def root():
    return {"status": "Crypto Value Analyzer (Hostinger Edition) running"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/cryptos")
def top_cryptos():
    """
    Returns the cached data from Supabase.
    Real-time calculation is now entirely handled by the 15-minute cron job.
    """
    if supabase:
        try:
            # We fetch from cryptos table. 
            response = supabase.table("cryptos").select("*").order("final_score", desc=True).execute()
            if response.data:
                return {"cryptos": response.data, "total": len(response.data), "source": "database_cache"}
        except Exception as e:
            print(f"Error fetching cryptos: {e}")
            return {"error": "Failed to fetch from database"}
            
    return {"cryptos": [], "total": 0, "source": "none"}

@app.post("/analyze/{symbol}")
async def analyze_endpoint(symbol: str):
    """Force re-analyzes a specific coin."""
    async with httpx.AsyncClient() as client:
        await analyze_and_upsert_symbol(client, symbol)
    
    if supabase:
        try:
            resp = supabase.table("cryptos").select("*").eq("symbol", symbol).execute()
            if resp.data:
                return resp.data[0]
        except Exception as e:
            print(f"Error fetching analyzed symbol: {e}")
            
    return {"error": "Failed to analyze"}

@app.get("/history/{symbol}")
async def get_history(symbol: str):
    """
    Returns the historical price data for charting.
    Fetches the 200 day candles directly from Coinbase.
    """
    async with httpx.AsyncClient() as client:
        close_prices = await fetch_coinbase_candles_async(client, symbol, days=200)
    
    if not close_prices:
        raise HTTPException(status_code=404, detail="History not found")
        
    # Generate dates for the frontend chart starting from 200 days ago
    dates = [(datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(len(close_prices)-1, -1, -1)]
    data = [{"date": d, "price": p} for d, p in zip(dates, close_prices)]
    return {"data": data}

# --- Cron Endpoints ---

@app.get("/cron/keep-alive")
def keep_alive():
    """Pinged by Hostinger Cron every 15-30 mins to keep Supabase awake."""
    if supabase:
        try:
            supabase.table("cryptos").select("symbol").limit(1).execute()
            return {"status": "Supabase pinged successfully."}
        except Exception as e:
            print(f"Supabase ping error: {e}")
            return {"error": "Failed to ping Supabase"}
    return {"status": "Supabase not configured."}

@app.post("/cron/update-market")
async def trigger_market_update(background_tasks: BackgroundTasks, cron_secret: str | None = Header(default=None)):
    """
    Pinged by Hostinger Cron every 15 mins.
    Fires off the update process in the background so the cron request doesn't timeout.
    """
    expected_secret = os.getenv("CRON_SECRET")
    if expected_secret and cron_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    background_tasks.add_task(run_market_update)
    return {"status": "Market update triggered in background."}

# --- Groq Chatbot Endpoint ---

class ChatRequest(BaseModel):
    message: str
    symbol: str

@app.post("/chat")
async def chat_with_bot(req: ChatRequest):
    """
    Simple Chat endpoint for the frontend. 
    If Groq rate limit is hit, it returns a 429 error so the frontend can hide the UI.
    """
    if not groq_client:
         raise HTTPException(status_code=503, detail="Chatbot offline. GROQ_API_KEY missing.")
         
    prompt = f"The user is asking about {req.symbol}. User: {req.message}. Respond concisely as a helpful crypto assistant."
    
    try:
        def _call_chat():
            return groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                max_tokens=150
            )
        
        response = await asyncio.to_thread(_call_chat)
        return {"reply": response.choices[0].message.content.strip()}
        
    except Exception as e:
        # Check if it's a rate limit error (Groq usually returns 429)
        error_msg = str(e)
        if "429" in error_msg or "rate limit" in error_msg.lower():
            # Return specific error for frontend to handle
            raise HTTPException(status_code=429, detail="RATE_LIMIT_REACHED")
        raise HTTPException(status_code=500, detail="Chat failed. Please try again.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)