const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../auth/auth.middleware');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
  },
});

router.post('/explain', aiLimiter, verifyToken, aiController.explain);

module.exports = router;
