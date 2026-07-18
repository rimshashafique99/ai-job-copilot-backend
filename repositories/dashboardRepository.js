const db = require('../db');

async function getStats(userId) {
  const totalResult = await db.query(
    `SELECT COUNT(*) FROM job_applications WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(totalResult.rows[0].count, 10);

  const thisMonthResult = await db.query(
    `SELECT COUNT(*) FROM job_applications
     WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const thisMonth = parseInt(thisMonthResult.rows[0].count, 10);

  const lastMonthResult = await db.query(
    `SELECT COUNT(*) FROM job_applications
     WHERE user_id = $1
       AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
       AND created_at < date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const lastMonth = parseInt(lastMonthResult.rows[0].count, 10);

  const growthPercent =
    lastMonth === 0 ? null : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const interviewingResult = await db.query(
    `SELECT COUNT(*) FROM job_applications WHERE user_id = $1 AND stage = 'interviewing'`,
    [userId]
  );
  const interviewingCount = parseInt(interviewingResult.rows[0].count, 10);

 const scheduledThisWeekResult = await db.query(
  `SELECT COUNT(*) FROM job_applications
   WHERE user_id = $1 AND stage = 'interviewing'
     AND interview_date >= CURRENT_DATE
     AND interview_date < CURRENT_DATE + INTERVAL '7 days'`,
  [userId]
);
  const scheduledThisWeek = parseInt(scheduledThisWeekResult.rows[0].count, 10);

  const offersResult = await db.query(
    `SELECT COUNT(*) FROM job_applications WHERE user_id = $1 AND stage = 'offer'`,
    [userId]
  );
  const offersCount = parseInt(offersResult.rows[0].count, 10);

  const recentResult = await db.query(
    `SELECT id, company_name, role, created_at, stage
     FROM job_applications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId]
  );

  return {
    totalApplications: total,
    totalApplicationsGrowthPercent: growthPercent,
    interviewing: { count: interviewingCount, scheduledThisWeek },
    offers: { count: offersCount },
    recentApplications: recentResult.rows
  };
}

module.exports = { getStats };