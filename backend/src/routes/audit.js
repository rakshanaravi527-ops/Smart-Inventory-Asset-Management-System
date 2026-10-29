/**
 * @file Audit Log Routes
 * @description List audit trail logs with filtering and pagination. Admin only.
 */

const { Router } = require('express');
const prisma = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildPagination, paginatedResponse } = require('../utils/helpers');

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/audit-logs
 * List all audit logs with filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { action, entityType, userId } = req.query;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          asset: { select: { id: true, name: true, assetCode: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json(paginatedResponse(logs, total, page, limit));
  } catch (err) {
    next(err);
  }
});

module.exports = router;

