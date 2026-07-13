const authService = require('../services/authService');

async function signup(req, res, next) {
  try {
    const { email, password, fullName, targetRole } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, error: 'email, password, and fullName are required' });
    }
    const result = await authService.signup({ email, password, fullName, targetRole });
    res.status(201).json({ success: true, data: result });
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
    const result = await authService.login({ email, password });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }
    const accessToken = authService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh };