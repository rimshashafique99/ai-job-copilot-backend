const otpStore = new Map();

function saveOtp(email, otp) {
  otpStore.set(email, otp);
}

function getOtp(email) {
  return otpStore.get(email);
}

function clearOtp(email) {
  otpStore.delete(email);
}

module.exports = { saveOtp, getOtp, clearOtp };