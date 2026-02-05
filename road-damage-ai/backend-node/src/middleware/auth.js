const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to verify JWT token for protected routes
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again',
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed',
    });
  }
}

/**
 * Generate JWT token for authenticated user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: 'admin',
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

module.exports = {
  authenticateToken,
  generateToken,
};
