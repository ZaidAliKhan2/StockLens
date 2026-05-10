USE StockLensDB;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'Users'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        is_verified BIT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE name = 'OTPStore'
      AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.OTPStore (
        otp_id INT IDENTITY(1,1) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ix_otpstore_email'
      AND object_id = OBJECT_ID('dbo.OTPStore')
)
BEGIN
    CREATE INDEX ix_otpstore_email
        ON dbo.OTPStore (email);
END;
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

IF OBJECT_ID('dbo.trg_Users_Insert', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Users_Insert;
GO

CREATE TRIGGER dbo.trg_Users_Insert
ON dbo.Users
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Users_Insert;

    BEGIN TRY
        DECLARE @user_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT user_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @user_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Users',
                'INSERT',
                NULL,
                NULL,
                (
                    SELECT i.user_id, i.email, i.password_hash, i.full_name, i.role, i.is_verified, i.created_at, i.last_login
                    FROM inserted i
                    WHERE i.user_id = @user_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @user_id;
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
            ROLLBACK TRANSACTION AuditLog_Users_Insert;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Users_Update', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Users_Update;
GO

CREATE TRIGGER dbo.trg_Users_Update
ON dbo.Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Users_Update;

    BEGIN TRY
        DECLARE @user_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT user_id FROM inserted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @user_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Users',
                'UPDATE',
                NULL,
                (
                    SELECT d.user_id, d.email, d.password_hash, d.full_name, d.role, d.is_verified, d.created_at, d.last_login
                    FROM deleted d
                    WHERE d.user_id = @user_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                (
                    SELECT i.user_id, i.email, i.password_hash, i.full_name, i.role, i.is_verified, i.created_at, i.last_login
                    FROM inserted i
                    WHERE i.user_id = @user_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            );

            FETCH NEXT FROM audit_cursor INTO @user_id;
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
            ROLLBACK TRANSACTION AuditLog_Users_Update;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.trg_Users_Delete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_Users_Delete;
GO

CREATE TRIGGER dbo.trg_Users_Delete
ON dbo.Users
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    SAVE TRANSACTION AuditLog_Users_Delete;

    BEGIN TRY
        DECLARE @user_id INT;

        DECLARE audit_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT user_id FROM deleted;

        OPEN audit_cursor;
        FETCH NEXT FROM audit_cursor INTO @user_id;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO dbo.AuditLog (table_name, operation, affected_ticker, old_data, new_data)
            VALUES (
                'Users',
                'DELETE',
                NULL,
                (
                    SELECT d.user_id, d.email, d.password_hash, d.full_name, d.role, d.is_verified, d.created_at, d.last_login
                    FROM deleted d
                    WHERE d.user_id = @user_id
                    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                ),
                NULL
            );

            FETCH NEXT FROM audit_cursor INTO @user_id;
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
            ROLLBACK TRANSACTION AuditLog_Users_Delete;
    END CATCH;
END;
GO
