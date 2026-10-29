/**
 * @file Audit Logging Middleware
 * @description Records CREATE, UPDATE, DELETE actions to the AuditLog table.
 * Can be used as middleware or called directly as a utility.
 */

const prisma = require('../config/db');

/**
 * Record an audit log entry.
 * @param {object} params
 * @param {string} params.action - CREATE, UPDATE, DELETE, CHECKOUT, CHECKIN
 * @param {string} params.entityType - Entity being acted on (Asset, User, Department, etc.)
 * @param {string} [params.entityId] - ID of the entity
 * @param {string} [params.userId] - User performing the action
 * @param {object} [params.oldValue] - Previous state (for updates/deletes)
 * @param {object} [params.newValue] - New state (for creates/updates)
 * @param {string} [params.assetId] - Related asset ID (if applicable)
 * @returns {Promise<object>} Created audit log entry
 */
async function createAuditLog({ action, entityType, entityId, userId, oldValue, newValue, assetId }) {
  try {
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId || null,
        userId: userId || null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        assetId: assetId || null,
      },
    });
  } catch (err) {
    // Audit logging should never crash the request — log and continue
    console.error('[Audit] Failed to create audit log:', err.message);
    return null;
  }
}

/**
 * Express middleware that automatically creates an audit log after
 * successful mutating requests (POST, PATCH, PUT, DELETE).
 * Attaches createAuditLog to req for manual use in route handlers.
 */
function auditMiddleware(req, res, next) {
  // Attach the helper to req so route handlers can call it directly
  req.audit = createAuditLog;
  next();
}

module.exports = { auditMiddleware, createAuditLog };
