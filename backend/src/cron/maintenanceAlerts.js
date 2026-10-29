/**
 * @file Maintenance Alerts Cron Job
 * @description Scans for upcoming and overdue maintenance schedules, creates notifications, and sends emails.
 */

const cron = require('node-cron');
const prisma = require('../config/db');
const { sendMail } = require('../config/mail');

async function checkMaintenanceAlerts() {
  console.log('[Cron] Running maintenance alert check...');
  try {
    const now = new Date();

    // Find all active maintenance schedules
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { active: true },
      include: {
        asset: {
          include: {
            department: true,
          },
        },
      },
    });

    for (const schedule of schedules) {
      const dueDate = new Date(schedule.nextDueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = diffDays < 0;
      const isDueSoon = diffDays >= 0 && diffDays <= schedule.alertDaysBefore;

      if (isOverdue || isDueSoon) {
        // Find Lab Incharge or Admin for this department
        const targetUsers = await prisma.user.findMany({
          where: {
            active: true,
            OR: [
              { role: 'ADMIN' },
              {
                role: 'LAB_INCHARGE',
                departmentId: schedule.asset.departmentId,
              },
            ],
          },
        });

        const title = isOverdue
          ? `Overdue Maintenance: ${schedule.asset.name} (${schedule.asset.assetCode})`
          : `Upcoming Maintenance: ${schedule.asset.name} (${schedule.asset.assetCode})`;

        const message = isOverdue
          ? `Maintenance of type "${schedule.type}" for ${schedule.asset.name} was due on ${dueDate.toISOString().split('T')[0]}.`
          : `Maintenance of type "${schedule.type}" for ${schedule.asset.name} is due in ${diffDays} day(s) on ${dueDate.toISOString().split('T')[0]}.`;

        for (const user of targetUsers) {
          // Avoid duplicate unread notification for the same asset today
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'maintenance',
              title,
              read: false,
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title,
                message,
                type: 'maintenance',
              },
            });

            // Send email if configured
            if (user.email) {
              await sendMail({
                to: user.email,
                subject: title,
                text: message,
              }).catch((e) => console.log('[Cron Mail Error]', e.message));
            }
          }
        }
      }
    }
    console.log('[Cron] Maintenance alert check completed.');
  } catch (err) {
    console.error('[Cron] Error during maintenance alert check:', err.message);
  }
}

/**
 * Initialize maintenance alerts cron (runs every day at 08:00 AM)
 */
function initMaintenanceCron() {
  // Run daily at 8am
  cron.schedule('0 8 * * *', checkMaintenanceAlerts);
  // Also run once on startup after 5 seconds
  setTimeout(checkMaintenanceAlerts, 5000);
}

module.exports = { initMaintenanceCron, checkMaintenanceAlerts };

