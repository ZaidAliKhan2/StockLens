const express = require('express');
const stockRoutes = require('./stock.routes');
const patternsRoutes = require('./patterns.routes');
const compareRoutes = require('./compare.routes');
const screenerRoutes = require('./screener.routes');
const aiRoutes = require('./ai.routes');
const authRoutes = require('../src/auth/auth.routes');

const router = express.Router();

router.use('/stock', stockRoutes);
router.use('/patterns', patternsRoutes);
router.use('/compare', compareRoutes);
router.use('/screener', screenerRoutes);
router.use('/sectors', screenerRoutes);
router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);

module.exports = router;
