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

