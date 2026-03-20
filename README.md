
```markdown
# Ballast Liquidity Engine
**Real-time quantitative crypto analysis with integrated Web3 execution and AI sentiment tracking.**

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://your-vercel-link.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://your-render-link.onrender.com)
[![Web3](https://img.shields.io/badge/Web3-Wagmi_&_RainbowKit-blue?style=flat)](https://wagmi.sh/)
[![AI](https://img.shields.io/badge/AI-Groq_Inference-f55036?style=flat)](https://groq.com/)
[![License](https://img.shields.io/badge/License-Educational-green?style=flat)](LICENSE)

## Overview

Ballast is a **production-grade Web3 quantitative finance dashboard** that analyzes real-time cryptocurrency data, tracks stablecoin peg stability, and allows users to execute on-chain transactions directly from the interface. 

It combines traditional quantitative metrics (Z-scores, volatility indexing) with live AI sentiment analysis and Web3 smart contract execution.

**Key Features:**
- **Autonomous Quant Analysis:** Real-time scoring of digital assets using statistical deviation and exponential decay.
- **Web3 Execution Layer:** Native wallet connection via RainbowKit.
- **On-Chain Interactions:** Direct ERC-20 token transfers built with Wagmi and Viem.
- **Emergency Routing:** Dynamic deep-linking to Uniswap for instant liquidations during de-peg events.
- **AI Sentiment Engine:** Live market sentiment justification powered by Groq's high-speed inference.
- **Interactive Data:** 250-day interactive charts with drag-to-zoom capabilities.

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React 18 | Interactive UI |
| **Web3 Core** | Wagmi & Viem | Blockchain interaction & state management |
| **Wallet UI** | RainbowKit | Seamless wallet connection UX |
| **Charting** | Recharts | Interactive price action visualization |
| **Backend** | FastAPI (Python) | REST API & Quant Engine |
| **AI Integration**| Groq API | Instantaneous market sentiment analysis |
| **Deployment** | Vercel & Render | Global CDN and Server orchestration |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- WalletConnect Project ID (Free)
- Groq API Key (Free)

### 1. Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip install -r requirements.txt

# Create .env
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
EOF

# Run the engine
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (React + Web3)

```bash
cd ../frontend

# Install dependencies (Legacy flag required for CRA + Wagmi v2 compatibility)
npm install --legacy-peer-deps

# Create .env.local
cat > .env.local << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# Note: Add your WalletConnect Project ID inside src/index.js

# Start the development server (Uses react-app-rewired for ESM compatibility)
npm start
```

---

## Deployment Architecture & Overrides

This project utilizes specific overrides to successfully bridge older Create React App architectures with modern Web3 EcmaScript Modules (ESM) in a Vercel production environment.

**Vercel Build Configurations:**
* **Install Command:** `npm install --legacy-peer-deps` (Bypasses CRA TypeScript v4 vs Wagmi TypeScript v5 strictness).
* **Environment Variables:** `CI=false` (Prevents Vercel from treating Webpack missing-optional-dependency warnings as fatal build errors).
* **Build Command:** `react-app-rewired build` (Injects a custom `config-overrides.js` to disable `fullySpecified` rules, allowing Webpack to bundle Web3 ESM files without strict `.js` extensions).

---

## Quant Algorithm & AI Engine

### 1. The Ballast Score
A proprietary scoring model (0-100) combining:
* **Exponential Decay Pricing:** Heavily weights recent price action while filtering out historical noise.
* **Volatility Indexing:** Calculates 1-year standard deviation.
* **Stability Index:** Specifically tracks micro-deviations in stablecoins (e.g., USDT, USDC) to detect early de-pegging risks.

### 2. AI Sentiment Overlay
Passes recent price vectors and market indicators to the **Groq API**. The LLM processes the quantitative data and returns a synthesized, human-readable market sentiment (Good/Bad/Neutral) along with contextual justification and source routing.

---

## Security & Disclaimer

**⚠️ NOT FINANCIAL ADVICE**

* This project is for **educational and hackathon purposes only**.
* Do not use for real trading decisions or production capital allocation.
* Interacting with smart contracts involves risk. 

---

## Portfolio Impact

**For FinTech & Software Engineering Roles, this demonstrates:**

> "I architected a full-stack Web3 liquidity dashboard that bridges quantitative Python backend services with a modern React frontend. Integrated Wagmi and RainbowKit for direct on-chain ERC-20 execution, utilized Groq LLMs for real-time market sentiment, and successfully engineered custom Webpack overrides to deploy complex ESM dependencies to a global Vercel edge network."

---

## Author

**Dheeraj S** | B.E. Information Technology (Class of '28)
*Building at the intersection of Quantitative Finance, Web3, and Software Engineering.*

---
**Status:** Production Ready
**Uptime:** 24/7 Monitoring Enabled
```
