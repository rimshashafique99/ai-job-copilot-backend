const authService = require('../services/authService');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

async function signup(req, res, next) {
  try {
    const { email, password, fullName, targetRole } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'email, password, and fullName are required' });
    }
    const { email: pendingEmail } = await authService.signup({ email, password, fullName, targetRole });
    res.status(201).json({ success: true, data: { email: pendingEmail } });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'email and otp are required' });
    }
    const { user, accessToken, refreshToken } = await authService.verifyOtp({ email, otp });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });
    await authService.resendOtp(email);
    res.json({ success: true, message: 'Verification code resent' });
  } catch (err) {
    next(err);
  }
}



async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }
    const { user, accessToken, refreshToken } = await authService.login({ email, password });
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required' });
    }
    const { user, accessToken, refreshToken } = await authService.loginWithGoogle(idToken);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken; // read from cookie, not body
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token' });
    }
    const accessToken = authService.refreshAccessToken(refreshToken);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });
    await authService.forgotPassword(email);
    res.json({ success: true, message: 'If an account exists for this email, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'email and otp are required' });
    }
    const { resetToken } = await authService.verifyResetOtp({ email, otp });
    res.json({ success: true, data: { resetToken } });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, resetToken, password } = req.body;
    if (!email || !resetToken || !password) {
      return res.status(400).json({ success: false, error: 'email, resetToken, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    await authService.resetPassword({ email, resetToken, password });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}



async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ success: true });
}

async function me(req, res, next) {
  try {
    const userRepository = require('../repositories/userRepository');
    const user = await userRepository.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, googleLogin, logout, me, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword };