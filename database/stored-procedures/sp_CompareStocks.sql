USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CompareStocks
    @Ticker1 VARCHAR(10),
    @Ticker2 VARCHAR(10),
    @Ticker3 VARCHAR(10) = NULL,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH Requested AS (
        SELECT UPPER(LTRIM(RTRIM(@Ticker1))) AS ticker
        UNION ALL SELECT UPPER(LTRIM(RTRIM(@Ticker2)))
        UNION ALL SELECT UPPER(LTRIM(RTRIM(@Ticker3))) WHERE @Ticker3 IS NOT NULL AND LTRIM(RTRIM(@Ticker3)) <> ''
    ),
    Series AS (
        SELECT r.ticker, sp.[date] AS trade_date, CAST(sp.[close] AS FLOAT) AS close_price
        FROM Requested r
        INNER JOIN dbo.StockPrices sp ON sp.ticker = r.ticker
        WHERE r.ticker NOT IN ('SPY', 'SP500', '^GSPC')
          AND sp.[date] BETWEEN @StartDate AND @EndDate
        UNION ALL
        SELECT r.ticker, mi.[date] AS trade_date, CAST(mi.close_value AS FLOAT) AS close_price
        FROM Requested r
        INNER JOIN dbo.MarketIndex mi ON mi.index_name = 'SP500'
        WHERE r.ticker IN ('SPY', 'SP500', '^GSPC')
          AND mi.[date] BETWEEN @StartDate AND @EndDate
    ),
    Normalized AS (
        SELECT
            ticker,
            trade_date,
            close_price,
            FIRST_VALUE(close_price) OVER (PARTITION BY ticker ORDER BY trade_date) AS first_close
        FROM Series
    )
    SELECT
        ticker,
        trade_date,
        CAST(close_price AS DECIMAL(10,2)) AS close_price,
        CAST(((close_price - first_close) / NULLIF(first_close, 0)) * 100 AS DECIMAL(10,4)) AS pct_growth
    FROM Normalized
    ORDER BY ticker, trade_date;
END;
GO

