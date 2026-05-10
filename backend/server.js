require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool, poolConnect } = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', db: pool.connected }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/stock', require('./routes/stock.routes'));
app.use('/api/patterns', require('./routes/patterns.routes'));
app.use('/api/compare', require('./routes/compare.routes'));
app.use('/api/screener', require('./routes/screener.routes'));
app.use('/api/sectors', require('./routes/screener.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

app.use(require('./middleware/errorHandler'));

app.listen(port, () => {
  console.log(`StockLens backend listening on port ${port}`);
});
