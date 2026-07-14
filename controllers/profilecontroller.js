const profileService = require('../services/profileService');

async function getProfile(req, res, next) {
  try {
    const result = await profileService.getProfile(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, targetRole } = req.body;
    const user = await profileService.updateProfile(req.user.id, { fullName, targetRole });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function uploadCv(req, res, next) {
  try {
    const profile = await profileService.uploadCv(req.user.id, req.file?.buffer);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, uploadCv };