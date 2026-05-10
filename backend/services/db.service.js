const { sql, pool, poolConnect } = require('../config/db');

async function executeProc(procedureName, params = []) {
  const qualifiedProcedureName = procedureName.includes('.')
    ? procedureName
    : `dbo.${procedureName}`;

  try {
    await poolConnect;
    const request = pool.request();

    params.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });

    const result = await request.execute(qualifiedProcedureName);
    return result.recordsets && result.recordsets.length > 1
      ? result.recordsets
      : result.recordset || [];
  } catch (error) {
    console.error('[DB PROC ERROR]', qualifiedProcedureName);
    console.error('[DB PROC MESSAGE]', error.message);
    console.dir({
      code: error.code,
      number: error.number,
      state: error.state,
      class: error.class,
      serverName: error.serverName,
      procName: error.procName,
      lineNumber: error.lineNumber,
      originalError: error.originalError,
      precedingErrors: error.precedingErrors,
    }, { depth: 6 });

    throw new Error(`Database procedure failed: ${qualifiedProcedureName}`, { cause: error });
  }
}

async function executeQuery(queryString, params = []) {
  try {
    await poolConnect;
    const request = pool.request();

    params.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });

    const result = await request.query(queryString);
    return result.recordsets && result.recordsets.length > 1
      ? result.recordsets
      : result.recordset || [];
  } catch (error) {
    console.error('[DB QUERY ERROR]', error.message);
    if (error.originalError?.message) {
      console.error('[SQL SERVER]', error.originalError.message);
    }
    throw new Error('Database query failed', { cause: error });
  }
}

module.exports = {
  sql,
  executeProc,
  executeQuery,
};
