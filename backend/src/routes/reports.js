/**
 * @file Reports Routes
 * @description Generates utilization, stock, maintenance, and asset audit reports with CSV/JSON export.
 */

const { Router } = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * Helper to convert array of objects to CSV string
 */
function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * GET /api/reports/utilization
 * Asset utilization report
 */
router.get('/utilization', async (req, res, next) => {
  try {
    const { departmentId, categoryId, format } = req.query;

    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (categoryId) where.categoryId = categoryId;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        _count: {
          select: { usageLogs: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const reportData = assets.map((a) => ({
      assetCode: a.assetCode,
      name: a.name,
      category: a.category.name,
      department: a.department.name,
      status: a.status,
      condition: a.condition,
      checkoutCount: a._count.usageLogs,
      isIdle: a._count.usageLogs === 0 && a.status === 'Available',
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="utilization_report.csv"');
      return res.send(toCsv(reportData));
    }

    return res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/stock
 * Consumable stock report with low/excess alerts
 */
router.get('/stock', async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;

    const where = {
      quantity: { not: null },
    };
    if (departmentId) where.departmentId = departmentId;

    const items = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        department: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });

    const reportData = items.map((item) => {
      let stockStatus = 'Normal';
      if (item.minThreshold !== null && item.quantity <= item.minThreshold) {
        stockStatus = 'Low Stock';
      } else if (item.maxLevel !== null && item.quantity > item.maxLevel) {
        stockStatus = 'Excess Stock';
      }

      return {
        assetCode: item.assetCode,
        name: item.name,
        category: item.category.name,
        department: item.department.name,
        location: item.location ? item.location.name : 'N/A',
        quantity: item.quantity,
        minThreshold: item.minThreshold ?? 0,
        maxLevel: item.maxLevel ?? 0,
        stockStatus,
      };
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="stock_report.csv"');
      return res.send(toCsv(reportData));
    }

    return res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/maintenance
 * Maintenance logs and schedules report
 */
router.get('/maintenance', async (req, res, next) => {
  try {
    const { departmentId, format } = req.query;

    const where = {};
    if (departmentId) {
      where.asset = { departmentId };
    }

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        asset: {
          include: { department: true, category: true },
        },
        performedBy: { select: { name: true, email: true } },
      },
      orderBy: { performedDate: 'desc' },
    });

    const reportData = logs.map((log) => ({
      assetCode: log.asset.assetCode,
      assetName: log.asset.name,
      department: log.asset.department.name,
      type: log.type,
      performedDate: log.performedDate.toISOString().split('T')[0],
      performedBy: log.performedBy.name,
      cost: log.cost ?? 0,
      notes: log.notes || '',
      nextDueDate: log.nextDueDate ? log.nextDueDate.toISOString().split('T')[0] : 'N/A',
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="maintenance_report.csv"');
      return res.send(toCsv(reportData));
    }

    return res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/audit
 * Audit trail report
 */
router.get('/audit', async (req, res, next) => {
  try {
    const { entityType, action, format } = req.query;

    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const reportData = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      user: log.user ? log.user.name : 'System',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId || '',
      oldValue: log.oldValue || '',
      newValue: log.newValue || '',
    }));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_report.csv"');
      return res.send(toCsv(reportData));
    }

    return res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

