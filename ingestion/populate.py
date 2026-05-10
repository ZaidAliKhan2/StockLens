from __future__ import annotations

import math
import time
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

import numpy as np
import pandas as pd
import pyodbc
import yfinance as yf


# -----------------------------
# Database connection config
# -----------------------------
CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    r"SERVER=localhost\SQLEXPRESS;"
    "DATABASE=StockLensDB;"
    "Trusted_Connection=yes;"
)


# -----------------------------
# Data extraction config
# -----------------------------
START_DATE = date(2015, 1, 1)
END_DATE = date(2026, 5, 5)
YFINANCE_END_DATE_EXCLUSIVE = END_DATE + timedelta(days=1)

SECTORS = {
    "Communication Services": "Companies that provide communication, media, entertainment, and interactive services.",
    "Consumer Discretionary": "Companies offering non-essential consumer goods and services.",
    "Consumer Staples": "Companies offering essential consumer products and retail staples.",
    "Energy": "Companies involved in energy exploration, production, equipment, and services.",
    "Financials": "Banks, capital markets firms, insurers, and diversified financial services.",
    "Health Care": "Health care equipment, services, pharmaceuticals, biotechnology, and life sciences.",
    "Industrials": "Capital goods, transportation, aerospace, defense, and commercial services.",
    "Information Technology": "Software, hardware, semiconductors, technology services, and equipment.",
    "Materials": "Chemicals, metals, mining, paper, packaging, and construction materials.",
    "Real Estate": "Equity real estate investment trusts and real estate management companies.",
    "Utilities": "Electric, gas, water, renewable power, and multi-utility companies.",
}

# Exactly 30 tickers, trimmed from the requested universe while retaining all 11 GICS sectors.
STOCK_UNIVERSE = {
    "Information Technology": ["AAPL", "MSFT", "NVDA", "AMD"],
    "Health Care": ["JNJ", "PFE", "UNH"],
    "Financials": ["JPM", "BAC", "GS"],
    "Consumer Discretionary": ["AMZN", "TSLA", "NKE"],
    "Energy": ["XOM", "CVX", "COP"],
    "Industrials": ["CAT", "BA", "GE"],
    "Utilities": ["NEE", "DUK"],
    "Communication Services": ["GOOGL", "META", "NFLX"],
    "Materials": ["LIN", "NEM"],
    "Real Estate": ["AMT", "PLD"],
    "Consumer Staples": ["PG", "KO"],
}

MARKET_INDEXES = {
    "^GSPC": "SP500",
    "^IXIC": "NASDAQ",
}


def connect() -> pyodbc.Connection:
    return pyodbc.connect(CONNECTION_STRING)


def all_stock_tickers() -> list[str]:
    return [ticker for tickers in STOCK_UNIVERSE.values() for ticker in tickers]


def clean_text(value: Any, fallback: str, max_length: int) -> str:
    if value is None:
        return fallback[:max_length]
    text = str(value).strip()
    if not text:
        return fallback[:max_length]
    return text[:max_length]


def clean_market_cap(value: Any) -> int | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return None


def clean_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, pd.Series):
        value = value.iloc[0] if not value.empty else None
    try:
        if pd.isna(value):
            return None
        if isinstance(value, (float, np.floating)) and (math.isnan(float(value)) or math.isinf(float(value))):
            return None
        return Decimal(str(float(value))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError, OverflowError):
        return None


def clean_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, pd.Series):
        value = value.iloc[0] if not value.empty else None
    try:
        if pd.isna(value):
            return None
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return None


def normalize_history_frame(data: pd.DataFrame, ticker: str) -> pd.DataFrame:
    if data.empty:
        return data

    if isinstance(data.columns, pd.MultiIndex):
        for level in range(data.columns.nlevels):
            if ticker in data.columns.get_level_values(level):
                return data.xs(ticker, axis=1, level=level)
        data = data.copy()
        data.columns = data.columns.get_level_values(0)

    return data


def seed_sectors(cursor: pyodbc.Cursor) -> None:
    for sector_name, description in SECTORS.items():
        cursor.execute(
            """
            INSERT INTO dbo.Sectors (sector_name, description)
            SELECT ?, ?
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.Sectors WHERE sector_name = ?
            );
            """,
            sector_name,
            description,
            sector_name,
        )


def get_sector_ids(cursor: pyodbc.Cursor) -> dict[str, int]:
    cursor.execute("SELECT sector_name, sector_id FROM dbo.Sectors;")
    return {row.sector_name: int(row.sector_id) for row in cursor.fetchall()}


def fetch_company_info(ticker: str) -> tuple[str, str, int | None, bool]:
    try:
        info = yf.Ticker(ticker).info or {}
        company_name = clean_text(info.get("longName") or info.get("shortName"), ticker, 150)
        exchange = clean_text(info.get("exchange"), "NYSE", 20)
        market_cap = clean_market_cap(info.get("marketCap"))
        return company_name, exchange, market_cap, True
    except Exception as exc:
        print(f"[WARN] Company info failed for {ticker}: {exc}")
        return ticker, "NYSE", None, False


def upsert_company(
    cursor: pyodbc.Cursor,
    ticker: str,
    company_name: str,
    sector_id: int,
    exchange: str,
    market_cap: int | None,
) -> None:
    cursor.execute(
        """
        MERGE dbo.Companies WITH (HOLDLOCK) AS target
        USING (
            SELECT
                CAST(? AS VARCHAR(10)) AS ticker,
                CAST(? AS VARCHAR(150)) AS company_name,
                CAST(? AS INT) AS sector_id,
                CAST(? AS VARCHAR(20)) AS exchange,
                CAST(? AS BIGINT) AS market_cap
        ) AS source
        ON target.ticker = source.ticker
        WHEN MATCHED THEN
            UPDATE SET
                company_name = source.company_name,
                sector_id = source.sector_id,
                exchange = source.exchange,
                market_cap = source.market_cap
        WHEN NOT MATCHED THEN
            INSERT (ticker, company_name, sector_id, exchange, market_cap)
            VALUES (source.ticker, source.company_name, source.sector_id, source.exchange, source.market_cap);
        """,
        ticker,
        company_name,
        sector_id,
        exchange,
        market_cap,
    )


def seed_companies(cursor: pyodbc.Cursor, sector_ids: dict[str, int]) -> list[str]:
    info_failures: list[str] = []

    for sector_name, tickers in STOCK_UNIVERSE.items():
        sector_id = sector_ids[sector_name]
        for ticker in tickers:
            company_name, exchange, market_cap, succeeded = fetch_company_info(ticker)
            if not succeeded:
                info_failures.append(ticker)
            upsert_company(cursor, ticker, company_name, sector_id, exchange, market_cap)
            print(f"[INFO] Seeded company {ticker}")

    return info_failures


def download_history(ticker: str) -> pd.DataFrame:
    data = yf.download(
        ticker,
        start=START_DATE.isoformat(),
        end=YFINANCE_END_DATE_EXCLUSIVE.isoformat(),
        auto_adjust=False,
        actions=False,
        progress=False,
        threads=False,
    )
    return normalize_history_frame(data, ticker)


def insert_stock_prices(cursor: pyodbc.Cursor, ticker: str, data: pd.DataFrame) -> tuple[int, int]:
    inserted_rows = 0
    source_rows = 0

    for raw_date, row in data.iterrows():
        close_value = clean_decimal(row.get("Close"))
        if close_value is None:
            continue

        price_date = pd.Timestamp(raw_date).date()
        open_value = clean_decimal(row.get("Open"))
        high_value = clean_decimal(row.get("High"))
        low_value = clean_decimal(row.get("Low"))
        volume = clean_int(row.get("Volume"))
        source_rows += 1

        cursor.execute(
            """
            INSERT INTO dbo.StockPrices (ticker, [date], [open], high, low, [close], volume)
            SELECT ?, ?, ?, ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.StockPrices
                WHERE ticker = ?
                  AND [date] = ?
            );
            """,
            ticker,
            price_date,
            open_value,
            high_value,
            low_value,
            close_value,
            volume,
            ticker,
            price_date,
        )
        if cursor.rowcount and cursor.rowcount > 0:
            inserted_rows += cursor.rowcount

    return inserted_rows, source_rows


def insert_market_index(cursor: pyodbc.Cursor, index_name: str, data: pd.DataFrame) -> tuple[int, int]:
    inserted_rows = 0
    source_rows = 0

    for raw_date, row in data.iterrows():
        close_value = clean_decimal(row.get("Close"))
        if close_value is None:
            continue

        index_date = pd.Timestamp(raw_date).date()
        source_rows += 1
        cursor.execute(
            """
            INSERT INTO dbo.MarketIndex (index_name, [date], close_value)
            SELECT ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.MarketIndex
                WHERE index_name = ?
                  AND [date] = ?
            );
            """,
            index_name,
            index_date,
            close_value,
            index_name,
            index_date,
        )
        if cursor.rowcount and cursor.rowcount > 0:
            inserted_rows += cursor.rowcount

    return inserted_rows, source_rows


def populate_stock_prices(cursor: pyodbc.Cursor, connection: pyodbc.Connection) -> tuple[int, list[str]]:
    total_inserted = 0
    zero_row_tickers: list[str] = []

    for ticker in all_stock_tickers():
        try:
            print(f"[INFO] Downloading prices for {ticker}")
            data = download_history(ticker)
            if data.empty:
                zero_row_tickers.append(ticker)
                print(f"[WARN] No price data returned for {ticker}")
                continue

            inserted_rows, source_rows = insert_stock_prices(cursor, ticker, data)
            connection.commit()
            total_inserted += inserted_rows

            if source_rows == 0:
                zero_row_tickers.append(ticker)
                print(f"[WARN] No usable price rows returned for {ticker}")
            else:
                print(f"[INFO] {ticker}: inserted {inserted_rows} of {source_rows} usable rows")
        except Exception as exc:
            zero_row_tickers.append(ticker)
            connection.rollback()
            print(f"[WARN] Price load failed for {ticker}: {exc}")

    return total_inserted, zero_row_tickers


def populate_market_indexes(cursor: pyodbc.Cursor, connection: pyodbc.Connection) -> tuple[int, list[str]]:
    total_inserted = 0
    failed_indexes: list[str] = []

    for ticker, index_name in MARKET_INDEXES.items():
        try:
            print(f"[INFO] Downloading market index {index_name} ({ticker})")
            data = download_history(ticker)
            if data.empty:
                failed_indexes.append(index_name)
                print(f"[WARN] No market index data returned for {index_name}")
                continue

            inserted_rows, source_rows = insert_market_index(cursor, index_name, data)
            connection.commit()
            total_inserted += inserted_rows

            if source_rows == 0:
                failed_indexes.append(index_name)
                print(f"[WARN] No usable market index rows returned for {index_name}")
            else:
                print(f"[INFO] {index_name}: inserted {inserted_rows} of {source_rows} usable rows")
        except Exception as exc:
            failed_indexes.append(index_name)
            connection.rollback()
            print(f"[WARN] Market index load failed for {index_name}: {exc}")

    return total_inserted, failed_indexes


def main() -> None:
    started_at = time.perf_counter()
    company_info_failures: list[str] = []
    price_failures_or_zero_rows: list[str] = []
    index_failures_or_zero_rows: list[str] = []
    stock_rows_inserted = 0
    market_index_rows_inserted = 0

    with connect() as connection:
        cursor = connection.cursor()
        cursor.fast_executemany = False

        print("[INFO] Seeding sectors")
        seed_sectors(cursor)
        connection.commit()

        sector_ids = get_sector_ids(cursor)
        missing_sectors = sorted(set(STOCK_UNIVERSE) - set(sector_ids))
        if missing_sectors:
            raise RuntimeError(f"Missing sector IDs after seeding: {', '.join(missing_sectors)}")

        print("[INFO] Seeding companies")
        company_info_failures = seed_companies(cursor, sector_ids)
        connection.commit()

        stock_rows_inserted, price_failures_or_zero_rows = populate_stock_prices(cursor, connection)
        market_index_rows_inserted, index_failures_or_zero_rows = populate_market_indexes(cursor, connection)

    elapsed_seconds = time.perf_counter() - started_at

    print("\nStockLens data population summary")
    print("---------------------------------")
    print(f"Total rows inserted into StockPrices: {stock_rows_inserted}")
    print(f"Total rows inserted into MarketIndex: {market_index_rows_inserted}")
    print(f"Tickers with failed company info fetch: {company_info_failures or 'None'}")
    print(f"Tickers that failed or returned 0 price rows: {price_failures_or_zero_rows or 'None'}")
    print(f"Market indexes that failed or returned 0 rows: {index_failures_or_zero_rows or 'None'}")
    print(f"Time taken to complete: {elapsed_seconds:.2f} seconds")


if __name__ == "__main__":
    main()
