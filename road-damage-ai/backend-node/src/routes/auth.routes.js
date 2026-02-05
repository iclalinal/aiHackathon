const express = require('express');
const router = express.Router();
const adminService = require('../services/admin.service');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');

/**
 * POST /api/auth/login
 * Admin login endpoint
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = adminService.findByUsername(username);

    if (!admin) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    // Validate password
    const isValid = await adminService.validatePassword(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    // Update last login
    adminService.updateLastLogin(admin.id);

    // Generate JWT token
    const token = generateToken(admin);

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const admin = adminService.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      user: admin,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password for authenticated admin
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'New password must be at least 8 characters',
      });
    }

    await adminService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      error: 'Password change failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server acknowledgment)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // This endpoint is for acknowledgment and potential token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
