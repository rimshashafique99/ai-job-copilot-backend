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
    const { fullName, targetRole, summary } = req.body; 
    const { user, profile } = await profileService.updateProfile(req.user.id, { fullName, targetRole, summary });
    res.json({ success: true, data: { user, profile } });
  } catch (err) {
    next(err);
  }
}

async function uploadCv(req, res, next) {
  try {
    const profile = await profileService.uploadCv(req.user.id, req.file?.buffer, req.file?.originalname);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
}

async function deleteCv(req, res, next) {
  try {
    const profile = await profileService.deleteCv(req.user.id);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, uploadCv , deleteCv};