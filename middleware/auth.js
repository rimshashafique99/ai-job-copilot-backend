const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
  const token = req.cookies.accessToken; 

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;