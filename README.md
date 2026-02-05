# Bitcoin AI Agent Analysis

An automated two-component system that pulls real-time Bitcoin market data, runs technical analysis, and uses an AI agent to evaluate market direction and make trading decisions.

## How It Works

```
CoinGecko API
    │
    ▼
┌─────────────────────────┐
│   Dashboard (React)     │
│  ─────────────────────  │
│  • Fetches live data    │
│  • Computes indicators  │
│  • Evaluates conditions │
│  • Publishes analysis   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Agent (Node.js)       │
│  ─────────────────────  │
│  • Scrapes dashboard    │
│  • Sends data to Claude │
│  • Gets BUY/SELL/HOLD   │
│  • Updates portfolio    │
└─────────────────────────┘
```

## Components

### Dashboard (`/dashboard`)

A React web app that provides real-time Bitcoin market analysis.

**Technical Indicators:**
- RSI (Relative Strength Index) — overbought/oversold detection
- MACD — momentum and trend direction
- SMA / EMA — moving average trend confirmation
- Bollinger Bands — volatility measurement
- Support and resistance level identification
- Volume analysis

**Analysis Features:**
- Market regime classification (Positive / Negative / Mixed)
- Action evaluation engine (Favorable / Caution / Wait)
- 2-week and 4-week statistical price projections
- Machine-readable JSON output for agent consumption

**Built with:** React, Vite, CoinGecko API

### Agent (`/agent`)

An autonomous trading agent that reads the dashboard analysis and uses AI to make decisions.

**How it works:**
1. Scrapes the live dashboard using Puppeteer
2. Extracts the structured market analysis data
3. Sends the data along with current portfolio state to Claude
4. Claude evaluates all conditions and returns a BUY, SELL, or HOLD decision
5. Logs the decision and updates the portfolio

**Built with:** Node.js, Anthropic SDK (Claude), Puppeteer

## Setup

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### Agent
```bash
cd agent
npm install
```

Create a `.env` file in the `/agent` directory:
```
ANTHROPIC_API_KEY=your_api_key_here
```

Run the agent:
```bash
node agent.mjs
```

## Built With

- [React](https://react.dev/) + [Vite](https://vitejs.dev/) — dashboard frontend
- [CoinGecko API](https://www.coingecko.com/en/api) — real-time and historical Bitcoin data
- [Anthropic Claude](https://www.anthropic.com/) — AI-powered trading decisions
- [Puppeteer](https://pptr.dev/) — headless browser for dashboard scraping
