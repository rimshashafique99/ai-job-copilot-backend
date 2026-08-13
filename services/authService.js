const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 12;

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

const crypto = require('crypto');
const { sendOtpEmail } = require('./emailService');

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function signup({ email, password, fullName, targetRole }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.createUser({ email, passwordHash, fullName, targetRole });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.setOtp(user.id, otp, expiresAt);
  await sendOtpEmail(email, otp);

  return { email: user.email }; // no tokens yet — not verified
}

async function verifyOtp({ email, otp }) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found', 404);
  if (user.is_verified) throw new AppError('Email already verified', 400);
  if (!user.otp_code || user.otp_code !== otp) {
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
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.setOtp(user.id, otp, expiresAt);
  await sendOtpEmail(email, otp);
  return { email };
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
module.exports = { signup, login, refreshAccessToken, loginWithGoogle, verifyOtp, resendOtp };