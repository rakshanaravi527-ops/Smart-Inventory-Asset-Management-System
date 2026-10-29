/**
 * @file Asset Routes
 * @description Full CRUD for assets, QR code generation, CSV import.
 */

const { Router } = require('express');
const { z } = require('zod');
const QRCode = require('qrcode');
const prisma = require('../config/db');
const env = require('../config/env');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { buildPagination, paginatedResponse } = require('../utils/helpers');
const { generateAssetCode } = require('../utils/assetId');
const { createAuditLog } = require('../middleware/audit');

const router = Router();

// All asset routes require authentication
router.use(authenticate);

/** Zod schema for creating an asset */
const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  categoryId: z.string().uuid('Valid category ID is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  locationId: z.string().uuid().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  cost: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
  warrantyExpiry: z.string().optional().nullable(),
  condition: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).default('Good'),
  status: z.enum(['Available', 'InUse', 'UnderMaintenance', 'Retired']).default('Available'),
  quantity: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
  minThreshold: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
  maxLevel: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
});

/** Zod schema for updating an asset */
const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  cost: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
  warrantyExpiry: z.string().optional().nullable(),
  condition: z.enum(['Good', 'Fair', 'Poor', 'Damaged']).optional(),
  status: z.enum(['Available', 'InUse', 'UnderMaintenance', 'Retired']).optional(),
  quantity: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
  minThreshold: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
  maxLevel: z.preprocess((v) => (v === '' || v === undefined || v === null ? null : Number(v)), z.number().int().min(0).nullable().optional()),
});

/**
 * GET /api/assets
 * @description List assets with search, filters, sorting, and pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = buildPagination(req.query);
    const { search, status, categoryId, departmentId, condition, sortBy, sortOrder } = req.query;

    const where = {};

    if (search) {
      const s = search.trim();
      let cleanQuery = s;
      if (s.includes('/assets/')) {
        const parts = s.split('/assets/');
        cleanQuery = parts[parts.length - 1].replace(/[/?#].*$/, '').trim();
      }

      where.OR = [
        { id: cleanQuery },
        { assetCode: { contains: cleanQuery } },
        { serialNumber: { contains: cleanQuery } },
        { name: { contains: cleanQuery } },
      ];
    }

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (departmentId) where.departmentId = departmentId;
    if (condition) where.condition = condition;

    // Build sort order
    const orderBy = {};
    const validSortFields = ['name', 'assetCode', 'createdAt', 'cost', 'status', 'condition'];
    if (sortBy && validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          department: true,
          location: true,
          currentHolder: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return res.json(paginatedResponse(assets, total, page, limit));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/assets/:id
 * @description Get full asset detail with all relations.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        department: true,
        location: true,
        currentHolder: {
          select: { id: true, name: true, email: true, role: true },
        },
        maintenanceSchedules: {
          where: { active: true },
          orderBy: { nextDueDate: 'asc' },
        },
        usageLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        maintenanceLogs: {
          take: 10,
          orderBy: { performedDate: 'desc' },
          include: {
            performedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    return res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/assets
 * @description Create a new asset with auto-generated asset code. Supports photo upload.
 */
router.post('/',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      // Parse and validate body (multer puts fields in req.body as strings)
      const parsed = createAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
      }

      const data = parsed.data;

      // Generate asset code
      const assetCode = await generateAssetCode(data.departmentId);

      // Build create payload
      const createData = {
        assetCode,
        name: data.name,
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        locationId: data.locationId || null,
        serialNumber: data.serialNumber || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        vendor: data.vendor || null,
        cost: data.cost || null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        condition: data.condition,
        status: data.status,
        quantity: data.quantity ?? null,
        minThreshold: data.minThreshold ?? null,
        maxLevel: data.maxLevel ?? null,
      };

      // If a photo was uploaded, set the URL
      if (req.file) {
        createData.photoUrl = `/uploads/${req.file.filename}`;
      }

      const asset = await prisma.asset.create({
        data: createData,
        include: {
          category: true,
          department: true,
          location: true,
        },
      });

      await createAuditLog({
        action: 'CREATE',
        entityType: 'Asset',
        entityId: asset.id,
        userId: req.user.id,
        newValue: { assetCode, name: data.name },
        assetId: asset.id,
      });

      return res.status(201).json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/assets/:id
 * @description Update asset fields. Supports photo upload.
 */
router.patch('/:id',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Asset not found.' });
      }

      const parsed = updateAssetSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
      }

      const data = { ...parsed.data };

      // Convert date strings to Date objects
      if (data.purchaseDate !== undefined) {
        data.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
      }
      if (data.warrantyExpiry !== undefined) {
        data.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null;
      }

      if (req.file) {
        data.photoUrl = `/uploads/${req.file.filename}`;
      }

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data,
        include: {
          category: true,
          department: true,
          location: true,
        },
      });

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Asset',
        entityId: asset.id,
        userId: req.user.id,
        oldValue: { name: existing.name, status: existing.status, condition: existing.condition },
        newValue: parsed.data,
        assetId: asset.id,
      });

      return res.json({ success: true, data: asset });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/assets/:id
 * @description Retire an asset (set status=Retired). Requires a reason.
 */
router.delete('/:id',
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Retirement reason is required.' });
      }

      const existing = await prisma.asset.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Asset not found.' });
      }

      if (existing.status === 'Retired') {
        return res.status(400).json({ success: false, error: 'Asset is already retired.' });
      }

      const asset = await prisma.asset.update({
        where: { id: req.params.id },
        data: {
          status: 'Retired',
          retirementReason: reason.trim(),
          retirementApprovedBy: req.user.id,
        },
        include: { category: true, department: true },
      });

      await createAuditLog({
        action: 'DELETE',
        entityType: 'Asset',
        entityId: asset.id,
        userId: req.user.id,
        oldValue: { status: existing.status },
        newValue: { status: 'Retired', retirementReason: reason.trim() },
        assetId: asset.id,
      });

      return res.json({ success: true, data: asset, message: 'Asset retired successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/assets/import
 * @description Bulk CSV import of assets. Expects JSON body with `csvData` field
 * containing CSV text. Columns: name, categoryId, departmentId, serialNumber, vendor, cost, condition
 */
router.post('/import',
  requireRole('ADMIN', 'LAB_INCHARGE'),
  async (req, res, next) => {
    try {
      const { csvData } = req.body;
      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({ success: false, error: 'csvData field (string) is required.' });
      }

      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ success: false, error: 'CSV must contain a header row and at least one data row.' });
      }

      // Parse header
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'categoryid', 'departmentid'];
      for (const rh of requiredHeaders) {
        if (!headers.includes(rh)) {
          return res.status(400).json({ success: false, error: `Missing required CSV column: ${rh}` });
        }
      }

      const results = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        try {
          const assetCode = await generateAssetCode(row.departmentid);
          const asset = await prisma.asset.create({
            data: {
              assetCode,
              name: row.name,
              categoryId: row.categoryid,
              departmentId: row.departmentid,
              serialNumber: row.serialnumber || null,
              vendor: row.vendor || null,
              cost: row.cost ? parseFloat(row.cost) : null,
              condition: row.condition || 'Good',
              status: 'Available',
            },
          });
          results.push(asset);
        } catch (err) {
          errors.push({ row: i + 1, error: err.message });
        }
      }

      await createAuditLog({
        action: 'CREATE',
        entityType: 'Asset',
        userId: req.user.id,
        newValue: { importedCount: results.length, errorCount: errors.length },
      });

      return res.status(201).json({
        success: true,
        data: {
          imported: results.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/assets/:id/qr
 * @description Generate a QR code PNG as a data URL for the asset.
 */
router.get('/:id/qr', async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      select: { id: true, assetCode: true, name: true },
    });

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    const qrUrl = `${env.FRONTEND_URL}/assets/${asset.id}`;
    const dataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return res.json({
      success: true,
      data: {
        assetCode: asset.assetCode,
        assetName: asset.name,
        qrDataUrl: dataUrl,
        qrCode: dataUrl,
        encodedUrl: qrUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
