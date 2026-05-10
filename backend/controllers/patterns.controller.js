const { sql, executeProc } = require('../services/db.service');
const { sendSuccess } = require('../utils/formatResponse');

function patternMessage(results) {
  return results.length
    ? 'Pattern search completed'
    : 'No stocks matched this pattern in the selected lookback period';
}

async function getGreenDays(req, res, next) {
  try {
    const { minDays, lookbackDays } = req.validatedQuery;
    const results = await executeProc('sp_FindConsecutiveGreenDays', [
      { name: 'MinDays', type: sql.Int, value: minDays },
      { name: 'LookbackDays', type: sql.Int, value: lookbackDays },
    ]);

    return sendSuccess(res, patternMessage(results), {
      pattern: 'consecutive-green-days',
      results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
}

async function getVolumeSpike(req, res, next) {
  try {
    const { multiplier, lookbackDays } = req.validatedQuery;
    const results = await executeProc('sp_FindVolumeSpikeStocks', [
      { name: 'Multiplier', type: sql.Float, value: multiplier },
      { name: 'LookbackDays', type: sql.Int, value: lookbackDays },
    ]);

    return sendSuccess(res, patternMessage(results), {
      pattern: 'volume-spike',
      results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMACrossover(req, res, next) {
  try {
    const { shortMA, longMA, lookbackDays } = req.validatedQuery;
    const results = await executeProc('sp_FindMACrossover', [
      { name: 'ShortMA', type: sql.Int, value: shortMA },
      { name: 'LongMA', type: sql.Int, value: longMA },
      { name: 'LookbackDays', type: sql.Int, value: lookbackDays },
    ]);

    return sendSuccess(res, patternMessage(results), {
      pattern: 'ma-crossover',
      shortMA,
      longMA,
      results,
      count: results.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGreenDays,
  getVolumeSpike,
  getMACrossover,
};
