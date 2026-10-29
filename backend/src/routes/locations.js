/**
 * @file Location Routes
 * @description CRUD for locations. Accessible by ADMIN and LAB_INCHARGE.
 */

const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buildPagination, paginatedResponse } = require('../utils/helpers');
const { createAuditLog } = require('../middleware/audit');

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'LAB_INCHARGE'));

/** Zod schema for creating a location */
const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  building: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  departmentId: z.string().uuid('Valid department ID is required'),
});

/** Zod schema for updating a location */
const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  building: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional(),
});

/**
 * GET /api/locations
 * @description List all locations with pagination and optional filters.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { search, departmentId } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { building: { contains: search } },
        { room: { contains: search } },
      ];
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          department: true,
          _count: { select: { assets: true } },
        },
      }),
      prisma.location.count({ where }),
    ]);

    return res.json(paginatedResponse(locations, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/locations/:id
 * @description Get a single location by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        _count: { select: { assets: true } },
      },
    });

    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found.' });
    }

    return res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/locations
 * @description Create a new location.
 */
router.post('/', validate(createLocationSchema), async (req, res, next) => {
  try {
    const location = await prisma.location.create({
      data: req.body,
      include: { department: true },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Location',
      entityId: location.id,
      userId: req.user.id,
      newValue: req.body,
    });

    return res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/locations/:id
 * @description Update a location.
 */
router.patch('/:id', validate(updateLocationSchema), async (req, res, next) => {
  try {
    const existing = await prisma.location.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Location not found.' });
    }

    const location = await prisma.location.update({
      where: { id: req.params.id },
      data: req.body,
      include: { department: true },
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Location',
      entityId: location.id,
      userId: req.user.id,
      oldValue: { name: existing.name, building: existing.building, room: existing.room },
      newValue: req.body,
    });

    return res.json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/locations/:id
 * @description Delete a location (only if no assets reference it).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { assets: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Location not found.' });
    }

    if (existing._count.assets > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete location with existing assets.',
      });
    }

    await prisma.location.delete({ where: { id: req.params.id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Location',
      entityId: req.params.id,
      userId: req.user.id,
      oldValue: { name: existing.name },
    });

    return res.json({ success: true, message: 'Location deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
