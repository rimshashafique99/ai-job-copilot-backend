const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.patch('/account', settingsController.updateAccount);
router.patch('/password', settingsController.updatePassword);
router.patch('/preferences', settingsController.updatePreferences);
router.delete('/account', settingsController.deleteAccount);

module.exports = router;

// In server.js:
// const settingsRoutes = require('./routes/settings.routes');
// app.use('/api/settings', settingsRoutes);