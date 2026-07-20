const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const trackerController = require('../controllers/trackerController');

router.post('/', authMiddleware, trackerController.create);
router.get('/', authMiddleware, trackerController.list);
router.get('/:id', authMiddleware, trackerController.getById);
router.patch('/:id', authMiddleware, trackerController.update);
router.delete('/:id', authMiddleware, trackerController.remove);

module.exports = router;