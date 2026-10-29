/**
 * @file Overdue Returns Cron Job
 * @description Scans for checked-out items whose return date has passed and marks them Overdue.
 */

const cron = require('node-cron');
const prisma = require('../config/db');
const { sendMail } = require('../config/mail');

async function checkOverdueReturns() {
  console.log('[Cron] Checking overdue checkouts...');
  try {
    const now = new Date();

    const overdueCheckouts = await prisma.usageLog.findMany({
      where: {
        status: 'CheckedOut',
        expectedReturn: {
          lt: now,
        },
      },
      include: {
        asset: true,
        user: true,
      },
    });

    for (const log of overdueCheckouts) {
      // Update status to Overdue
      await prisma.usageLog.update({
        where: { id: log.id },
        data: { status: 'Overdue' },
      });

      const title = `Overdue Asset Return: ${log.asset.name}`;
      const message = `The item "${log.asset.name}" (${log.asset.assetCode}) was due for return on ${
        new Date(log.expectedReturn).toISOString().split('T')[0]
      }. Please return it immediately.`;

      // Check if notification already exists
      const existing = await prisma.notification.findFirst({
        where: {
          userId: log.userId,
          type: 'overdue',
          read: false,
          title,
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            userId: log.userId,
            title,
            message,
            type: 'overdue',
          },
        });

        if (log.user && log.user.email) {
          await sendMail({
            to: log.user.email,
            subject: title,
            text: message,
          }).catch((e) => console.log('[Cron Mail Error]', e.message));
        }
      }
    }
    console.log(`[Cron] Overdue check completed. ${overdueCheckouts.length} item(s) processed.`);
  } catch (err) {
    console.error('[Cron] Error checking overdue checkouts:', err.message);
  }
}

function initOverdueCron() {
  // Run daily at 08:30 AM
  cron.schedule('30 8 * * *', checkOverdueReturns);
  // Also run once on startup after 7 seconds
  setTimeout(checkOverdueReturns, 7000);
}

module.exports = { initOverdueCron, checkOverdueReturns };

