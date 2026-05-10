const express = require('express');
const screenerController = require('../controllers/screener.controller');
const { verifyToken } = require('../auth/auth.middleware');
const {
  validateScreenerQuery,
  validateSectorVolatilityQuery,
} = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken);

router.get('/', validateScreenerQuery, screenerController.runScreener);
router.get('/volatility', validateSectorVolatilityQuery, screenerController.getSectorVolatility);
router.get('/list', screenerController.listSectors);

module.exports = router;
