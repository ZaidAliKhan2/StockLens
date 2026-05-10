# StockLens

**Stock Market Analytics Dashboard — Query-Driven Intelligence for Historical Stock Data**

> DBMS Course Project · CSL-220 · Bahria University, Karachi · 2026

---

## What It Is

StockLens is a web-based analytics dashboard for exploring historical US stock market data. It lets retail investors, finance students, and data enthusiasts filter and analyze years of price history through an interactive UI — no SQL knowledge required.

**What it is NOT:** a stock predictor, a trading platform, or a financial advisor. It is a pattern detection and analytics engine built entirely on pre-written, parameterized SQL queries running against a normalized relational database.

The core philosophy: **all analytical intelligence lives in the database.** The frontend is a thin display layer. The backend is a pass-through API. The database is the product.

---

## Features

| Feature              | What It Does                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stock Explorer**   | Price history chart, 20/50-day moving average overlay, 7 stat cards (period high/low, avg close, avg volume, volatility, 52-week high/low), best/worst month |
| **Pattern Finder**   | Detects stocks matching behavioral patterns: consecutive green days, volume spikes, MA crossovers                                                            |
| **Stock Comparator** | Normalized growth chart for 2–3 stocks + SPY benchmark, correlation stats, comparison table                                                                  |
| **Screener**         | Multi-filter panel (sector, price range, volume, growth %) with volatility ranking within sectors                                                            |
| **AI Explainer**     | Gemini API integration that converts raw query results into plain-English summaries (non-predictive, non-advisory)                                           |

---

## Architecture

StockLens follows a three-tier architecture with a one-time data ingestion layer below the database.

```
[Yahoo Finance] ──yfinance──▶ [Python Ingestion Script] ──pyodbc──▶ [SQL Server Express]
                                                                              │
                                                             Stored Procedures & Views
                                                                              │
                                                              [Node.js + Express.js API]
                                                                              │
                                                              [React.js + Recharts SPA]
                                                                              │
                                                               [Gemini API — AI Explainer]
```

**Request lifecycle:** User sets filters → React sends GET/POST to Express → Express calls SQL Server stored procedure → SQL executes CTE/window function query → Express returns JSON → React renders chart + table → result data is sent to Gemini → AI summary rendered below chart.

---

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Database       | SQL Server Express (T-SQL, stored procedures, window functions) |
| Data Ingestion | Python + yfinance + pyodbc                                      |
| Backend        | Node.js v18+ · Express.js v4.x · mssql v10.x                    |
| Frontend       | React.js v18.x · Recharts v2.x · Tailwind CSS                   |
| AI Layer       | Google Gemini API (`gemini-1.5-flash`)                          |
| Config         | dotenv (`.env` files)                                           |

---

## Database Schema

Five tables, normalized to 3NF, all foreign keys enforced.

```
Sectors (sector_id PK, sector_name, description)
    │
    └── Companies (ticker PK, company_name, sector_id FK, industry, exchange, country, market_cap)
            │
            ├── StockPrices (price_id PK, ticker FK, trade_date, open, high, low, close, volume)
            │       Indexes: (ticker, trade_date) composite · trade_date · ticker
            │
            └── PatternLog (log_id PK, ticker FK, pattern_type, detected_date, streak_length, detail_json)

MarketIndex (index_id PK, index_name, trade_date, close_value)   ← standalone, joined by date
```

---

## Data

- ~30–40 US-listed stocks across 5–6 sectors (Technology, Finance, Healthcare, Energy, Consumer + Index ETFs)
- 10-year historical OHLC data: **2015–2026** (~100,000–120,000 rows)
- Fetched once via `yfinance` — no API key required, no hard rate limits for reasonable usage
- Company metadata (sector, industry, market cap) also pulled from `yfinance` at ingestion time

**Covered tickers include:** AAPL, MSFT, GOOGL, META, NVDA, AMD, INTC, TSLA, JPM, BAC, GS, JNJ, PFE, XOM, CVX, AMZN, WMT, COST, SPY, QQQ, DIA and more.

---

## Setup

### Prerequisites

- SQL Server Express (free)
- Node.js v18+
- Python 3.x
- A Google Gemini API key (free tier — `gemini-1.5-flash`)

### 1. Install Python dependencies

```bash
pip install yfinance pyodbc pandas
```

### 2. Seed the database

Run the ingestion script once. This fetches all historical data and loads it into SQL Server.

```bash
python data_ingestion.py
```

This populates `Sectors`, `Companies`, `StockPrices`, and `MarketIndex` tables. It only needs to run again if you want to refresh the dataset.

### 3. Configure environment

Create a `.env` file in the backend root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=StockLens
```

### 4. Install and run the backend

```bash
cd backend
npm install
node index.js
```

The API runs on `http://localhost:3000` by default.

### 5. Install and run the frontend

```bash
cd frontend
npm install
npm start
```

---

## API Endpoints

All endpoints call SQL Server stored procedures directly. No business logic lives in the API layer.

| Method | Endpoint                     | Stored Procedure              | Feature                |
| ------ | ---------------------------- | ----------------------------- | ---------------------- |
| GET    | `/api/stock/history`         | `sp_GetPriceHistory`          | Explorer — price chart |
| GET    | `/api/stock/stats`           | `sp_GetStockStats`            | Explorer — stat cards  |
| GET    | `/api/stock/moving-averages` | `sp_GetMovingAverages`        | Explorer — MA lines    |
| GET    | `/api/patterns/green-days`   | `sp_FindConsecutiveGreenDays` | Pattern Finder         |
| GET    | `/api/patterns/volume-spike` | `sp_FindVolumeSpikeStocks`    | Pattern Finder         |
| GET    | `/api/patterns/ma-crossover` | `sp_FindMACrossover`          | Pattern Finder         |
| GET    | `/api/compare`               | `sp_CompareStocks`            | Comparator             |
| GET    | `/api/compare/correlation`   | `sp_GetCorrelation`           | Comparator             |
| GET    | `/api/screener`              | `sp_ScreenerFilter`           | Screener               |
| GET    | `/api/sectors/volatility`    | `sp_GetSectorVolatility`      | Screener               |

**Example:** `GET /api/stock/stats?ticker=AAPL&start=2023-01-01&end=2024-01-01`

---

## SQL Highlights

The database layer uses advanced T-SQL throughout:

- **Window functions** — `AVG() OVER (ROWS BETWEEN N PRECEDING AND CURRENT ROW)` for moving averages
- **LAG()** — daily direction detection for streak calculations
- **Multi-CTE streak detection** — 4-CTE chain using running `SUM()` reset trick for consecutive green day patterns
- **RANK() OVER (PARTITION BY sector)** — volatility ranking within and across sectors
- **FIRST_VALUE()** — anchored percentage growth calculation for the comparator
- **Parameterized stored procedures** — all user input flows through named SQL parameters (no string concatenation, no injection risk)

---

## Design Decisions

**Why SQL Server Express?** Required for the DBMS course. Full T-SQL support including CTEs and window functions. The 10GB limit is not a constraint at this dataset size.

**Why yfinance over a Kaggle dataset?** Programmatic and reproducible — any team member can run the script and get the same data. Kaggle CSVs are static snapshots requiring manual download. yfinance also provides company metadata in the same call.

**Why no ORM?** An ORM would abstract away the SQL, defeating the purpose of a DBMS course project. `mssql` is used directly so stored procedure calls are explicit.

**Why Gemini over OpenAI?** Gemini's free tier (`gemini-1.5-flash`) is sufficient for the task (explain query results in plain English) and requires no paid credits for academic use.

**Why no real-time data?** Real-time feeds require paid subscriptions. The analytical value is in historical patterns. A static 10-year dataset also makes query results deterministic and reproducible during demos.

---

## Project Info

- **Course:** CSL-220 — Database Management Systems
- **Institution:** Bahria University, Karachi
- **Year:** 2026
- **Version:** 1.0
