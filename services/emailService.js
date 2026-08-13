const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.smtpHost,       // e.g. smtp.gmail.com
  port: config.smtpPort,       // 587
  secure: false,
  auth: { user: config.smtpUser, pass: config.smtpPass },
});

async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: `"AI Job Copilot" <${config.smtpUser}>`,
    to: email,
    subject: 'Verify your email — AI Job Copilot',
    html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
  });
}

module.exports = { sendOtpEmail };