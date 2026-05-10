USE StockLensDB;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'Sectors'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Sectors (
        sector_id INT IDENTITY(1,1) PRIMARY KEY,
        sector_name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'Companies'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Companies (
        ticker VARCHAR(10) PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        sector_id INT NOT NULL,
        exchange VARCHAR(20),
        market_cap BIGINT,
        CONSTRAINT fk_companies_sectors
            FOREIGN KEY (sector_id) REFERENCES dbo.Sectors(sector_id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'StockPrices'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.StockPrices (
        price_id INT IDENTITY(1,1) PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL,
        [date] DATE NOT NULL,
        [open] DECIMAL(10,2),
        high DECIMAL(10,2),
        low DECIMAL(10,2),
        [close] DECIMAL(10,2),
        volume BIGINT,
        CONSTRAINT fk_stockprices_companies
            FOREIGN KEY (ticker) REFERENCES dbo.Companies(ticker),
        CONSTRAINT uq_ticker_date UNIQUE (ticker, [date])
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ix_stockprices_ticker_date'
      AND object_id = OBJECT_ID('dbo.StockPrices')
)
BEGIN
    CREATE INDEX ix_stockprices_ticker_date
        ON dbo.StockPrices (ticker, [date]);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'MarketIndex'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.MarketIndex (
        index_id INT IDENTITY(1,1) PRIMARY KEY,
        index_name VARCHAR(50) NOT NULL,
        [date] DATE NOT NULL,
        close_value DECIMAL(10,2),
        CONSTRAINT uq_index_date UNIQUE (index_name, [date])
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'PatternLog'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.PatternLog (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL,
        pattern_type VARCHAR(100) NOT NULL,
        detected_date DATE NOT NULL,
        streak_length INT,
        CONSTRAINT fk_patternlog_companies
            FOREIGN KEY (ticker) REFERENCES dbo.Companies(ticker)
    );
END;
GO
