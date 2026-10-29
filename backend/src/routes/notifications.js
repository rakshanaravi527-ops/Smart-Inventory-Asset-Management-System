/**
 * @file Notification Routes
 * @description List, mark read, mark all read, get unread count.
 */

const { Router } = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { buildPagination, paginatedResponse } = require('../utils/helpers');

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Fetch current user's notifications with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { type, read } = req.query;

    const where = {
      userId: req.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (read !== undefined) {
      where.read = read === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return res.json(paginatedResponse(notifications, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 * Return number of unread notifications for current user
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    });

    return res.json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: { read: true },
    });

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

