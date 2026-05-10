USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_ScreenerFilter
    @Sector VARCHAR(100) = NULL,
    @StartDate DATE,
    @EndDate DATE,
    @MinVolume BIGINT,
    @MinPrice DECIMAL(10,4),
    @MaxPrice DECIMAL(10,4),
    @MinGrowthPct FLOAT
AS
BEGIN
    SET NOCOUNT ON;

    WITH PriceRows AS (
        SELECT
            sp.ticker,
            sp.[date],
            sp.[close],
            sp.volume,
            ROW_NUMBER() OVER (PARTITION BY sp.ticker ORDER BY sp.[date]) AS rn_asc,
            ROW_NUMBER() OVER (PARTITION BY sp.ticker ORDER BY sp.[date] DESC) AS rn_desc
        FROM dbo.StockPrices sp
        WHERE sp.[date] BETWEEN @StartDate AND @EndDate
    ),
    Aggregates AS (
        SELECT
            ticker,
            CAST(AVG(CAST([close] AS FLOAT)) AS DECIMAL(10,2)) AS avg_close,
            CAST(AVG(CAST(volume AS FLOAT)) AS BIGINT) AS avg_volume,
            CAST(STDEV(CAST([close] AS FLOAT)) AS DECIMAL(10,2)) AS volatility
        FROM PriceRows
        GROUP BY ticker
    ),
    FirstLast AS (
        SELECT
            ticker,
            MAX(CASE WHEN rn_asc = 1 THEN [close] END) AS first_close,
            MAX(CASE WHEN rn_desc = 1 THEN [close] END) AS last_close
        FROM PriceRows
        GROUP BY ticker
    ),
    Screened AS (
        SELECT
            c.ticker,
            c.company_name,
            s.sector_name,
            a.avg_close,
            a.avg_volume,
            a.volatility,
            CAST(((fl.last_close - fl.first_close) / NULLIF(fl.first_close, 0)) * 100 AS DECIMAL(10,2)) AS growth_pct
        FROM Aggregates a
        INNER JOIN FirstLast fl ON fl.ticker = a.ticker
        INNER JOIN dbo.Companies c ON c.ticker = a.ticker
        INNER JOIN dbo.Sectors s ON s.sector_id = c.sector_id
        WHERE (@Sector IS NULL OR s.sector_name = @Sector)
          AND a.avg_volume >= @MinVolume
          AND a.avg_close >= @MinPrice
          AND a.avg_close <= @MaxPrice
          AND ((fl.last_close - fl.first_close) / NULLIF(fl.first_close, 0)) * 100 >= @MinGrowthPct
    )
    SELECT
        ticker,
        company_name,
        sector_name,
        avg_close,
        avg_volume,
        volatility,
        growth_pct,
        RANK() OVER (PARTITION BY sector_name ORDER BY volatility DESC) AS rank_in_sector,
        RANK() OVER (ORDER BY volatility DESC) AS rank_overall
    FROM Screened
    ORDER BY rank_overall ASC, ticker;
END;
GO

