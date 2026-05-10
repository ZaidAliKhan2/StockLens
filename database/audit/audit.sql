USE StockLensDB;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'AuditLog'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.AuditLog (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        operation VARCHAR(10) NOT NULL,
        affected_ticker VARCHAR(10),
        old_data NVARCHAR(MAX),
        new_data NVARCHAR(MAX),
        changed_at DATETIME DEFAULT GETDATE(),
        changed_by VARCHAR(100) DEFAULT SYSTEM_USER
    );
END;
GO

IF OBJECT_ID('dbo.trg_Companies_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Companies_Insert;
GO

CREATE TRIGGER dbo.trg_Companies_Insert
ON dbo.Companies
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Companies_Insert;

    BEGIN TRY
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Companies',
                'INSERT',
                @ticker,
                NULL,
                (
                    SELECT i.ticker, i.company_name, i.sector_id, i.exchange, i.market_cap
                    FROM inserted i
                    WHERE i.ticker = @ticker
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Companies_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Companies_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Companies_Update;
GO

CREATE TRIGGER dbo.trg_Companies_Update
ON dbo.Companies
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Companies_Update;

    BEGIN TRY
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Companies',
                'UPDATE',
                @ticker,
                (
                    SELECT d.ticker, d.company_name, d.sector_id, d.exchange, d.market_cap
                    FROM deleted d
                    WHERE d.ticker = @ticker
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.ticker, i.company_name, i.sector_id, i.exchange, i.market_cap
                    FROM inserted i
                    WHERE i.ticker = @ticker
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Companies_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Companies_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Companies_Delete;
GO

CREATE TRIGGER dbo.trg_Companies_Delete
ON dbo.Companies
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Companies_Delete;

    BEGIN TRY
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT ticker FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Companies',
                'DELETE',
                @ticker,
                (
                    SELECT d.ticker, d.company_name, d.sector_id, d.exchange, d.market_cap
                    FROM deleted d
                    WHERE d.ticker = @ticker
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Companies_Delete;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Sectors_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Sectors_Insert;
GO

CREATE TRIGGER dbo.trg_Sectors_Insert
ON dbo.Sectors
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Sectors_Insert;

    BEGIN TRY
        DECLARE @sector_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT sector_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @sector_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Sectors',
                'INSERT',
                NULL,
                NULL,
                (
                    SELECT i.sector_id, i.sector_name, i.description
                    FROM inserted i
                    WHERE i.sector_id = @sector_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @sector_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Sectors_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Sectors_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Sectors_Update;
GO

CREATE TRIGGER dbo.trg_Sectors_Update
ON dbo.Sectors
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Sectors_Update;

    BEGIN TRY
        DECLARE @sector_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT sector_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @sector_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Sectors',
                'UPDATE',
                NULL,
                (
                    SELECT d.sector_id, d.sector_name, d.description
                    FROM deleted d
                    WHERE d.sector_id = @sector_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.sector_id, i.sector_name, i.description
                    FROM inserted i
                    WHERE i.sector_id = @sector_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @sector_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Sectors_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Sectors_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Sectors_Delete;
GO

CREATE TRIGGER dbo.trg_Sectors_Delete
ON dbo.Sectors
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Sectors_Delete;

    BEGIN TRY
        DECLARE @sector_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT sector_id FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @sector_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Sectors',
                'DELETE',
                NULL,
                (
                    SELECT d.sector_id, d.sector_name, d.description
                    FROM deleted d
                    WHERE d.sector_id = @sector_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @sector_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_Sectors_Delete;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_StockPrices_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_StockPrices_Insert;
GO

CREATE TRIGGER dbo.trg_StockPrices_Insert
ON dbo.StockPrices
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_StockPrices_Insert;

    BEGIN TRY
        DECLARE @price_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT price_id, ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'StockPrices',
                'INSERT',
                @ticker,
                NULL,
                (
                    SELECT i.price_id, i.ticker, i.[date], i.[open], i.high, i.low, i.[close], i.volume
                    FROM inserted i
                    WHERE i.price_id = @price_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_StockPrices_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_StockPrices_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_StockPrices_Update;
GO

CREATE TRIGGER dbo.trg_StockPrices_Update
ON dbo.StockPrices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_StockPrices_Update;

    BEGIN TRY
        DECLARE @price_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT price_id, ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'StockPrices',
                'UPDATE',
                @ticker,
                (
                    SELECT d.price_id, d.ticker, d.[date], d.[open], d.high, d.low, d.[close], d.volume
                    FROM deleted d
                    WHERE d.price_id = @price_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.price_id, i.ticker, i.[date], i.[open], i.high, i.low, i.[close], i.volume
                    FROM inserted i
                    WHERE i.price_id = @price_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_StockPrices_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_StockPrices_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_StockPrices_Delete;
GO

CREATE TRIGGER dbo.trg_StockPrices_Delete
ON dbo.StockPrices
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_StockPrices_Delete;

    BEGIN TRY
        DECLARE @price_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT price_id, ticker FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'StockPrices',
                'DELETE',
                @ticker,
                (
                    SELECT d.price_id, d.ticker, d.[date], d.[open], d.high, d.low, d.[close], d.volume
                    FROM deleted d
                    WHERE d.price_id = @price_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @price_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_StockPrices_Delete;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_MarketIndex_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_MarketIndex_Insert;
GO

CREATE TRIGGER dbo.trg_MarketIndex_Insert
ON dbo.MarketIndex
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_MarketIndex_Insert;

    BEGIN TRY
        DECLARE @index_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT index_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @index_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'MarketIndex',
                'INSERT',
                NULL,
                NULL,
                (
                    SELECT i.index_id, i.index_name, i.[date], i.close_value
                    FROM inserted i
                    WHERE i.index_id = @index_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @index_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_MarketIndex_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_MarketIndex_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_MarketIndex_Update;
GO

CREATE TRIGGER dbo.trg_MarketIndex_Update
ON dbo.MarketIndex
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_MarketIndex_Update;

    BEGIN TRY
        DECLARE @index_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT index_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @index_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'MarketIndex',
                'UPDATE',
                NULL,
                (
                    SELECT d.index_id, d.index_name, d.[date], d.close_value
                    FROM deleted d
                    WHERE d.index_id = @index_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.index_id, i.index_name, i.[date], i.close_value
                    FROM inserted i
                    WHERE i.index_id = @index_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @index_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_MarketIndex_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_MarketIndex_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_MarketIndex_Delete;
GO

CREATE TRIGGER dbo.trg_MarketIndex_Delete
ON dbo.MarketIndex
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_MarketIndex_Delete;

    BEGIN TRY
        DECLARE @index_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT index_id FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @index_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'MarketIndex',
                'DELETE',
                NULL,
                (
                    SELECT d.index_id, d.index_name, d.[date], d.close_value
                    FROM deleted d
                    WHERE d.index_id = @index_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @index_id;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_MarketIndex_Delete;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_PatternLog_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_PatternLog_Insert;
GO

CREATE TRIGGER dbo.trg_PatternLog_Insert
ON dbo.PatternLog
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_PatternLog_Insert;

    BEGIN TRY
        DECLARE @log_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT log_id, ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'PatternLog',
                'INSERT',
                @ticker,
                NULL,
                (
                    SELECT i.log_id, i.ticker, i.pattern_type, i.detected_date, i.streak_length
                    FROM inserted i
                    WHERE i.log_id = @log_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_PatternLog_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_PatternLog_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_PatternLog_Update;
GO

CREATE TRIGGER dbo.trg_PatternLog_Update
ON dbo.PatternLog
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_PatternLog_Update;

    BEGIN TRY
        DECLARE @log_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT log_id, ticker FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'PatternLog',
                'UPDATE',
                @ticker,
                (
                    SELECT d.log_id, d.ticker, d.pattern_type, d.detected_date, d.streak_length
                    FROM deleted d
                    WHERE d.log_id = @log_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.log_id, i.ticker, i.pattern_type, i.detected_date, i.streak_length
                    FROM inserted i
                    WHERE i.log_id = @log_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_PatternLog_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_PatternLog_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_PatternLog_Delete;
GO

CREATE TRIGGER dbo.trg_PatternLog_Delete
ON dbo.PatternLog
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_PatternLog_Delete;

    BEGIN TRY
        DECLARE @log_id INT;
        DECLARE @ticker VARCHAR(10);

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT log_id, ticker FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'PatternLog',
                'DELETE',
                @ticker,
                (
                    SELECT d.log_id, d.ticker, d.pattern_type, d.detected_date, d.streak_length
                    FROM deleted d
                    WHERE d.log_id = @log_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @log_id, @ticker;
        END;

        CLOSE audit_cursor;
        DEALLOCATE audit_cursor;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('local', 'audit_cursor') > -1
            CLOSE audit_cursor;
        IF CURSOR_STATUS('local', 'audit_cursor') >= -1
            DEALLOCATE audit_cursor;
        IF XACT_STATE() = 1
            ROLLBACK TRANSACTION AuditLog_PatternLog_Delete;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.vw_RecentAuditActivity', 'V') IS NOT NULL
    DROP VIEW dbo.vw_RecentAuditActivity;
GO

CREATE VIEW dbo.vw_RecentAuditActivity
AS
    SELECT TOP (100)
        log_id,
        table_name,
        operation,
        affected_ticker,
        old_data,
        new_data,
        changed_at,
        changed_by
    FROM dbo.AuditLog
    ORDER BY changed_at DESC, log_id DESC;
GO
