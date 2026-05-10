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
