const dashboardService = require('../services/dashboardService');

async function getDashboard(req, res, next) {
  try {
    const stats = await dashboardService.getDashboard(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };