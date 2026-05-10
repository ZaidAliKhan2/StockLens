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
