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
        error: 'Kimlik doğrulama başarısız',
        message: 'Geçersiz kullanıcı adı veya şifre',
      });
    }

    // Validate password
    const isValid = await adminService.validatePassword(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Kimlik doğrulama başarısız',
        message: 'Geçersiz kullanıcı adı veya şifre',
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
      error: 'Giriş başarısız',
      message: 'Giriş sırasında bir hata oluştu',
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
        error: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      user: admin,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Kullanıcı bilgisi alınamadı',
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
        error: 'Doğrulama başarısız',
        message: 'Mevcut şifre ve yeni şifre gereklidir',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Doğrulama başarısız',
        message: 'Yeni şifre en az 8 karakter olmalıdır',
      });
    }

    await adminService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      error: 'Şifre değiştirme başarısız',
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
    message: 'Başarıyla çıkış yapıldı',
  });
});

module.exports = router;
