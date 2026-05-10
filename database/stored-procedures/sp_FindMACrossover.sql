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
