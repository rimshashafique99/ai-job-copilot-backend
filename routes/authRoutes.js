const express = require('express');
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/google', authController.googleLogin);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;