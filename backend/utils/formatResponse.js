function sendSuccess(res, message, data, statusCode = 200) {
  const payload = {
    success: true,
    message,
  };

  if (data !== undefined && data !== null) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
}

function sendError(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
