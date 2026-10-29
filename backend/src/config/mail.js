/**
 * @file Nodemailer Transporter Configuration
 * @description Creates a reusable mail transporter. Gracefully returns null
 * if SMTP credentials are not configured.
 */

const nodemailer = require('nodemailer');
const env = require('./env');

/** @type {import('nodemailer').Transporter | null} */
let transporter = null;

if (env.isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  // Verify connection on startup (non-blocking)
  transporter.verify().then(() => {
    console.log('[Mail] SMTP connection verified successfully');
  }).catch((err) => {
    console.warn('[Mail] SMTP verification failed — emails will not be sent:', err.message);
    transporter = null;
  });
} else {
  console.log('[Mail] SMTP not configured — email sending disabled');
}

/**
 * Send an email if SMTP is configured.
 * @param {object} options - { to, subject, text, html }
 * @returns {Promise<object|null>} nodemailer send result or null
 */
async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log('[Mail] Skipping email (SMTP not configured):', subject);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log('[Mail] Sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('[Mail] Send failed:', err.message);
    return null;
  }
}

module.exports = { transporter, sendMail };
