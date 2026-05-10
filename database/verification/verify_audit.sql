USE StockLensDB;
GO

BEGIN TRAN;

DECLARE @Ticker VARCHAR(10);
DECLARE @TestLogIds TABLE (log_id INT);

SELECT TOP (1) @Ticker = ticker
FROM dbo.Companies
ORDER BY ticker;

IF @Ticker IS NULL
BEGIN
    SELECT 'No Companies rows found. Run populate.py before verify_audit.sql.' AS message;
    ROLLBACK TRAN;
    RETURN;
END;

UPDATE dbo.Companies
SET exchange = LEFT(COALESCE(exchange, 'NYSE') + '_T', 20)
WHERE ticker = @Ticker;

SELECT TOP (10)
    log_id,
    table_name,
    operation,
    affected_ticker,
    old_data,
    new_data,
    changed_at,
    changed_by
FROM dbo.AuditLog
WHERE table_name = 'Companies'
  AND operation = 'UPDATE'
  AND affected_ticker = @Ticker
ORDER BY log_id DESC;

INSERT INTO dbo.PatternLog (ticker, pattern_type, detected_date, streak_length)
OUTPUT inserted.log_id INTO @TestLogIds
VALUES (@Ticker, 'AUDIT_VERIFY_TEST', CAST(GETDATE() AS DATE), 1);

SELECT TOP (10)
    log_id,
    table_name,
    operation,
    affected_ticker,
    old_data,
    new_data,
    changed_at,
    changed_by
FROM dbo.AuditLog
WHERE table_name = 'PatternLog'
  AND operation = 'INSERT'
  AND affected_ticker = @Ticker
ORDER BY log_id DESC;

DELETE pl
FROM dbo.PatternLog pl
JOIN @TestLogIds ids
    ON pl.log_id = ids.log_id;

SELECT TOP (10)
    log_id,
    table_name,
    operation,
    affected_ticker,
    old_data,
    new_data,
    changed_at,
    changed_by
FROM dbo.AuditLog
WHERE table_name = 'PatternLog'
  AND operation = 'DELETE'
  AND affected_ticker = @Ticker
ORDER BY log_id DESC;

SELECT table_name, operation, COUNT(*) AS event_count
FROM dbo.AuditLog
GROUP BY table_name, operation
ORDER BY table_name, operation;

ROLLBACK TRAN;
GO
