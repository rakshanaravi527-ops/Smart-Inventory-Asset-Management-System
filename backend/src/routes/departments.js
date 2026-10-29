/**
 * @file Department Routes
 * @description Admin-only CRUD for departments.
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
router.use(requireRole('ADMIN'));

/** Zod schema for creating a department */
const createDeptSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required').max(10, 'Code must be 10 chars or less'),
});

/** Zod schema for updating a department */
const updateDeptSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).max(10).optional(),
});

/**
 * GET /api/departments
 * @description List all departments with pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { users: true, assets: true, locations: true } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return res.json(paginatedResponse(departments, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/departments/:id
 * @description Get a single department by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        locations: true,
        _count: { select: { users: true, assets: true } },
      },
    });

    if (!dept) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    return res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/departments
 * @description Create a new department.
 */
router.post('/', validate(createDeptSchema), async (req, res, next) => {
  try {
    const dept = await prisma.department.create({
      data: req.body,
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Department',
      entityId: dept.id,
      userId: req.user.id,
      newValue: req.body,
    });

    return res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/departments/:id
 * @description Update a department.
 */
router.patch('/:id', validate(updateDeptSchema), async (req, res, next) => {
  try {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Department',
      entityId: dept.id,
      userId: req.user.id,
      oldValue: { name: existing.name, code: existing.code },
      newValue: req.body,
    });

    return res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/departments/:id
 * @description Delete a department (only if no assets or users reference it).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { assets: true, users: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Department not found.' });
    }

    if (existing._count.assets > 0 || existing._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department with existing assets or users. Remove them first.',
      });
    }

    await prisma.department.delete({ where: { id: req.params.id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Department',
      entityId: req.params.id,
      userId: req.user.id,
      oldValue: { name: existing.name, code: existing.code },
    });

    return res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
