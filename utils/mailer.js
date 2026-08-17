const nodemailer = require('nodemailer');

const SMTP_CONFIGURED = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter = null;
if (SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(toEmail, name, verifyUrl) {
  const subject = 'Verify your Alfaaz registration';
  const html = `
    <p>Hi ${name},</p>
    <p>Thanks for registering for Alfaaz. Please verify your email to activate your account:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;

  if (!transporter) {
    // No SMTP configured (e.g. local dev / this sandbox) — log the link instead
    // so the flow can still be tested end-to-end.
    console.log('--------------------------------------------------');
    console.log(`[DEV MODE] No SMTP configured. Verification email for ${toEmail}:`);
    console.log(verifyUrl);
    console.log('--------------------------------------------------');
    return { devMode: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Alfaaz" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject,
    html,
  });
  return { devMode: false };
}

module.exports = { sendVerificationEmail };
