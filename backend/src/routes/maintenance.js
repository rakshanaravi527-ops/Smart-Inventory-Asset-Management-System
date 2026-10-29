/**
 * @file Maintenance Routes
 * @description CRUD for maintenance schedules and logs, upcoming/overdue queries.
 */

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buildPagination, paginatedResponse, daysFromNow } = require('../utils/helpers');
const { createAuditLog } = require('../middleware/audit');

const router = Router();

router.use(authenticate);

// ──────────────────────────────────────────────
// MAINTENANCE SCHEDULES
// ──────────────────────────────────────────────

/** Zod schema for creating a maintenance schedule */
const createScheduleSchema = z.object({
  assetId: z.string().uuid('Valid asset ID is required'),
  type: z.enum(['maintenance', 'calibration', 'renewal']).default('maintenance'),
  intervalDays: z.number().int().positive('Interval must be a positive integer'),
  alertDaysBefore: z.number().int().min(0).default(7),
  nextDueDate: z.string().min(1, 'Next due date is required'),
});

/** Zod schema for updating a maintenance schedule */
const updateScheduleSchema = z.object({
  type: z.enum(['maintenance', 'calibration', 'renewal']).optional(),
  intervalDays: z.number().int().positive().optional(),
  alertDaysBefore: z.number().int().min(0).optional(),
  nextDueDate: z.string().optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/maintenance/schedules
 * @description List maintenance schedules with optional filter by assetId.
 */
router.get('/schedules', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { assetId } = req.query;

    const where = {};
    if (assetId) where.assetId = assetId;

    const [schedules, total] = await Promise.all([
      prisma.maintenanceSchedule.findMany({
        where,
        skip,
        take,
        orderBy: { nextDueDate: 'asc' },
        include: {
          asset: {
            select: { id: true, assetCode: true, name: true, status: true },
          },
        },
      }),
      prisma.maintenanceSchedule.count({ where }),
    ]);

    return res.json(paginatedResponse(schedules, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/maintenance/schedules
 * @description Create a new maintenance schedule.
 */
router.post('/schedules',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  validate(createScheduleSchema),
  async (req, res, next) => {
    try {
      const { assetId, type, intervalDays, alertDaysBefore, nextDueDate } = req.body;

      // Verify asset exists
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) {
        return res.status(404).json({ success: false, error: 'Asset not found.' });
      }

      const schedule = await prisma.maintenanceSchedule.create({
        data: {
          assetId,
          type,
          intervalDays,
          alertDaysBefore,
          nextDueDate: new Date(nextDueDate),
        },
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
        },
      });

      await createAuditLog({
        action: 'CREATE',
        entityType: 'MaintenanceSchedule',
        entityId: schedule.id,
        userId: req.user.id,
        newValue: { assetId, type, intervalDays },
        assetId,
      });

      return res.status(201).json({ success: true, data: schedule });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/maintenance/schedules/:id
 * @description Update a maintenance schedule.
 */
router.patch('/schedules/:id',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  validate(updateScheduleSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.maintenanceSchedule.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Maintenance schedule not found.' });
      }

      const data = { ...req.body };
      if (data.nextDueDate) {
        data.nextDueDate = new Date(data.nextDueDate);
      }

      const schedule = await prisma.maintenanceSchedule.update({
        where: { id: req.params.id },
        data,
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
        },
      });

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'MaintenanceSchedule',
        entityId: schedule.id,
        userId: req.user.id,
        oldValue: { type: existing.type, intervalDays: existing.intervalDays },
        newValue: req.body,
        assetId: existing.assetId,
      });

      return res.json({ success: true, data: schedule });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/maintenance/schedules/:id
 * @description Deactivate a maintenance schedule (soft delete).
 */
router.delete('/schedules/:id',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  async (req, res, next) => {
    try {
      const existing = await prisma.maintenanceSchedule.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Maintenance schedule not found.' });
      }

      const schedule = await prisma.maintenanceSchedule.update({
        where: { id: req.params.id },
        data: { active: false },
      });

      await createAuditLog({
        action: 'DELETE',
        entityType: 'MaintenanceSchedule',
        entityId: req.params.id,
        userId: req.user.id,
        oldValue: { active: true },
        newValue: { active: false },
        assetId: existing.assetId,
      });

      return res.json({ success: true, data: schedule, message: 'Schedule deactivated.' });
    } catch (err) {
      next(err);
    }
  }
);

// ──────────────────────────────────────────────
// MAINTENANCE LOGS
// ──────────────────────────────────────────────

/** Zod schema for logging maintenance performed */
const createLogSchema = z.object({
  assetId: z.string().uuid('Valid asset ID is required'),
  scheduleId: z.string().uuid().optional().nullable(),
  type: z.string().min(1, 'Maintenance type is required'),
  cost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/maintenance/logs
 * @description Log maintenance performed. Updates schedule nextDueDate and asset status.
 */
router.post('/logs',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  validate(createLogSchema),
  async (req, res, next) => {
    try {
      const { assetId, scheduleId, type, cost, notes } = req.body;

      // Verify asset exists
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) {
        return res.status(404).json({ success: false, error: 'Asset not found.' });
      }

      let nextDueDate = null;

      // If linked to a schedule, compute next due date
      if (scheduleId) {
        const schedule = await prisma.maintenanceSchedule.findUnique({ where: { id: scheduleId } });
        if (!schedule) {
          return res.status(404).json({ success: false, error: 'Maintenance schedule not found.' });
        }

        nextDueDate = daysFromNow(schedule.intervalDays);

        // Update the schedule's nextDueDate
        await prisma.maintenanceSchedule.update({
          where: { id: scheduleId },
          data: { nextDueDate },
        });
      }

      // Create the maintenance log
      const log = await prisma.maintenanceLog.create({
        data: {
          assetId,
          scheduleId: scheduleId || null,
          type,
          performedById: req.user.id,
          cost: cost || null,
          notes: notes || null,
          nextDueDate,
        },
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          performedBy: { select: { id: true, name: true } },
        },
      });

      // If asset was UnderMaintenance, set it back to Available
      if (asset.status === 'UnderMaintenance') {
        await prisma.asset.update({
          where: { id: assetId },
          data: { status: 'Available' },
        });
      }

      await createAuditLog({
        action: 'CREATE',
        entityType: 'MaintenanceLog',
        entityId: log.id,
        userId: req.user.id,
        newValue: { assetId, type, cost },
        assetId,
      });

      return res.status(201).json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/maintenance/logs
 * @description List maintenance logs with filters.
 */
router.get('/logs', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { assetId, type, scheduleId } = req.query;

    const where = {};
    if (assetId) where.assetId = assetId;
    if (type) where.type = type;
    if (scheduleId) where.scheduleId = scheduleId;

    const [logs, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where,
        skip,
        take,
        orderBy: { performedDate: 'desc' },
        include: {
          asset: { select: { id: true, assetCode: true, name: true } },
          performedBy: { select: { id: true, name: true } },
          schedule: { select: { id: true, type: true, intervalDays: true } },
        },
      }),
      prisma.maintenanceLog.count({ where }),
    ]);

    return res.json(paginatedResponse(logs, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/maintenance/upcoming
 * @description Get upcoming maintenance (next 30 days) and overdue items.
 */
router.get('/upcoming', async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = daysFromNow(30);

    // Upcoming: nextDueDate within 30 days and not overdue
    const upcoming = await prisma.maintenanceSchedule.findMany({
      where: {
        active: true,
        nextDueDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      orderBy: { nextDueDate: 'asc' },
      include: {
        asset: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    // Overdue: nextDueDate is in the past
    const overdue = await prisma.maintenanceSchedule.findMany({
      where: {
        active: true,
        nextDueDate: {
          lt: now,
        },
      },
      orderBy: { nextDueDate: 'asc' },
      include: {
        asset: {
          include: { department: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        upcoming,
        overdue,
        upcomingCount: upcoming.length,
        overdueCount: overdue.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
