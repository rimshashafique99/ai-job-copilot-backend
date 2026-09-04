const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const crypto = require('crypto');
const { sendOtpEmail, sendResetOtpEmail } = require('./emailService');
const SALT_ROUNDS = 12;


function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}



function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function signup({ email, password, fullName, targetRole }) {
  const existing = await userRepository.findByEmail(email);

  if (existing && existing.is_verified) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  let user;

  if (existing && !existing.is_verified) {
    // stale unverified signup — overwrite details, issue a fresh OTP
    user = await userRepository.updateUnverifiedUser(existing.id, { passwordHash, fullName, targetRole });
  } else {
    user = await userRepository.createUser({ email, passwordHash, fullName, targetRole });
  }
const otp = generateOtp();
const otpHash = hashToken(otp)
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
await userRepository.setOtp(user.id, otpHash, expiresAt);
await sendOtpEmail(email, otp);

  return { email: user.email };
}
async function verifyOtp({ email, otp }) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found', 404);
  if (user.is_verified) throw new AppError('Email already verified', 400);

  const otpHash = hashToken(otp);
  if (!user.otp_code || user.otp_code !== otpHash) {
    throw new AppError('Invalid verification code', 400);
  }
  if (new Date() > new Date(user.otp_expires_at)) {
    throw new AppError('Verification code expired', 400);
  }

  const verifiedUser = await userRepository.verifyOtpAndActivate(user.id);
  const tokens = generateTokens(verifiedUser.id);
  return { user: verifiedUser, ...tokens };
}

async function resendOtp(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found', 404);
  if (user.is_verified) throw new AppError('Email already verified', 400);

  const otp = generateOtp();
  const otpHash = hashToken(otp)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.setOtp(user.id, otpHash, expiresAt);
  await sendOtpEmail(email, otp);
  return { email };
}
async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) return; // don't reveal whether the email exists

  const otp = generateOtp();
  const otpHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await userRepository.setResetToken(user.id, otpHash, expiresAt);
  await sendResetOtpEmail(email, otp);
}

async function verifyResetOtp({ email, otp }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.reset_token) {
    throw new AppError('Invalid or expired code', 400);
  }
  if (hashToken(otp) !== user.reset_token) {
    throw new AppError('Invalid or expired code', 400);
  }
  if (new Date() > new Date(user.reset_token_expires_at)) {
    throw new AppError('Code has expired', 400);
  }

  // OTP confirmed — issue a short-lived session token to authorize the actual reset
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.setResetToken(user.id, sessionTokenHash, expiresAt);

  return { resetToken: sessionToken };
}

async function resetPassword({ email, resetToken, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.reset_token) {
    throw new AppError('Reset session expired. Please start again.', 400);
  }
  if (hashToken(resetToken) !== user.reset_token) {
    throw new AppError('Reset session expired. Please start again.', 400);
  }
  if (new Date() > new Date(user.reset_token_expires_at)) {
    throw new AppError('Reset session expired. Please start again.', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await userRepository.updatePasswordAndClearReset(user.id, passwordHash);
}




async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.is_verified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  const tokens = generateTokens(user.id);
  const { password_hash, otp_code, otp_expires_at, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

function refreshAccessToken(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const accessToken = jwt.sign({ userId: payload.userId }, config.jwtAccessSecret, { expiresIn: '15m' });
    return accessToken;
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(config.googleClientId);

async function loginWithGoogle(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload(); // { email, name, sub, ... }

  let user = await userRepository.findByGoogleId(payload.sub);

  if (!user) {
    // check if an email/password account already exists with this email
    const existingLocalUser = await userRepository.findByEmail(payload.email);
    if (existingLocalUser) {
      throw new AppError('An account with this email already exists. Please log in with password.', 409);
    }
    user = await userRepository.createGoogleUser({
      email: payload.email,
      fullName: payload.name,
      googleId: payload.sub,
    });
  }

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
}
module.exports = { signup, login, refreshAccessToken, loginWithGoogle, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword };