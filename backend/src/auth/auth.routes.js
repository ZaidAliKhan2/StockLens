const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { verifyToken } = require('./auth.middleware');

const router = express.Router();

const standardAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
  },
});

router.post('/register', standardAuthLimiter, authController.register);
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/login', standardAuthLimiter, authController.login);
router.post('/resend-otp', standardAuthLimiter, authController.resendOTP);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
