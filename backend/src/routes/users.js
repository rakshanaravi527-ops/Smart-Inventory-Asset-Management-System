/**
 * @file User Routes
 * @description Admin-only CRUD for user accounts.
 */

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { buildPagination, paginatedResponse } = require('../utils/helpers');
const { createAuditLog } = require('../middleware/audit');

const router = Router();

// Apply auth to all user routes
router.use(authenticate);
router.use(requireRole('ADMIN'));

/** Zod schema for creating a user */
const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'LAB_INCHARGE', 'STAFF', 'DEPT_HEAD']).default('STAFF'),
  departmentId: z.string().uuid().optional().nullable(),
});

/** Zod schema for updating a user */
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'LAB_INCHARGE', 'STAFF', 'DEPT_HEAD']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
});

/**
 * GET /api/users
 * @description List users with pagination and search.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { search, role, departmentId } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
          department: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json(paginatedResponse(users, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * @description Create a new user with hashed password.
 */
router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const { email, name, password, role, departmentId } = req.body;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      userId: req.user.id,
      newValue: { email, name, role, departmentId },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id
 * @description Update user fields.
 */
router.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Fetch old values for audit
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // If password is being updated, hash it
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      userId: req.user.id,
      oldValue: { email: oldUser.email, name: oldUser.name, role: oldUser.role },
      newValue: req.body,
    });

    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * @description Soft-deactivate a user (set active=false).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Prevent self-deactivation
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    await createAuditLog({
      action: 'DELETE',
      entityType: 'User',
      entityId: user.id,
      userId: req.user.id,
      oldValue: { active: true },
      newValue: { active: false },
    });

    return res.json({ success: true, data: user, message: 'User deactivated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
