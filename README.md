# Crypto Value Analyzer
**Real-time quantitative analysis of top cryptos using native technical algorithms**

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://stock-analyzer-project-po4e2s65z-dheerajs-dms-projects.vercel.app)
[![Hostinger](https://img.shields.io/badge/Backend-Hostinger_KVM_2-673AB7?style=flat&logo=hostinger)](https://your-hostinger-vps-ip)
[![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat&logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Educational-green?style=flat)](LICENSE)

## Live Demo

- **Frontend:** [https://stock-analyzer-project-po4e2s65z-dheerajs-dms-projects.vercel.app](https://stock-analyzer-project-po4e2s65z-dheerajs-dms-projects.vercel.app)
- **API Documentation:** [https://stock-analyzer-project-0fkx.onrender.com/docs](https://stock-analyzer-project-0fkx.onrender.com/docs)

---

## Overview

Crypto Value Analyzer is a **production-grade full-stack quantitative finance application** that analyzes real cryptocurrency data and generates intelligent BUY/HOLD/SELL signals using a hybrid algorithm combining:

- **4 Industry-Standard Technical Indicators** (RSI, MACD, Bollinger Bands, EMA)
- **NewsAPI + Groq RAG Sentiment Analysis**
- **Lightweight Asynchronous Math Engine**

**Features:**
- Real-time crypto analysis for top cryptocurrencies
- Interactive charts with 200-day price history
- Hybrid scoring algorithm (final_score: 0-100)
- Automated Background Cron Jobs (15-min updates)
- Instant API with <100ms latency
- Global CDN deployment

---

## Architecture

<img width="422" height="470" alt="image" src="https://github.com/user-attachments/assets/49eff2c0-ed60-4739-bbb9-9677ba41af3d" />

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- Supabase account (free tier)

### Local Development (5 min)

**1. Clone & Setup**
```bash
git clone https://github.com/DheerajS-DM/StableCoin.git
cd StableCoin
```

**2. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip install -r requirements.txt

# Create .env
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
CRON_SECRET=your-secret-here
EOF

# Run
uvicorn main:app --reload
# Backend on http://localhost:8000
```

**3. Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env.local
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

npm start
# Frontend on http://localhost:3000
```

**4. Test**
```bash
# Backend health check
curl http://localhost:8000/health

# Analyze BTC
curl "http://localhost:8000/analyze/BTC-USD"

# Get top cryptos
curl http://localhost:8000/cryptos
```

---

## Algorithm Explained

### The "Committee" Technical Model

**Core Concept:** Instead of relying on a single indicator or heavy Pandas processing, we use a lightweight native Python engine executing 4 industry-standard algorithms simultaneously to form a consensus.

**1. RSI (Relative Strength Index) - Momentum**
Measures the speed and change of price movements. 
- BUY if < 30 (Oversold), SELL if > 70 (Overbought).

**2. MACD (Moving Average Convergence Divergence) - Trend**
Shows the relationship between two moving averages (12 EMA and 26 EMA).
- BUY if MACD line crosses above the Signal line.

**3. Bollinger Bands - Volatility & Mean Reversion**
Plots standard deviations away from a Simple Moving Average (SMA).
- BUY if price touches the lower band, SELL if it touches the upper band.

**4. EMA Crossover - Trend Confirmation**
Uses 9-EMA and 21-EMA crossovers to confirm directional trends.

**Consensus Logic:**
Each model casts a "vote" (BUY, SELL, or HOLD). 
- 4/4 BUY = **STRONG BUY**
- 3/4 BUY = **BUY**
- Mixed = **HOLD**

### AI RAG Sentiment (Groq)
In addition to the math, the engine fetches the latest news headlines via **NewsAPI** and injects them into a **Groq (Llama-3 70B)** prompt. This Retrieval-Augmented Generation ensures the AI is scoring based on *today's* news, adjusting the math score slightly up or down.

### Why It Works

* **Consensus Validation** - No single false signal triggers a trade.
* **Highly Optimized** - Runs without Pandas/Numpy, preventing OOM errors on limited VPS instances.
* **Context-Aware** - Blends pure technical math with real-world news sentiment.
* **Extensible** - Easy to plug in new algorithms into `trading_math.py`.

---

## API Documentation

### GET `/cryptos`

Returns top cryptos sorted by final_score.

```bash
curl http://localhost:8000/cryptos
```

**Response:**

```json
{
  "cryptos": [
    {
      "symbol": "BTC-USD",
      "current_price": 60000.0,
      "final_score": 75.5,
      "signal": "STRONG BUY",
      "updated_at": "2026-01-05T08:00:00Z"
    }
  ]
}
```

### GET `/history/{symbol}`

200-day price history.

```bash
curl http://localhost:8000/history/BTC-USD
```

**Response:**

```json
{
  "data": [
    {"date": "2025-04-01", "price": 60000.0}
  ]
}
```

### GET `/cron/keep-alive`

Lightweight endpoint designed to be hit by a cron job to prevent Supabase from pausing.

```bash
curl http://localhost:8000/cron/keep-alive
```

### POST `/cron/update-market`

Triggers the background task to run the math engines, fetch news, ask Groq, and update Supabase. Designed for a 15-minute cron. Requires authorization.

```bash
curl -X POST http://localhost:8000/cron/update-market \
  -H "cron-secret: your-secret-here"
```

### POST `/chat`

Chatbot endpoint that uses Groq to answer questions about specific assets. Handles rate limits gracefully.

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Why is this dropping?", "symbol": "BTC-USD"}'
```

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React 19 | Interactive UI |
| **Charting** | Recharts | Interactive price charts |
| **Backend** | FastAPI 0.104 | REST API |
| **Database** | Supabase (PostgreSQL) | Crypto data storage |
| **Data Source** | Coinbase API & NewsAPI | Real-time prices and news |
| **Scheduling** | Hostinger crontab | 15-min background updates |
| **Deployment (FE)** | Vercel | Global CDN |
| **Deployment (BE)** | Hostinger KVM 2 | Robust VPS |
| **AI/LLM** | Groq (Llama-3 70B) | High-speed RAG sentiment |
| **Testing** | Pytest | Automated API Benchmarks |

---

## File Structure

```
StableCoin/
├── backend/
│   ├── main.py               # FastAPI app + scheduler
│   ├── trading_math.py       # Core algorithms
│   ├── requirements.txt      # Python dependencies
│   ├── tests/                # Test suite
│   └── .env                  # Supabase credentials
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main component
│   │   ├── ExecutionPanel.jsx# Web3 Execution logic
│   │   ├── App.css           # Styles
│   │   └── index.js          # React entry
│   ├── package.json          # NPM dependencies
│   └── .env.local            # API URL
├── .github/workflows/
│   ├── backend-tests.yml     # Backend CI/CD
│   └── frontend-tests.yml    # Frontend CI/CD
├── .gitignore
└── README.md                 # This file
```

---

## Configuration

### Backend (.env)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
CRON_SECRET=your-cron-secret
# Optional:
SUPABASE_SERVICE_KEY=your-service-key  # For backend auth
```

### Frontend (.env.local)

```bash
REACT_APP_API_URL=https://stock-analyzer-project-0fkx.onrender.com
```

---

## Performance

* **API Response Time:** <100ms (p95)
* **Frontend Load:** ~1.2s (globally)
* **Database Queries:** <50ms
* **Update Frequency:** 15m
* **Uptime:** 99.5% (free tier)

---

## Security & Disclaimer

⚠️ **NOT FINANCIAL ADVICE** ⚠️
This software is built for educational and theoretical purposes only. It does not constitute financial advice, and you should not trade real money based on its outputs. The cryptocurrency market is highly volatile.

*This project is open-source and free to use.*
