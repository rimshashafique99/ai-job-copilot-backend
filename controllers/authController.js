const authService = require('../services/authService');
const { setAuthCookies, clearAuthCookies } = require('../utils/cookies');

async function signup(req, res, next) {
  try {
    const { email, password, fullName, targetRole } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'email, password, and fullName are required' });
    }
    const { user, accessToken, refreshToken } = await authService.signup({ email, password, fullName, targetRole });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ success: true, data: { user } }); // tokens no longer in the body
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

module.exports = { signup, login, refresh, googleLogin, logout, me };