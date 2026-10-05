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
  // ...your existing template, unchanged
}

async function sendOtpEmail(email, otp) {
  if (process.env.NODE_ENV === 'test') {
    testOtpStore.saveOtp(email, otp);
    return;
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
    return;
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