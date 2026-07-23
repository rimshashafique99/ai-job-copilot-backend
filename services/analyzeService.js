const jobApplicationRepo = require("../repositories/jobApplicationRepository");
const aiOutputRepo = require("../repositories/aiOutputRepository");
const profileService = require("./profileService");
const groqService = require("./groqService");
const AppError = require("../utils/AppError");

async function runFullAnalysis({
  userId,
  companyName,
  jobDescription,
  jobApplicationId = null,
}) {
  const { profile } = await profileService.getProfile(userId);
  if (!profile || !profile.cv_text) {
    throw new AppError("Please upload your CV before analyzing a job.", 400);
  }

  const aiResult = await groqService.generateFullAnalysis({
    cvText: profile.cv_text,
    jobDescription,
    companyName,
  });

  let jobApplication;
  if (jobApplicationId) {
    jobApplication = await jobApplicationRepo.findById(
      jobApplicationId,
      userId,
    );
    if (!jobApplication) throw new AppError("Job application not found.", 404);

    jobApplication = await jobApplicationRepo.update(jobApplicationId, userId, {
      role: jobApplication.role || aiResult.role,
      companyName,
      jobDescription,
    });
  } else {
    jobApplication = await jobApplicationRepo.create({
      userId,
      role: aiResult.role,
      companyName,
      jobDescription,
      stage: "saved",
    });
  }

  const outputs = await aiOutputRepo.upsertMany(jobApplication.id, {
    coverLetter: aiResult.coverLetter,
    coldEmail: aiResult.coldEmail,
    gapAnalysis: aiResult.gapAnalysis,
    cvBullets: aiResult.cvBullets,
  });

  return { jobApplication, outputs };
}

async function regenerateOutput({ userId, jobApplicationId, type }) {
  if (!aiOutputRepo.TYPE_MAP[type]) {
    throw new AppError("Invalid output type.", 400);
  }

  const jobApplication = await jobApplicationRepo.findById(
    jobApplicationId,
    userId,
  );
  if (!jobApplication) throw new AppError("Job application not found.", 404);
  if (!jobApplication.job_description) {
    throw new AppError(
      "This application has no job description to regenerate from.",
      400,
    );
  }

  const { profile } = await profileService.getProfile(userId);
  if (!profile || !profile.cv_text) {
    throw new AppError("Please upload your CV before regenerating.", 400);
  }

  const value = await groqService.generateSingleOutput({
    cvText: profile.cv_text,
    jobDescription: jobApplication.job_description,
    companyName: jobApplication.company_name,
    type,
  });

  const output = await aiOutputRepo.upsert(jobApplicationId, type, value);
  return output;
}

module.exports = { runFullAnalysis, regenerateOutput };
