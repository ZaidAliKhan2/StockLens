const { FEATURE_TYPES, getExplanation } = require('../services/ai.service');
const { sendSuccess, sendError } = require('../utils/formatResponse');

async function explain(req, res, next) {
  try {
    const { featureType, resultData } = req.body || {};

    if (!FEATURE_TYPES.includes(featureType)) {
      return sendError(res, 'Invalid featureType', 400);
    }

    if (!resultData || typeof resultData !== 'object' || Array.isArray(resultData)) {
      return sendError(res, 'resultData must be a non-null object', 400);
    }

    const explanation = await getExplanation(featureType, resultData);

    if (explanation === null) {
      return sendSuccess(res, 'Explanation unavailable', {
        explanation: null,
      });
    }

    return sendSuccess(res, 'Explanation generated', {
      explanation,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  explain,
};
