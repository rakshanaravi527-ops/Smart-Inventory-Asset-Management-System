/**
 * @file Checkout / Check-in Routes
 * @description Manage asset checkouts and returns.
 */

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buildPagination, paginatedResponse } = require('../utils/helpers');
const { createAuditLog } = require('../middleware/audit');

const router = Router();

router.use(authenticate);

/** Zod schema for checking out an asset */
const checkoutSchema = z.object({
  assetId: z.string().uuid('Valid asset ID is required'),
  userId: z.string().uuid().optional(),
  purpose: z.string().optional(),
  expectedReturn: z.string().optional().nullable(),
});

/** Zod schema for checking in an asset */
const checkinSchema = z.object({
  conditionOnReturn: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).default('Good'),
  notes: z.string().optional(),
});

/**
 * POST /api/checkout
 * @description Check out an asset to a user.
 */
router.post('/', validate(checkoutSchema), async (req, res, next) => {
  try {
    const { assetId, purpose, expectedReturn } = req.body;
    const userId = req.body.userId || req.user.id;

    // Fetch the asset to validate status
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    if (asset.status === 'Retired') {
      return res.status(400).json({ success: false, error: 'Cannot checkout a retired asset.' });
    }

    if (asset.status === 'UnderMaintenance') {
      return res.status(400).json({ success: false, error: 'Cannot checkout an asset under maintenance.' });
    }

    if (asset.status === 'InUse') {
      return res.status(400).json({ success: false, error: 'Asset is already checked out.' });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }

    // Create usage log and update asset in a transaction
    const [usageLog, updatedAsset] = await prisma.$transaction([
      prisma.usageLog.create({
        data: {
          assetId,
          userId,
          purpose: purpose || null,
          expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
          status: 'CheckedOut',
        },
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'InUse',
          currentHolderId: userId,
          lastCheckedDate: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      action: 'CHECKOUT',
      entityType: 'Asset',
      entityId: assetId,
      userId: req.user.id,
      newValue: { checkedOutTo: userId, purpose },
      assetId,
    });

    return res.status(201).json({ success: true, data: usageLog });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/checkout/:id/checkin
 * @description Check in an asset (by UsageLog ID).
 */
router.post('/:id/checkin', validate(checkinSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { conditionOnReturn, notes } = req.body;

    // Find the usage log
    const usageLog = await prisma.usageLog.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!usageLog) {
      return res.status(404).json({ success: false, error: 'Usage log not found.' });
    }

    if (usageLog.status === 'Returned') {
      return res.status(400).json({ success: false, error: 'Asset has already been returned.' });
    }

    // Update usage log and asset in a transaction
    const [updatedLog, updatedAsset] = await prisma.$transaction([
      prisma.usageLog.update({
        where: { id },
        data: {
          actualReturn: new Date(),
          conditionOnReturn,
          status: 'Returned',
        },
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.asset.update({
        where: { id: usageLog.assetId },
        data: {
          status: 'Available',
          currentHolderId: null,
          condition: conditionOnReturn,
        },
      }),
    ]);

    await createAuditLog({
      action: 'CHECKIN',
      entityType: 'Asset',
      entityId: usageLog.assetId,
      userId: req.user.id,
      oldValue: { status: 'CheckedOut' },
      newValue: { status: 'Returned', conditionOnReturn },
      assetId: usageLog.assetId,
    });

    return res.json({ success: true, data: updatedLog });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/checkout
 * @description List checkouts with filters and pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { status, userId, assetId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (assetId) where.assetId = assetId;

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: {
            select: { id: true, assetCode: true, name: true, status: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.usageLog.count({ where }),
    ]);

    return res.json(paginatedResponse(logs, total, page, limit));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
