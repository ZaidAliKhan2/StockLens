const { sendError } = require('../utils/formatResponse');

const tickerRegex = /^[A-Z.\-]{1,10}$/;

function normalizeTicker(value) {
  return String(value || '').trim().toUpperCase();
}

function isValidDateString(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function parseDate(value) {
  return new Date(value);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function parseInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseFloatValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateDateRange(start, end) {
  if (!isValidDateString(start) || !isValidDateString(end)) {
    return 'Valid start and end dates are required';
  }

  if (parseDate(end) <= parseDate(start)) {
    return 'End date must be after start date';
  }

  return null;
}

const validateStockQuery = [
  (req, res, next) => {
    const ticker = normalizeTicker(req.query.ticker);
    const { start, end } = req.query;

    if (!tickerRegex.test(ticker)) {
      return sendError(res, 'Ticker is required and must be 1-10 characters', 400);
    }

    const dateError = validateDateRange(start, end);
    if (dateError) {
      return sendError(res, dateError, 400);
    }

    req.validatedQuery = {
      ticker,
      startDate: parseDate(start),
      endDate: parseDate(end),
      start,
      end,
    };

    return next();
  },
];

const validatePatternQuery = [
  (req, res, next) => {
    const hasLookbackDays = req.query.lookbackDays !== undefined && req.query.lookbackDays !== '';
    const lookbackDays = hasLookbackDays ? parseInteger(req.query.lookbackDays) : 90;

    if (!isPositiveInteger(lookbackDays) || lookbackDays > 365) {
      return sendError(res, 'lookbackDays must be an integer between 1 and 365', 400);
    }

    req.validatedQuery = {
      ...(req.validatedQuery || {}),
      lookbackDays,
    };

    return next();
  },
];

const validateGreenDaysQuery = [
  ...validatePatternQuery,
  (req, res, next) => {
    const minDays = parseInteger(req.query.minDays);

    if (!isPositiveInteger(minDays) || minDays < 2 || minDays > 30) {
      return sendError(res, 'minDays must be an integer between 2 and 30', 400);
    }

    req.validatedQuery.minDays = minDays;
    return next();
  },
];

const validateVolumeSpikeQuery = [
  ...validatePatternQuery,
  (req, res, next) => {
    const multiplier = parseFloatValue(req.query.multiplier);

    if (multiplier === null || multiplier < 1.5 || multiplier > 10.0) {
      return sendError(res, 'multiplier must be a number between 1.5 and 10.0', 400);
    }

    req.validatedQuery.multiplier = multiplier;
    return next();
  },
];

const validateMACrossoverQuery = [
  ...validatePatternQuery,
  (req, res, next) => {
    const hasShortMA = req.query.shortMA !== undefined && req.query.shortMA !== '';
    const hasLongMA = req.query.longMA !== undefined && req.query.longMA !== '';
    const shortMA = hasShortMA ? parseInteger(req.query.shortMA) : 20;
    const longMA = hasLongMA ? parseInteger(req.query.longMA) : 50;

    if (!isPositiveInteger(shortMA) || !isPositiveInteger(longMA)) {
      return sendError(res, 'shortMA and longMA must be positive integers', 400);
    }

    if (shortMA >= longMA) {
      return sendError(res, 'shortMA must be less than longMA', 400);
    }

    req.validatedQuery.shortMA = shortMA;
    req.validatedQuery.longMA = longMA;
    return next();
  },
];

const validateCompareQuery = [
  (req, res, next) => {
    const rawTickers = Array.isArray(req.query.tickers)
      ? req.query.tickers.join(',')
      : String(req.query.tickers || '');
    const tickers = rawTickers
      .split(',')
      .map(normalizeTicker)
      .filter(Boolean);

    if (tickers.length < 2 || tickers.length > 3 || tickers.some((ticker) => !tickerRegex.test(ticker))) {
      return sendError(res, 'tickers must include 2-3 valid ticker symbols', 400);
    }

    const { start, end } = req.query;
    const dateError = validateDateRange(start, end);
    if (dateError) {
      return sendError(res, dateError, 400);
    }

    req.validatedQuery = {
      tickers,
      startDate: parseDate(start),
      endDate: parseDate(end),
      start,
      end,
    };

    return next();
  },
];

const validateCorrelationQuery = [
  (req, res, next) => {
    const ticker1 = normalizeTicker(req.query.ticker1);
    const ticker2 = normalizeTicker(req.query.ticker2);

    if (!tickerRegex.test(ticker1) || !tickerRegex.test(ticker2)) {
      return sendError(res, 'ticker1 and ticker2 are required valid ticker symbols', 400);
    }

    const { start, end } = req.query;
    const dateError = validateDateRange(start, end);
    if (dateError) {
      return sendError(res, dateError, 400);
    }

    req.validatedQuery = {
      ticker1,
      ticker2,
      startDate: parseDate(start),
      endDate: parseDate(end),
    };

    return next();
  },
];

const validateScreenerQuery = [
  (req, res, next) => {
    const hasAnyFilter = ['sector', 'start', 'end', 'minVolume', 'minPrice', 'maxPrice', 'minGrowthPct']
      .some((key) => req.query[key] !== undefined && req.query[key] !== '');

    if (!hasAnyFilter) {
      return sendError(res, 'At least one screener filter must be provided', 400);
    }

    const sector = req.query.sector ? String(req.query.sector).trim() : null;
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const start = req.query.start || oneYearAgo.toISOString().slice(0, 10);
    const end = req.query.end || today.toISOString().slice(0, 10);
    const dateError = validateDateRange(start, end);
    if (dateError) {
      return sendError(res, dateError, 400);
    }

    const hasMinVolume = req.query.minVolume !== undefined && req.query.minVolume !== '';
    const hasMinPrice = req.query.minPrice !== undefined && req.query.minPrice !== '';
    const hasMaxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '';
    const hasMinGrowthPct = req.query.minGrowthPct !== undefined && req.query.minGrowthPct !== '';

    const minVolume = hasMinVolume ? parseInteger(req.query.minVolume) : 0;
    const minPrice = hasMinPrice ? parseFloatValue(req.query.minPrice) : 0;
    const maxPrice = hasMaxPrice ? parseFloatValue(req.query.maxPrice) : 999999;
    const minGrowthPct = hasMinGrowthPct ? parseFloatValue(req.query.minGrowthPct) : -999;

    if (sector !== null && !sector) {
      return sendError(res, 'sector must be a non-empty string', 400);
    }

    if (minVolume === null || minVolume < 0 || (hasMinVolume && minVolume === 0)) {
      return sendError(res, 'minVolume must be a positive integer', 400);
    }

    if (minPrice === null || maxPrice === null || minPrice < 0 || maxPrice < 0) {
      return sendError(res, 'minPrice and maxPrice must be positive numbers', 400);
    }

    if (minGrowthPct === null) {
      return sendError(res, 'minGrowthPct must be a number', 400);
    }

    if (maxPrice <= minPrice) {
      return sendError(res, 'maxPrice must be greater than minPrice', 400);
    }

    req.validatedQuery = {
      sector,
      start,
      end,
      startDate: parseDate(start),
      endDate: parseDate(end),
      minVolume,
      minPrice,
      maxPrice,
      minGrowthPct,
    };

    return next();
  },
];

const validateSectorVolatilityQuery = [
  (req, res, next) => {
    const sector = req.query.sector ? String(req.query.sector).trim() : null;
    const { start, end } = req.query;

    if (sector !== null && !sector) {
      return sendError(res, 'sector must be a non-empty string', 400);
    }

    const dateError = validateDateRange(start, end);
    if (dateError) {
      return sendError(res, dateError, 400);
    }

    req.validatedQuery = {
      sector,
      startDate: parseDate(start),
      endDate: parseDate(end),
    };

    return next();
  },
];

module.exports = {
  validateStockQuery,
  validatePatternQuery,
  validateGreenDaysQuery,
  validateVolumeSpikeQuery,
  validateMACrossoverQuery,
  validateCompareQuery,
  validateCorrelationQuery,
  validateScreenerQuery,
  validateSectorVolatilityQuery,
};
