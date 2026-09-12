const jobApplicationRepo = require("../repositories/jobApplicationRepository");
const aiOutputRepo = require("../repositories/aiOutputRepository");
const profileService = require("./profileService");
const groqService = require("./groqService");
const AppError = require("../utils/AppError");

// --- OLD (dead code, kept until SSE is confirmed working) ---
async function runFullAnalysis({ userId, companyName, jobDescription, jobApplicationId = null }) {
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
    jobApplication = await jobApplicationRepo.findById(jobApplicationId, userId);
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

  const jobApplication = await jobApplicationRepo.findById(jobApplicationId, userId);
  if (!jobApplication) throw new AppError("Job application not found.", 404);
  if (!jobApplication.job_description) {
    throw new AppError("This application has no job description to regenerate from.", 400);
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

// --- NEW: SSE streaming ---

// One output type, isolated so one failure doesn't kill the others
async function streamOneType({ type, cvText, jobDescription, companyName, jobApplicationId, emit }) {
  try {
    const content = await groqService.streamSingleOutput({
      cvText,
      jobDescription,
      companyName,
      type,
      onToken: (token) => emit("chunk", { type, token }),
    });

    const output = await aiOutputRepo.upsert(jobApplicationId, type, content);
    emit("done", { type, outputId: output.id });
  } catch (err) {
    console.error(`Stream error for ${type}:`, err);
    emit("error", { type, message: "Failed to generate this output." });
  }
}

async function streamFullAnalysis({ userId, companyName, role, jobDescription, jobApplicationId = null, emit }) {
  const { profile } = await profileService.getProfile(userId);
  if (!profile || !profile.cv_text) {
    throw new AppError("Please upload your CV before analyzing a job.", 400);
  }

  let jobApplication;
  if (jobApplicationId) {
    jobApplication = await jobApplicationRepo.findById(jobApplicationId, userId);
    if (!jobApplication) throw new AppError("Job application not found.", 404);

    jobApplication = await jobApplicationRepo.update(jobApplicationId, userId, {
      companyName,
      role,
      jobDescription,
    });
  } else {
    jobApplication = await jobApplicationRepo.create({
      userId,
      companyName,
      role,
      jobDescription,
      stage: "saved",
    });
  }

  emit("application_created", {
    id: jobApplication.id,
    companyName: jobApplication.company_name,
    role: jobApplication.role,
    jobDescription: jobApplication.job_description,
    stage: jobApplication.stage,
  });

  const types = Object.keys(aiOutputRepo.TYPE_MAP); // ['coverLetter','coldEmail','gapAnalysis','cvBullets']

  await Promise.all(
    types.map((type) =>
      streamOneType({
        type,
        cvText: profile.cv_text,
        jobDescription,
        companyName,
        jobApplicationId: jobApplication.id,
        emit,
      })
    )
  );

  emit("complete", { jobApplicationId: jobApplication.id });
}

async function streamRegenerateOutput({ userId, jobApplicationId, type, emit }) {
  if (!aiOutputRepo.TYPE_MAP[type]) {
    throw new AppError("Invalid output type.", 400);
  }

  const jobApplication = await jobApplicationRepo.findById(jobApplicationId, userId);
  if (!jobApplication) throw new AppError("Job application not found.", 404);
  if (!jobApplication.job_description) {
    throw new AppError("This application has no job description to regenerate from.", 400);
  }

  const { profile } = await profileService.getProfile(userId);
  if (!profile || !profile.cv_text) {
    throw new AppError("Please upload your CV before regenerating.", 400);
  }

  await streamOneType({
    type,
    cvText: profile.cv_text,
    jobDescription: jobApplication.job_description,
    companyName: jobApplication.company_name,
    jobApplicationId: jobApplication.id,
    emit,
  });

  emit("complete", { jobApplicationId: jobApplication.id });
}

module.exports = {
  runFullAnalysis,
  regenerateOutput,
  streamFullAnalysis,
  streamRegenerateOutput,
};