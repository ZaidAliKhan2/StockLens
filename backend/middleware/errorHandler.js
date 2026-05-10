module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err.message);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Internal server error',
  });
};
