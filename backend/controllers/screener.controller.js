const { sql, executeProc, executeQuery } = require('../services/db.service');
const { sendSuccess } = require('../utils/formatResponse');

async function runScreener(req, res, next) {
  try {
    const {
      sector,
      start,
      end,
      startDate,
      endDate,
      minVolume,
      minPrice,
      maxPrice,
      minGrowthPct,
    } = req.validatedQuery;

    const results = await executeProc('sp_ScreenerFilter', [
      { name: 'Sector', type: sql.VarChar(100), value: sector },
      { name: 'StartDate', type: sql.Date, value: startDate },
      { name: 'EndDate', type: sql.Date, value: endDate },
      { name: 'MinVolume', type: sql.BigInt, value: minVolume },
      { name: 'MinPrice', type: sql.Decimal(10, 4), value: minPrice },
      { name: 'MaxPrice', type: sql.Decimal(10, 4), value: maxPrice },
      { name: 'MinGrowthPct', type: sql.Float, value: minGrowthPct },
    ]);

    return sendSuccess(res, 'Screener results loaded', {
      filters: {
        sector,
        start,
        end,
        minVolume,
        minPrice,
        maxPrice,
        minGrowthPct,
      },
      results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSectorVolatility(req, res, next) {
  try {
    const { sector, startDate, endDate } = req.validatedQuery;
    const results = await executeProc('sp_GetSectorVolatility', [
      { name: 'Sector', type: sql.VarChar(100), value: sector },
      { name: 'StartDate', type: sql.Date, value: startDate },
      { name: 'EndDate', type: sql.Date, value: endDate },
    ]);

    return sendSuccess(res, 'Sector volatility loaded', {
      sector: sector || 'all',
      results,
    });
  } catch (error) {
    return next(error);
  }
}

async function listSectors(req, res, next) {
  try {
    const sectors = await executeQuery(`
      SELECT sector_id, sector_name
      FROM dbo.Sectors
      ORDER BY sector_name;
    `);

    return sendSuccess(res, 'Sectors loaded', {
      sectors,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  runScreener,
  getSectorVolatility,
  listSectors,
};
