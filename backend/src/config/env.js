/**
 * @file Environment Variable Loader & Validator
 * @description Loads .env via dotenv and exposes validated config values.
 */

require('dotenv').config();

const env = {
  /** Server port */
  PORT: parseInt(process.env.PORT, 10) || 5000,

  /** JWT secret key */
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',

  /** JWT token expiry duration */
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  /** Database URL */
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',

  /** SMTP configuration */
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@inventory.college.edu',

  /** Frontend URL for CORS and QR codes */
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  /** Upload directory for asset photos */
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  /** Current environment */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /**
   * Whether SMTP is properly configured for sending emails.
   * @returns {boolean}
   */
  get isSmtpConfigured() {
    return !!(this.SMTP_HOST && this.SMTP_USER && this.SMTP_PASS);
  },
};

module.exports = env;
