const express = require('express');
const patternsController = require('../controllers/patterns.controller');
const { verifyToken } = require('../auth/auth.middleware');
const {
  validateGreenDaysQuery,
  validateVolumeSpikeQuery,
  validateMACrossoverQuery,
} = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken);

router.get('/green-days', validateGreenDaysQuery, patternsController.getGreenDays);
router.get('/volume-spike', validateVolumeSpikeQuery, patternsController.getVolumeSpike);
router.get('/ma-crossover', validateMACrossoverQuery, patternsController.getMACrossover);

module.exports = router;
