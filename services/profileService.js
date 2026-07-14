const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const { extractTextFromPdf } = require('./pdfParse.service');
const AppError = require('../utils/AppError');

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  const profile = await profileRepository.findByUserId(userId);
  return { user, profile };
}

async function updateProfile(userId, { fullName, targetRole }) {
  if (!fullName) {
    throw new AppError('fullName is required', 400);
  }
  return userRepository.updateUser(userId, { fullName, targetRole });
}

async function uploadCv(userId, fileBuffer) {
  if (!fileBuffer) {
    throw new AppError('No file uploaded', 400);
  }
  const cvText = await extractTextFromPdf(fileBuffer);
  if (!cvText) {
    throw new AppError('Could not extract text from this PDF', 422);
  }
  return profileRepository.upsertProfile(userId, { cvText });
}

module.exports = { getProfile, updateProfile, uploadCv };