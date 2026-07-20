const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const settingsRepository = require('../repositories/settingsRepository');

async function getSettings(userId) {
  const user = await settingsRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  return {
    email: user.email,
    fullName: user.full_name,
    authProvider: user.auth_provider,
    emailNotifications: user.email_notifications,
    aiInsights: user.ai_insights,
  };
}

async function updateAccount(userId, { fullName, email }) {
  const existing = await settingsRepository.findByEmailExcludingUser(email, userId);
  if (existing) throw new AppError('Email is already in use', 409);

  return settingsRepository.updateAccountInfo(userId, { fullName, email });
}

async function updatePassword(userId, currentPassword, newPassword) {
  const user = await settingsRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (user.auth_provider !== 'local') {
    throw new AppError('Password cannot be changed for Google-linked accounts', 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  const newHash = await bcrypt.hash(newPassword, 10);
  await settingsRepository.updatePasswordHash(userId, newHash);
}

async function updatePreferences(userId, { emailNotifications, aiInsights }) {
  return settingsRepository.updatePreferences(userId, { emailNotifications, aiInsights });
}

async function deleteAccount(userId, password) {
  const user = await settingsRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Google-linked accounts have no password_hash to verify against
  if (user.auth_provider === 'local') {
    const isMatch = await bcrypt.compare(password || '', user.password_hash);
    if (!isMatch) throw new AppError('Password is incorrect', 401);
  }

  await settingsRepository.deleteUser(userId);
}

module.exports = {
  getSettings,
  updateAccount,
  updatePassword,
  updatePreferences,
  deleteAccount,
};