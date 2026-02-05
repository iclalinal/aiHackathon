const db = require('../database/db');
const bcrypt = require('bcryptjs');

/**
 * Admin Service - handles admin-related business logic
 */
class AdminService {
  /**
   * Find admin by username
   */
  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM administrators WHERE username = ?');
    return stmt.get(username);
  }

  /**
   * Find admin by ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT id, username, full_name, email, created_at, last_login FROM administrators WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Validate password
   */
  async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(adminId) {
    const stmt = db.prepare('UPDATE administrators SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(adminId);
  }

  /**
   * Create new admin (for future use)
   */
  async createAdmin(data) {
    const { username, password, fullName, email } = data;

    // Check if username exists
    const existing = this.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO administrators (username, password_hash, full_name, email)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, passwordHash, fullName, email);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Change password
   */
  async changePassword(adminId, currentPassword, newPassword) {
    const admin = db.prepare('SELECT * FROM administrators WHERE id = ?').get(adminId);

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isValid = await this.validatePassword(currentPassword, admin.password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE administrators SET password_hash = ? WHERE id = ?').run(newHash, adminId);

    return true;
  }

  /**
   * Get all admins (for super admin)
   */
  getAllAdmins() {
    const stmt = db.prepare('SELECT id, username, full_name, email, created_at, last_login FROM administrators');
    return stmt.all();
  }
}

module.exports = new AdminService();
