const { sql, executeProc } = require('../services/db.service');
const { sendSuccess } = require('../utils/formatResponse');

function groupSeriesByTicker(rows) {
  const groups = new Map();

  rows.forEach((row) => {
    if (!groups.has(row.ticker)) {
      groups.set(row.ticker, []);
    }

    groups.get(row.ticker).push({
      date: row.trade_date,
      pct_growth: row.pct_growth,
    });
  });

  return Array.from(groups.entries()).map(([ticker, data]) => ({
    ticker,
    data,
  }));
}

async function compareStocks(req, res, next) {
  try {
    const { tickers, startDate, endDate, start, end } = req.validatedQuery;
    const rows = await executeProc('sp_CompareStocks', [
      { name: 'Ticker1', type: sql.VarChar(10), value: tickers[0] },
      { name: 'Ticker2', type: sql.VarChar(10), value: tickers[1] },
      { name: 'Ticker3', type: sql.VarChar(10), value: tickers[2] || null },
      { name: 'StartDate', type: sql.Date, value: startDate },
      { name: 'EndDate', type: sql.Date, value: endDate },
    ]);

    return sendSuccess(res, 'Stock comparison loaded', {
      tickers,
      dateRange: { start, end },
      series: groupSeriesByTicker(rows),
    });
  } catch (error) {
    return next(error);
  }
}

async function getCorrelation(req, res, next) {
  try {
    const { ticker1, ticker2, startDate, endDate } = req.validatedQuery;
    const rows = await executeProc('sp_GetCorrelation', [
      { name: 'Ticker1', type: sql.VarChar(10), value: ticker1 },
      { name: 'Ticker2', type: sql.VarChar(10), value: ticker2 },
      { name: 'StartDate', type: sql.Date, value: startDate },
      { name: 'EndDate', type: sql.Date, value: endDate },
    ]);

    const row = rows[0] || {};
    const coefficient = row.correlation_coefficient === undefined || row.correlation_coefficient === null
      ? null
      : Number(Number(row.correlation_coefficient).toFixed(4));

    return sendSuccess(res, 'Correlation loaded', {
      correlation: {
        ticker1: row.ticker1 || ticker1,
        ticker2: row.ticker2 || ticker2,
        coefficient,
        dataPoints: row.data_points || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  compareStocks,
  getCorrelation,
};
