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
