const pool = require('../db');

async function findByUserId(userId) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

// Builds UPDATE SQL dynamically from whichever fields were actually provided —
// so a summary-only save doesn't overwrite cv_text with undefined, and vice versa.
async function upsertProfile(userId, { cvText, cvFileUrl, cvFileName, cvPublicId, summary } = {}) {
  const existing = await findByUserId(userId);

  const fields = [];
  const values = [];
  let i = 1;

  if (cvText !== undefined) {
    fields.push(`cv_text = $${i++}`);
    values.push(cvText);
  }
  if (cvFileUrl !== undefined) {
    fields.push(`cv_file_url = $${i++}`);
    values.push(cvFileUrl);
  }
  if (cvFileName !== undefined) {
    fields.push(`cv_file_name = $${i++}`);
    values.push(cvFileName);
  }
  if (cvPublicId !== undefined) {
    fields.push(`cv_public_id = $${i++}`);
    values.push(cvPublicId);
  }
  if (summary !== undefined) {
    fields.push(`summary = $${i++}`);
    values.push(summary);
  }

  if (existing) {
    fields.push(`updated_at = NOW()`);
    values.push(userId);
    const result = await pool.query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE user_id = $${i} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  const columns = ['user_id'];
  const placeholders = ['$1'];
  const insertValues = [userId];
  let j = 2;

  if (cvText !== undefined) {
    columns.push('cv_text');
    placeholders.push(`$${j++}`);
    insertValues.push(cvText);
  }
  if (cvFileUrl !== undefined) {
    columns.push('cv_file_url');
    placeholders.push(`$${j++}`);
    insertValues.push(cvFileUrl);
  }
  if (cvFileName !== undefined) {
    columns.push('cv_file_name');
    placeholders.push(`$${j++}`);
    insertValues.push(cvFileName);
  }
  if (cvPublicId !== undefined) {
    columns.push('cv_public_id');
    placeholders.push(`$${j++}`);
    insertValues.push(cvPublicId);
  }
  if (summary !== undefined) {
    columns.push('summary');
    placeholders.push(`$${j++}`);
    insertValues.push(summary);
  }

  const result = await pool.query(
    `INSERT INTO profiles (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    insertValues
  );
  return result.rows[0];
}
module.exports = { findByUserId, upsertProfile };