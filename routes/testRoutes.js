// in your routes file (e.g. routes/testRoutes.js), gated at registration time
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/otp/:email', testController.getOtp);

module.exports = router;