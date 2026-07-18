const dashboardRepo = require('../repositories/dashboardRepository');

async function getDashboard(userId) {
  return dashboardRepo.getStats(userId);
}

module.exports = { getDashboard };