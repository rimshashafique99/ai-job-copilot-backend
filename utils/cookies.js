const isProd = process.env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,           // only over HTTPS in production; false locally so it works on http://localhost
  sameSite: isProd ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000,    // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res) {
  res.clearCookie('accessToken', accessCookieOptions);
  res.clearCookie('refreshToken', refreshCookieOptions);
}

module.exports = { setAuthCookies, clearAuthCookies };