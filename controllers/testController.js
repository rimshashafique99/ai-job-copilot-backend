// controllers/testController.js
const testOtpStore = require('../utils/testOtpstore');

async function getOtp(req, res) {
  const { email } = req.params;
  const otp = testOtpStore.getOtp(email);
  if (!otp) {
    return res.status(404).json({ success: false, error: 'No OTP found for this email' });
  }
  res.json({ success: true, data: { otp } });
}

module.exports = { getOtp };