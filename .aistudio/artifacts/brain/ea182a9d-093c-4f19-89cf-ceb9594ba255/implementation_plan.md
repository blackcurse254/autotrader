# Dockerfile.bot & Multi-Container Docker Compose Orchestration

Architectural plan to provide a dedicated, production-ready `Dockerfile.bot`, update `docker-compose.yml` to build both `quantbot-web` and `quantbot-bot` via dedicated build contexts, and ensure immediate autonomous trade execution upon deployment.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Build Architecture**: Both services will use explicit build directives (`dockerfile: Dockerfile` for the React/Express dashboard and `dockerfile: Dockerfile.bot` for the Python CCXT bot).
> - **Zero-Config Autonomous Start**: `quantbot-bot` starts immediately upon `docker compose up -d --build` in **Paper Trading mode**, ingests live market data, and begins evaluating signals and executing round-trip trades with zero manual input required.
> - **Windows File Extension Safeguard**: To prevent Windows from saving `Dockerfile.bot` as a hidden `Dockerfile.bot.txt`, the in-app guide will include 1-click download buttons and PowerShell creation commands.

---

## 1. Overview & Core Concept

When running `docker compose up -d --build`, Docker will build two independent, coordinated containers:
1. **`quantbot-web`**: Built from `Dockerfile` (Node.js 20 Alpine). Serves the quantitative terminal, interactive charts, AI Copilot, and backtesting studio on `http://localhost:3000`.
2. **`quantbot-bot`**: Built from `Dockerfile.bot` (Python 3.11 Slim). Automatically installs `ccxt`, `pandas`, `numpy`, and `python-dotenv`, starts the autonomous event loop, monitors live prices, enters positions upon strategy triggers, enforces Take Profit and Stop Loss, and records trade ledgers to `/app/data`.

---

## 2. Technical Architecture & File Configurations

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE ORCHESTRATION                    │
│                                                                        │
│   ┌──────────────────────────────┐    ┌────────────────────────────┐   │
│   │   quantbot-web (Port 3000)   │    │ quantbot-bot (Autonomous)  │   │
│   │                              │    │                            │   │
│   │  • Build: Dockerfile         │    │  • Build: Dockerfile.bot   │   │
│   │  • Base: node:20-alpine      │    │  • Base: python:3.11-slim  │   │
│   │  • React 19 + Tailwind CSS   │    │  • CCXT, Pandas, NumPy     │   │
│   │  • Express API Proxy         │    │  • Auto-Trading Daemon     │   │
│   │  • Gemini 3.8 Flash Copilot  │    │  • Continuous Round-Trips  │   │
│   └──────────────┬───────────────┘    └──────────────┬─────────────┘   │
│                  │                                   │                 │
│                  └─────────────────┬─────────────────┘                 │
│                                    ▼                                   │
│                        Shared Data Volume (/app/data)                  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     ▼
                      Public Market Feeds (Binance API)
```

### Detailed Component Specifications

### 1. `Dockerfile.bot`
```dockerfile
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY quantbot.py ./

CMD ["python", "-u", "quantbot.py"]
```

### 2. `docker-compose.yml`
```yaml
services:
  quantbot-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: quantbot-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
    volumes:
      - trade-data:/app/data

  quantbot-bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    container_name: quantbot-bot
    restart: unless-stopped
    environment:
      - EXCHANGE_ID=${EXCHANGE_ID:-binance}
      - SYMBOL=${SYMBOL:-BTC/USDT}
      - TIMEFRAME=${TIMEFRAME:-1h}
      - PAPER_TRADING=${PAPER_TRADING:-True}
      - FAST_PERIOD=${FAST_PERIOD:-9}
      - SLOW_PERIOD=${SLOW_PERIOD:-21}
      - RSI_PERIOD=${RSI_PERIOD:-14}
      - STOP_LOSS_PCT=${STOP_LOSS_PCT:-0.02}
      - TAKE_PROFIT_PCT=${TAKE_PROFIT_PCT:-0.05}
      - TRAILING_STOP_PCT=${TRAILING_STOP_PCT:-0.015}
      - ALLOCATION_PCT=${ALLOCATION_PCT:-0.25}
      - PYTHONUNBUFFERED=1
    volumes:
      - trade-data:/app/data
      - ./quantbot.py:/app/quantbot.py:ro

volumes:
  trade-data:
    name: quantbot-trade-data
```

### 3. Automated Trading Verification (`quantbot.py`)
- Starts immediately on container launch without waiting for manual command.
- Scans market ticks every 5 seconds.
- Automatically places simulated market BUY orders when indicator conditions are satisfied.
- Continuously monitors active position for Stop Loss (-2%) and Take Profit (+5%).
- Closes trades, logs realized PnL, updates capital, and immediately loops to scan for the next setup.

---

## 3. Verification & Execution Plan

1. **File Generation**:
   - Write clean, validated `Dockerfile.bot` and `requirements.txt`.
   - Update `docker-compose.yml` with the dual-build configuration.
   - Update in-app User Guide with 1-click download options for `Dockerfile.bot`.
2. **Build & Syntax Verification**:
   - Verify byte-compilation of `quantbot.py`.
   - Co-execute `compile_applet` and `lint_applet` to confirm 0 TypeScript/build errors.
   - Restart the dev server and verify local HTTP response.
