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
