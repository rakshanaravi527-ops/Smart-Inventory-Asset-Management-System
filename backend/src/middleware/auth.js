/**
 * @file Authentication & Authorization Middleware
 * @description JWT verification and role-based access control.
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/db');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches the full user object (minus password) to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token has expired. Please login again.' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found.' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Account has been deactivated.' });
    }

    // Remove passwordHash before attaching to request
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: Restrict access to specified roles.
 * Must be used AFTER authenticate middleware.
 * @param  {...string} roles - Allowed roles (e.g. 'ADMIN', 'LAB_INCHARGE')
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = { authenticate, requireRole };
