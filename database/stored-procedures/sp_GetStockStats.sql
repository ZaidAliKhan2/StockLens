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
