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
async function findByGoogleId(googleId) {
  const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0] || null;
}

async function createGoogleUser({ email, fullName, googleId }) {
  const result = await pool.query(
    `INSERT INTO users (email, full_name, google_id, auth_provider)
     VALUES ($1, $2, $3, 'google')
     RETURNING id, email, full_name, target_role, created_at`,
    [email, fullName, googleId]
  );
  return result.rows[0];
}
async function updateUser(userId, { fullName, targetRole }) {
  const result = await pool.query(
    `UPDATE users SET full_name = $1, target_role = $2 WHERE id = $3
     RETURNING id, email, full_name, target_role, created_at`,
    [fullName, targetRole, userId]
  );
  return result.rows[0];
}
async function setOtp(userId, otpCode, otpExpiresAt) {
  await pool.query(
    'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
    [otpCode, otpExpiresAt, userId]
  );
}

async function verifyOtpAndActivate(userId) {
  const result = await pool.query(
    `UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL
     WHERE id = $1 RETURNING id, email, full_name, target_role, created_at`,
    [userId]
  );
  return result.rows[0];
}
async function updateUnverifiedUser(userId, { passwordHash, fullName, targetRole }) {
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, full_name = $2, target_role = $3
     WHERE id = $4 AND is_verified = false
     RETURNING id, email, full_name, target_role, created_at`,
    [passwordHash, fullName, targetRole || null, userId]
  );
  return result.rows[0];
}



module.exports = { findByEmail, findById, createUser, findByGoogleId, createGoogleUser, updateUser, setOtp, verifyOtpAndActivate, updateUnverifiedUser };