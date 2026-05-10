const trustEnabled = String(process.env.DB_TRUSTED || '').toLowerCase() === 'true';
const sql = trustEnabled ? require('mssql/msnodesqlv8') : require('mssql');

const server = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const database = process.env.DB_NAME || 'StockLensDB';

const dbConfig = trustEnabled
  ? {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server};Database=${database};Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;`,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
  : {
    server,
    database,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }

  return poolPromise;
}

module.exports = {
  sql,
  getPool,
};
