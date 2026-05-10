/* StockLens stored procedure installer - normal SSMS mode, no SQLCMD required. */

/* ===== sp_GetPriceHistory.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetPriceHistory
    @Ticker VARCHAR(10),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [date] AS trade_date,
        [open] AS open_price,
        high AS high_price,
        low AS low_price,
        [close] AS close_price,
        volume
    FROM dbo.StockPrices
    WHERE ticker = UPPER(LTRIM(RTRIM(@Ticker)))
      AND [date] >= @StartDate
      AND [date] <= @EndDate
    ORDER BY [date];
END;
GO


/* ===== sp_GetStockStats.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetStockStats
    @Ticker VARCHAR(10),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CleanTicker VARCHAR(10) = UPPER(LTRIM(RTRIM(@Ticker)));

    SELECT
        @CleanTicker AS ticker,
        MIN(CASE WHEN [date] BETWEEN @StartDate AND @EndDate THEN low END) AS period_low,
        MAX(CASE WHEN [date] BETWEEN @StartDate AND @EndDate THEN high END) AS period_high,
        CAST(AVG(CASE WHEN [date] BETWEEN @StartDate AND @EndDate THEN [close] END) AS DECIMAL(10,2)) AS avg_close,
        CAST(AVG(CASE WHEN [date] BETWEEN @StartDate AND @EndDate THEN CAST(volume AS FLOAT) END) AS BIGINT) AS avg_volume,
        CAST(STDEV(CASE WHEN [date] BETWEEN @StartDate AND @EndDate THEN [close] END) AS DECIMAL(10,2)) AS volatility,
        MAX(CASE WHEN [date] BETWEEN DATEADD(YEAR, -1, @EndDate) AND @EndDate THEN high END) AS week52_high,
        MIN(CASE WHEN [date] BETWEEN DATEADD(YEAR, -1, @EndDate) AND @EndDate THEN low END) AS week52_low
    FROM dbo.StockPrices
    WHERE ticker = @CleanTicker
      AND [date] BETWEEN
          CASE
              WHEN @StartDate < DATEADD(YEAR, -1, @EndDate) THEN @StartDate
              ELSE DATEADD(YEAR, -1, @EndDate)
          END
          AND @EndDate;
END;
GO


/* ===== sp_GetMovingAverages.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetMovingAverages
    @Ticker VARCHAR(10),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH PriceWindow AS (
        SELECT
            [date],
            [close],
            AVG([close]) OVER (
                ORDER BY [date]
                ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
            ) AS ma_20,
            AVG([close]) OVER (
                ORDER BY [date]
                ROWS BETWEEN 49 PRECEDING AND CURRENT ROW
            ) AS ma_50
        FROM dbo.StockPrices
        WHERE ticker = UPPER(LTRIM(RTRIM(@Ticker)))
          AND [date] >= DATEADD(DAY, -80, @StartDate)
          AND [date] <= @EndDate
    )
    SELECT
        [date] AS trade_date,
        [close] AS close_price,
        CAST(ma_20 AS DECIMAL(10,2)) AS ma_20,
        CAST(ma_50 AS DECIMAL(10,2)) AS ma_50
    FROM PriceWindow
    WHERE [date] >= @StartDate
      AND [date] <= @EndDate
    ORDER BY [date];
END;
GO


/* ===== sp_GetBestWorstMonth.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetBestWorstMonth
    @Ticker VARCHAR(10),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH MonthlyRanges AS (
        SELECT
            CONVERT(CHAR(7), [date], 120) AS [month],
            MIN(low) AS month_low,
            MAX(high) AS month_high,
            CAST(
                CASE
                    WHEN MIN(low) IS NULL OR MIN(low) = 0 THEN NULL
                    ELSE ((MAX(high) - MIN(low)) / MIN(low)) * 100
                END
                AS DECIMAL(10,2)
            ) AS month_range_pct
        FROM dbo.StockPrices
        WHERE ticker = UPPER(LTRIM(RTRIM(@Ticker)))
          AND [date] >= @StartDate
          AND [date] <= @EndDate
        GROUP BY CONVERT(CHAR(7), [date], 120)
    )
    SELECT
        [month],
        month_low,
        month_high,
        month_range_pct
    FROM MonthlyRanges
    ORDER BY month_range_pct DESC;
END;
GO


/* ===== sp_FindConsecutiveGreenDays.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FindConsecutiveGreenDays
    @MinDays INT,
    @LookbackDays INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndDate DATE = (SELECT MAX([date]) FROM dbo.StockPrices);
    DECLARE @StartDate DATE = DATEADD(DAY, -@LookbackDays, @EndDate);

    WITH PriceRows AS (
        SELECT
            sp.ticker,
            sp.[date],
            sp.[close],
            LAG(sp.[close]) OVER (PARTITION BY sp.ticker ORDER BY sp.[date]) AS prev_close
        FROM dbo.StockPrices sp
        WHERE sp.[date] >= DATEADD(DAY, -1 * (@LookbackDays + 10), @EndDate)
          AND sp.[date] <= @EndDate
    ),
    Marked AS (
        SELECT
            ticker,
            [date],
            CASE WHEN [close] > prev_close THEN 1 ELSE 0 END AS is_green
        FROM PriceRows
    ),
    Grouped AS (
        SELECT
            ticker,
            [date],
            is_green,
            SUM(CASE WHEN is_green = 0 THEN 1 ELSE 0 END)
                OVER (PARTITION BY ticker ORDER BY [date]) AS streak_group
        FROM Marked
    ),
    Streaks AS (
        SELECT
            ticker,
            COUNT(*) AS streak_len,
            MAX([date]) AS streak_end
        FROM Grouped
        WHERE is_green = 1
          AND [date] >= @StartDate
        GROUP BY ticker, streak_group
        HAVING COUNT(*) >= @MinDays
    )
    SELECT
        s.ticker,
        c.company_name,
        s.streak_len,
        s.streak_end
    FROM Streaks s
    INNER JOIN dbo.Companies c ON c.ticker = s.ticker
    ORDER BY s.streak_len DESC, s.streak_end DESC, s.ticker;
END;
GO


/* ===== sp_FindVolumeSpikeStocks.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FindVolumeSpikeStocks
    @Multiplier FLOAT,
    @LookbackDays INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndDate DATE = (SELECT MAX([date]) FROM dbo.StockPrices);
    DECLARE @StartDate DATE = DATEADD(DAY, -@LookbackDays, @EndDate);

    WITH VolumeWindow AS (
        SELECT
            sp.ticker,
            sp.[date],
            sp.volume,
            AVG(CAST(sp.volume AS FLOAT)) OVER (
                PARTITION BY sp.ticker
                ORDER BY sp.[date]
                ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
            ) AS avg_vol_30d
        FROM dbo.StockPrices sp
        WHERE sp.[date] >= DATEADD(DAY, -1 * (@LookbackDays + 60), @EndDate)
          AND sp.[date] <= @EndDate
    )
    SELECT
        vw.ticker,
        c.company_name,
        vw.[date] AS trade_date,
        vw.volume,
        CAST(vw.avg_vol_30d AS BIGINT) AS avg_vol_30d,
        CAST(vw.volume / NULLIF(vw.avg_vol_30d, 0) AS DECIMAL(10,2)) AS volume_ratio
    FROM VolumeWindow vw
    INNER JOIN dbo.Companies c ON c.ticker = vw.ticker
    WHERE vw.[date] >= @StartDate
      AND vw.avg_vol_30d IS NOT NULL
      AND vw.volume >= vw.avg_vol_30d * @Multiplier
    ORDER BY volume_ratio DESC, vw.[date] DESC;
END;
GO


/* ===== sp_FindMACrossover.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_FindMACrossover
    @ShortMA INT,
    @LongMA INT,
    @LookbackDays INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndDate DATE = (SELECT MAX([date]) FROM dbo.StockPrices);
    DECLARE @StartDate DATE = DATEADD(DAY, -@LookbackDays, @EndDate);

    WITH BaseRows AS (
        SELECT sp.ticker, sp.[date], sp.[close]
        FROM dbo.StockPrices sp
        WHERE sp.[date] >= DATEADD(DAY, -1 * (@LookbackDays + (@LongMA * 3)), @EndDate)
          AND sp.[date] <= @EndDate
    ),
    MovingAverages AS (
        SELECT
            b.ticker,
            b.[date],
            (
                SELECT AVG(CAST(x.[close] AS FLOAT))
                FROM (
                    SELECT TOP (@ShortMA) p.[close]
                    FROM dbo.StockPrices p
                    WHERE p.ticker = b.ticker
                      AND p.[date] <= b.[date]
                    ORDER BY p.[date] DESC
                ) x
            ) AS short_ma_val,
            (
                SELECT AVG(CAST(x.[close] AS FLOAT))
                FROM (
                    SELECT TOP (@LongMA) p.[close]
                    FROM dbo.StockPrices p
                    WHERE p.ticker = b.ticker
                      AND p.[date] <= b.[date]
                    ORDER BY p.[date] DESC
                ) x
            ) AS long_ma_val
        FROM BaseRows b
    ),
    WithPrevious AS (
        SELECT
            ticker,
            [date],
            short_ma_val,
            long_ma_val,
            LAG(short_ma_val) OVER (PARTITION BY ticker ORDER BY [date]) AS prev_short_ma,
            LAG(long_ma_val) OVER (PARTITION BY ticker ORDER BY [date]) AS prev_long_ma
        FROM MovingAverages
    )
    SELECT
        wp.ticker,
        c.company_name,
        wp.[date] AS crossover_date,
        CASE
            WHEN wp.prev_short_ma <= wp.prev_long_ma AND wp.short_ma_val > wp.long_ma_val THEN 'bullish'
            WHEN wp.prev_short_ma >= wp.prev_long_ma AND wp.short_ma_val < wp.long_ma_val THEN 'bearish'
        END AS crossover_type,
        CAST(wp.short_ma_val AS DECIMAL(10,2)) AS short_ma_val,
        CAST(wp.long_ma_val AS DECIMAL(10,2)) AS long_ma_val
    FROM WithPrevious wp
    INNER JOIN dbo.Companies c ON c.ticker = wp.ticker
    WHERE wp.[date] >= @StartDate
      AND wp.prev_short_ma IS NOT NULL
      AND wp.prev_long_ma IS NOT NULL
      AND (
          (wp.prev_short_ma <= wp.prev_long_ma AND wp.short_ma_val > wp.long_ma_val)
          OR
          (wp.prev_short_ma >= wp.prev_long_ma AND wp.short_ma_val < wp.long_ma_val)
      )
    ORDER BY wp.[date] DESC, wp.ticker;
END;
GO


/* ===== sp_CompareStocks.sql ===== */
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



/* ===== sp_GetCorrelation.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetCorrelation
    @Ticker1 VARCHAR(10),
    @Ticker2 VARCHAR(10),
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @T1 VARCHAR(10) = UPPER(LTRIM(RTRIM(@Ticker1)));
    DECLARE @T2 VARCHAR(10) = UPPER(LTRIM(RTRIM(@Ticker2)));

    WITH Requested AS (
        SELECT @T1 AS ticker
        UNION ALL SELECT @T2
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
    Pairs AS (
        SELECT
            a.trade_date,
            a.close_price AS x,
            b.close_price AS y
        FROM Series a
        INNER JOIN Series b ON b.trade_date = a.trade_date
        WHERE a.ticker = @T1
          AND b.ticker = @T2
    ),
    Agg AS (
        SELECT
            COUNT(*) AS n,
            SUM(x) AS sum_x,
            SUM(y) AS sum_y,
            SUM(x * y) AS sum_xy,
            SUM(x * x) AS sum_x2,
            SUM(y * y) AS sum_y2
        FROM Pairs
    )
    SELECT
        @T1 AS ticker1,
        @T2 AS ticker2,
        CAST(
            ((n * sum_xy) - (sum_x * sum_y))
            / NULLIF(SQRT(((n * sum_x2) - (sum_x * sum_x)) * ((n * sum_y2) - (sum_y * sum_y))), 0)
            AS FLOAT
        ) AS correlation_coefficient,
        n AS data_points
    FROM Agg;
END;
GO



/* ===== sp_ScreenerFilter.sql ===== */
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



/* ===== sp_GetSectorVolatility.sql ===== */
USE StockLensDB;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetSectorVolatility
    @Sector VARCHAR(100) = NULL,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    WITH Volatility AS (
        SELECT
            c.ticker,
            c.company_name,
            s.sector_name,
            CAST(STDEV(CAST(sp.[close] AS FLOAT)) AS DECIMAL(10,2)) AS volatility
        FROM dbo.StockPrices sp
        INNER JOIN dbo.Companies c ON c.ticker = sp.ticker
        INNER JOIN dbo.Sectors s ON s.sector_id = c.sector_id
        WHERE sp.[date] BETWEEN @StartDate AND @EndDate
          AND (@Sector IS NULL OR s.sector_name = @Sector)
        GROUP BY c.ticker, c.company_name, s.sector_name
    )
    SELECT
        ticker,
        company_name,
        sector_name,
        volatility,
        RANK() OVER (PARTITION BY sector_name ORDER BY volatility DESC) AS rank_in_sector,
        RANK() OVER (ORDER BY volatility DESC) AS rank_overall
    FROM Volatility
    ORDER BY rank_overall ASC, ticker;
END;
GO



USE StockLensDB;
GO

SELECT name AS procedure_name, create_date, modify_date
FROM sys.procedures
WHERE name IN (
    'sp_GetPriceHistory',
    'sp_GetStockStats',
    'sp_GetMovingAverages',
    'sp_GetBestWorstMonth',
    'sp_FindConsecutiveGreenDays',
    'sp_FindVolumeSpikeStocks',
    'sp_FindMACrossover',
    'sp_CompareStocks',
    'sp_GetCorrelation',
    'sp_ScreenerFilter',
    'sp_GetSectorVolatility'
)
ORDER BY name;
GO
