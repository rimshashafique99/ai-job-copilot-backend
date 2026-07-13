const pool = require('../db');

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, email, full_name, target_role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createUser({ email, passwordHash, fullName, targetRole }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, target_role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, full_name, target_role, created_at`,
    [email, passwordHash, fullName, targetRole || null]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };