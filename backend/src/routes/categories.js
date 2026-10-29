/**
 * @file Category Routes
 * @description CRUD for asset categories. Accessible by ADMIN and LAB_INCHARGE.
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

/** Zod schema for creating a category */
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['instrument', 'computer', 'furniture', 'consumable']).default('instrument'),
});

/** Zod schema for updating a category */
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['instrument', 'computer', 'furniture', 'consumable']).optional(),
});

/**
 * GET /api/categories
 * @description List all categories with pagination and search.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { search, type } = req.query;

    const where = {};
    if (search) {
      where.name = { contains: search };
    }
    if (type) {
      where.type = type;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { _count: { select: { assets: true } } },
      }),
      prisma.category.count({ where }),
    ]);

    return res.json(paginatedResponse(categories, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categories/:id
 * @description Get a single category by ID.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { assets: true } } },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    return res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/categories
 * @description Create a new category.
 */
router.post('/', validate(createCategorySchema), async (req, res, next) => {
  try {
    const category = await prisma.category.create({ data: req.body });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Category',
      entityId: category.id,
      userId: req.user.id,
      newValue: req.body,
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/categories/:id
 * @description Update a category.
 */
router.patch('/:id', validate(updateCategorySchema), async (req, res, next) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Category',
      entityId: category.id,
      userId: req.user.id,
      oldValue: { name: existing.name, type: existing.type },
      newValue: req.body,
    });

    return res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/categories/:id
 * @description Delete a category (only if no assets reference it).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { assets: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    if (existing._count.assets > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing assets.',
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Category',
      entityId: req.params.id,
      userId: req.user.id,
      oldValue: { name: existing.name, type: existing.type },
    });

    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
