const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const { extractTextFromPdf } = require('./pdfParse.service');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  const profile = await profileRepository.findByUserId(userId);
  return { user, profile };
}

// Orchestrates two tables: users (name/role) and profiles (summary).
// Kept in the service layer rather than the repository, since it's
// a business operation spanning two entities, not a single-table concern.
async function updateProfile(userId, { fullName, targetRole, summary }) {
  if (!fullName) {
    throw new AppError('fullName is required', 400);
  }

  const user = await userRepository.updateUser(userId, { fullName, targetRole });

  let profile = null;
  if (summary !== undefined) {
    profile = await profileRepository.upsertProfile(userId, { summary });
  }

  return { user, profile };
}

async function uploadCv(userId, fileBuffer) {
  if (!fileBuffer) {
    throw new AppError('No file uploaded', 400);
  }

  const cvText = await extractTextFromPdf(fileBuffer);
  if (!cvText) {
    throw new AppError('Could not extract text from this PDF', 422);
  }

  const cloudinaryResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'cv-uploads' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(fileBuffer);
  });

  return profileRepository.upsertProfile(userId, {
    cvText,
    cvFileUrl: cloudinaryResult.secure_url,
  });
}

module.exports = { getProfile, updateProfile, uploadCv };