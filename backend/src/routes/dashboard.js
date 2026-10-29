/**
 * @file Dashboard Routes
 * @description Aggregated statistics and chart data for the dashboard.
 */

const { Router } = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Summary statistics cards
 */
router.get('/stats', async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalAssets,
      available,
      inUse,
      underMaintenance,
      retired,
      consumables,
      overdueMaintenanceCount,
      overdueCheckoutsCount,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'Available' } }),
      prisma.asset.count({ where: { status: 'InUse' } }),
      prisma.asset.count({ where: { status: 'UnderMaintenance' } }),
      prisma.asset.count({ where: { status: 'Retired' } }),
      // Consumables where quantity <= minThreshold
      prisma.asset.findMany({
        where: {
          quantity: { not: null },
          minThreshold: { not: null },
        },
        select: {
          id: true,
          quantity: true,
          minThreshold: true,
        },
      }),
      // Overdue maintenance
      prisma.maintenanceSchedule.count({
        where: {
          active: true,
          nextDueDate: { lt: now },
        },
      }),
      // Overdue checkouts
      prisma.usageLog.count({
        where: {
          status: 'CheckedOut',
          expectedReturn: { lt: now },
        },
      }),
    ]);

    const lowStockCount = consumables.filter(
      (c) => c.quantity !== null && c.minThreshold !== null && c.quantity <= c.minThreshold
    ).length;

    return res.json({
      success: true,
      data: {
        totalAssets,
        available,
        inUse,
        underMaintenance,
        retired,
        lowStockItems: lowStockCount,
        overdueMaintenanceCount,
        overdueCheckoutsCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/charts/by-category
 */
router.get('/charts/by-category', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const data = categories.map((cat) => ({
      name: cat.name,
      count: cat._count.assets,
      type: cat.type,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/charts/by-department
 */
router.get('/charts/by-department', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const data = departments.map((dept) => ({
      name: dept.name,
      code: dept.code,
      count: dept._count.assets,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/charts/by-status
 */
router.get('/charts/by-status', async (req, res, next) => {
  try {
    const statuses = ['Available', 'InUse', 'UnderMaintenance', 'Retired'];
    const counts = await Promise.all(
      statuses.map((status) => prisma.asset.count({ where: { status } }))
    );

    const data = statuses.map((status, index) => ({
      name: status,
      value: counts[index],
    }));

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dashboard/charts/recent-activity
 */
router.get('/charts/recent-activity', async (req, res, next) => {
  try {
    const [recentCheckouts, recentMaintenance] = await Promise.all([
      prisma.usageLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { name: true, assetCode: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.maintenanceLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { name: true, assetCode: true } },
          performedBy: { select: { name: true, email: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        recentCheckouts,
        recentMaintenance,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

