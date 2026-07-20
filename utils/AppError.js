class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors (bad password) from bugs
  }
}

module.exports = AppError;