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
