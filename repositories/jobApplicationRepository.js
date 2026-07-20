// repositories/jobApplicationRepository.js
const db = require('../db');

async function create({ userId, role = null, companyName, jobTitle = null, jobDescription = null, jobLink = null, tag = null, stage = 'saved' }) {
  const result = await db.query(
    `INSERT INTO job_applications (user_id, role, company_name, job_title, job_description, job_link, tag, stage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, role, companyName, jobTitle, jobDescription, jobLink, tag, stage]
  );
  return result.rows[0];
}
async function findById(id, userId) {
  const result = await db.query(
    `SELECT * FROM job_applications WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
}

async function findAllByUser(userId) {
  const result = await db.query(
    `SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function update(id, userId, fields) {
  // fields = partial object, e.g. { stage: 'applied' } or { role, jobDescription }
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id, userId);

 const columnMap = {
  role: 'role',
  companyName: 'company_name',
  jobTitle: 'job_title',
  jobDescription: 'job_description',
  jobLink: 'job_link',
  tag: 'tag',
  stage: 'stage',
  interviewDate: 'interview_date'
};

  const setClauses = keys.map((key, i) => `${columnMap[key]} = $${i + 3}`);
  const values = keys.map((key) => fields[key]);

  const result = await db.query(
    `UPDATE job_applications
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, ...values]
  );
  return result.rows[0] || null;
}

async function remove(id, userId) {
  const result = await db.query(
    `DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rows[0] || null;
}

module.exports = { create, findById, findAllByUser, update, remove };