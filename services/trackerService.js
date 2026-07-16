const jobApplicationRepo = require('../repositories/jobApplicationRepository');
const aiOutputRepo = require('../repositories/aiOutputRepository');
const AppError = require('../utils/AppError');

async function createManual({ userId, role, companyName, stage, tag, jobLink }) {
  return jobApplicationRepo.create({
    userId,
    role: role || null,
    companyName,
    jobLink: jobLink || null,
    tag: tag || null,
    stage: stage || 'applied'
  });
}

async function listForUser(userId) {
  return jobApplicationRepo.findAllByUser(userId);
}

async function getOne(userId, id) {
  const jobApplication = await jobApplicationRepo.findById(id, userId);
  if (!jobApplication) throw new AppError('Job application not found.', 404);

  const outputs = await aiOutputRepo.findByJobApplication(id);
  return { ...jobApplication, aiOutputs: outputs };
}

async function updateOne(userId, id, fields) {
  const updated = await jobApplicationRepo.update(id, userId, fields);
  if (!updated) throw new AppError('Job application not found.', 404);
  return updated;
}

async function deleteOne(userId, id) {
  const deleted = await jobApplicationRepo.remove(id, userId);
  if (!deleted) throw new AppError('Job application not found.', 404);
  return deleted;
}

module.exports = { createManual, listForUser, getOne, updateOne, deleteOne };