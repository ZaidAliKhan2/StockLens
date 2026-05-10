const express = require('express');
const compareController = require('../controllers/compare.controller');
const { verifyToken } = require('../auth/auth.middleware');
const {
  validateCompareQuery,
  validateCorrelationQuery,
} = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken);

router.get('/', validateCompareQuery, compareController.compareStocks);
router.get('/correlation', validateCorrelationQuery, compareController.getCorrelation);

module.exports = router;
