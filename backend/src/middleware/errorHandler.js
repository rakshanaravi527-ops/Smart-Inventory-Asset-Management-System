/**
 * @file Global Error Handler Middleware
 * @description Catches all errors and returns a consistent JSON response.
 */

const env = require('../config/env');

/**
 * Global Express error handler.
 * Must be registered with app.use() as the last middleware.
 */
function errorHandler(err, req, res, _next) {
  // Log the full error in non-production
  if (env.NODE_ENV !== 'production') {
    console.error('[Error]', err);
  } else {
    console.error('[Error]', err.message);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 5MB.',
    });
  }

  // Multer general error
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Prisma known request error (e.g. unique constraint)
  if (err.code === 'P2002') {
    const fields = err.meta?.target?.join(', ') || 'unknown field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${fields} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
