const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const analyzeController = require('../controllers/analyzeController');

router.post('/', authMiddleware, analyzeController.analyze);
router.post('/:id/regenerate', authMiddleware, analyzeController.regenerate);

module.exports = router;