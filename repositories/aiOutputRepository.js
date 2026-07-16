const db = require('../db');

const TYPE_MAP = {
  coverLetter: 'cover_letter',
  coldEmail: 'cold_email',
  gapAnalysis: 'gap_analysis',
  cvBullets: 'cv_bullets'
};
const VALID_TYPES = Object.values(TYPE_MAP);

async function upsert(jobApplicationId, key, value) {
  const dbType = TYPE_MAP[key];
  const content = typeof value === 'string' ? value : JSON.stringify(value);
  const result = await db.query(
    `INSERT INTO ai_outputs (application_id, type, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (application_id, type)
     DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
     RETURNING *`,
    [jobApplicationId, dbType, content]
  );
  return result.rows[0];
}

async function upsertMany(jobApplicationId, outputs) {
  const results = [];
  for (const key of Object.keys(TYPE_MAP)) {
    if (outputs[key] === undefined) continue;
    results.push(await upsert(jobApplicationId, key, outputs[key]));
  }
  return results;
}

async function findByJobApplication(jobApplicationId) {
  const result = await db.query(
    `SELECT * FROM ai_outputs WHERE application_id = $1`,
    [jobApplicationId]
  );
  return result.rows;
}

module.exports = { upsert, upsertMany, findByJobApplication, TYPE_MAP, VALID_TYPES };