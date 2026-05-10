const express = require('express');
const stockController = require('../controllers/stock.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { validateStockQuery } = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken);

router.get('/history', validateStockQuery, stockController.getHistory);
router.get('/stats', validateStockQuery, stockController.getStats);
router.get('/moving-averages', validateStockQuery, stockController.getMovingAverages);
router.get('/best-worst-month', validateStockQuery, stockController.getBestWorstMonth);

module.exports = router;
