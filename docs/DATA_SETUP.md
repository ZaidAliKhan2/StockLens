# StockLens Data Setup

This guide creates the SQL Server database objects and loads real historical market data from Yahoo Finance through `yfinance`.

## 1. Create the database manually

Open SQL Server Management Studio (SSMS), connect to your local SQL Server Express instance, and run:

```sql
CREATE DATABASE StockLensDB;
GO
```

The Python loader expects this SQL Server Express connection:

```text
SERVER=localhost\SQLEXPRESS
DATABASE=StockLensDB
Trusted_Connection=yes
```

## 2. Install Python dependencies

From the project directory, run:

```powershell
pip install -r requirements.txt
```

Make sure the Microsoft ODBC Driver 17 for SQL Server is installed on the machine. The script uses this driver through `pyodbc`.

## 3. Run the schema first

Run `schema.sql` before loading data.

In SSMS:

1. Open `schema.sql`.
2. Confirm it starts with `USE StockLensDB;`.
3. Execute the script.

Or run it with `sqlcmd`:

```powershell
sqlcmd -S localhost\SQLEXPRESS -d StockLensDB -E -i schema.sql
```

The schema script uses `IF NOT EXISTS` guards, so it can be run more than once safely.

## 4. Run the data population script

From the project directory, run:

```powershell
python populate.py
```

The script will:

- Seed all 11 GICS sectors.
- Fetch company metadata for the 30-ticker StockLens universe.
- Download historical OHLCV data from 2015-01-01 through 2026-05-05.
- Insert stock prices and market index rows with parameterized SQL.
- Leave `PatternLog` empty for the application layer to populate later.
- Print a summary report when finished.

## 5. Verify the data load

Run these queries after `populate.py` finishes:

```sql
SELECT COUNT(*) FROM StockPrices;

SELECT ticker, COUNT(*) as rows
FROM StockPrices
GROUP BY ticker
ORDER BY rows DESC;

SELECT COUNT(*) FROM MarketIndex;

SELECT COUNT(DISTINCT ticker) FROM Companies;
```

Expected results are roughly 85,000 to 90,000 rows in `StockPrices`, depending on ticker-specific trading history and yfinance availability.
