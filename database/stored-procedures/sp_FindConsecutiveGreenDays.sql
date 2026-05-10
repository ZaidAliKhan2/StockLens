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
