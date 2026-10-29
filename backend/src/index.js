/**
 * @file Main Application Entry
 * @description Express server setup with middleware, routes, cron jobs, and error handling.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const categoryRoutes = require('./routes/categories');
const locationRoutes = require('./routes/locations');
const assetRoutes = require('./routes/assets');
const checkoutRoutes = require('./routes/checkout');
const maintenanceRoutes = require('./routes/maintenance');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');

// Cron imports
const { initMaintenanceCron } = require('./cron/maintenanceAlerts');
const { initOverdueCron } = require('./cron/overdueReturns');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server and cron jobs when run directly
if (require.main === module) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Smart Inventory & Asset Management System API`);
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);

    // Initialize background cron jobs
    initMaintenanceCron();
    initOverdueCron();
  });
}

module.exports = app;

