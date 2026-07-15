const settingsService = require('../services/settingsService');

async function getSettings(req, res, next) {
  try {
    const data = await settingsService.getSettings(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateAccount(req, res, next) {
  const { fullName, email } = req.body;

  // simple presence checks stay here per our convention
  if (!fullName || !email) {
    return res.status(400).json({
      success: false,
      error: 'fullName and email are required',
    });
  }

  try {
    const data = await settingsService.updateAccount(req.user.id, { fullName, email });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updatePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'currentPassword and newPassword are required',
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'newPassword must be at least 8 characters',
    });
  }

  try {
    await settingsService.updatePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  const { emailNotifications, aiInsights } = req.body;

  if (typeof emailNotifications !== 'boolean' || typeof aiInsights !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'emailNotifications and aiInsights must be booleans',
    });
  }

  try {
    const data = await settingsService.updatePreferences(req.user.id, {
      emailNotifications,
      aiInsights,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res, next) {
  const { password } = req.body;

  try {
    await settingsService.deleteAccount(req.user.id, password);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'Account deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateAccount,
  updatePassword,
  updatePreferences,
  deleteAccount,
};