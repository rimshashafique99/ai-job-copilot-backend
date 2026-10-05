// services/emailService.js
const config = require('../config');
const testOtpStore = require('../utils/testOtpstore');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, html }) {
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': config.brevoApiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'AI Job Copilot', email: config.emailFrom },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000), // fail in 10s instead of hanging 120s
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed (${res.status}): ${body}`);
  }
}

function otpEmailHtml({ heading, intro, otp, footer }) {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
    <p style="font-size: 13px; font-weight: 700; color: #4f46e5; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 16px;">AI Job Copilot</p>
    <h2 style="font-size: 20px; color: #111827; margin: 0 0 8px;">${heading}</h2>
    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.5;">${intro}</p>
    <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 0.3em; color: #4f46e5;">${otp}</span>
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5;">${footer}</p>
  </div>`;
}

async function sendOtpEmail(email, otp) {
  if (process.env.NODE_ENV === 'test') {
    testOtpStore.saveOtp(email, otp);
    return; // skip real sending entirely in test mode
  }

  await sendEmail({
    to: email,
    subject: 'Verify your email — AI Job Copilot',
    html: otpEmailHtml({
      heading: 'Verify your email',
      intro: 'Enter this code to finish setting up your account. It expires in 10 minutes.',
      otp,
      footer: "If you didn't request this, you can safely ignore this email.",
    }),
  });
}

async function sendResetOtpEmail(email, otp) {
  if (process.env.NODE_ENV === 'test') {
    testOtpStore.saveOtp(email, otp);
    return; // skip real sending entirely in test mode
  }

  await sendEmail({
    to: email,
    subject: 'Your password reset code — AI Job Copilot',
    html: otpEmailHtml({
      heading: 'Reset your password',
      intro: 'Enter this code to reset your password. It expires in 10 minutes.',
      otp,
      footer: "If you didn't request this, you can safely ignore this email.",
    }),
  });
}

module.exports = { sendOtpEmail, sendResetOtpEmail };