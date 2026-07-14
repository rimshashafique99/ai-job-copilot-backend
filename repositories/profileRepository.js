const pool = require('../db');

async function findByUserId(userId) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

async function upsertProfile(userId, { cvText }) {
  const existing = await findByUserId(userId);

  if (existing) {
    const result = await pool.query(
      `UPDATE profiles SET cv_text = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
      [cvText, userId]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO profiles (user_id, cv_text) VALUES ($1, $2) RETURNING *`,
    [userId, cvText]
  );
  return result.rows[0];
}

module.exports = { findByUserId, upsertProfile };