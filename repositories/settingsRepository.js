const pool = require("../db");

async function findUserById(userId) {
  const result = await pool.query(
    `SELECT id, email, full_name, auth_provider, password_hash,
            email_notifications, ai_insights
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] || null;
}

async function findSettingsById(userId) {
  return findUserById(userId);
}

async function findByEmailExcludingUser(email, userId) {
  const result = await pool.query(
    "SELECT id, email FROM users WHERE email = $1 AND id <> $2 LIMIT 1",
    [email, userId],
  );
  return result.rows[0] || null;
}

async function updateAccountInfo(userId, { fullName, email }) {
  const result = await pool.query(
    `UPDATE users SET full_name = $1, email = $2 WHERE id = $3
     RETURNING id, email, full_name`,
    [fullName, email, userId],
  );
  return result.rows[0];
}

async function updatePasswordHash(userId, passwordHash) {
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    userId,
  ]);
}

async function updatePreferences(userId, { emailNotifications, aiInsights }) {
  const result = await pool.query(
    `UPDATE users SET email_notifications = $1, ai_insights = $2 WHERE id = $3
     RETURNING email_notifications, ai_insights`,
    [emailNotifications, aiInsights, userId],
  );
  return result.rows[0];
}

async function deleteUser(userId) {
  // profiles, job_applications, ai_outputs all cascade via ON DELETE CASCADE
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
}

module.exports = {
  findUserById,
  findSettingsById,
  findByEmailExcludingUser,
  updateAccountInfo,
  updatePasswordHash,
  updatePreferences,
  deleteUser,
};
