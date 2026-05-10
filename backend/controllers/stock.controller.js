const { sql, executeProc } = require('../services/db.service');
const { sendSuccess } = require('../utils/formatResponse');

function stockParams({ ticker, startDate, endDate }) {
  return [
    { name: 'Ticker', type: sql.VarChar(10), value: ticker },
    { name: 'StartDate', type: sql.Date, value: startDate },
    { name: 'EndDate', type: sql.Date, value: endDate },
  ];
}

async function getHistory(req, res, next) {
  try {
    const { ticker } = req.validatedQuery;
    const history = await executeProc('sp_GetPriceHistory', stockParams(req.validatedQuery));

    return sendSuccess(res, 'Price history loaded', {
      ticker,
      history,
    });
  } catch (error) {
    return next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const rows = await executeProc('sp_GetStockStats', stockParams(req.validatedQuery));
    const stats = rows[0] || null;

    return sendSuccess(res, 'Stock statistics loaded', {
      stats,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMovingAverages(req, res, next) {
  try {
    const { ticker } = req.validatedQuery;
    const movingAverages = await executeProc('sp_GetMovingAverages', stockParams(req.validatedQuery));

    return sendSuccess(res, 'Moving averages loaded', {
      ticker,
      movingAverages,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBestWorstMonth(req, res, next) {
  try {
    const result = await executeProc('sp_GetBestWorstMonth', stockParams(req.validatedQuery));
    const rows = Array.isArray(result[0]) ? result.flat() : result;
    const sorted = [...rows].sort((a, b) => Number(b.month_range_pct || 0) - Number(a.month_range_pct || 0));

    return sendSuccess(res, 'Best and worst month loaded', {
      best: sorted[0] || null,
      worst: sorted[sorted.length - 1] || null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getHistory,
  getStats,
  getMovingAverages,
  getBestWorstMonth,
};
