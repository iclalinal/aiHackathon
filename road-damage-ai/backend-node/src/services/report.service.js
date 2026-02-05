const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const aiService = require('./ai.service');

/**
 * Report Service - handles all report-related business logic
 */
class ReportService {
  /**
   * Create a new damage report
   */
  async createReport(data) {
    const { imagePath, latitude, longitude, description, reporterContact } = data;

    const reportId = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO damage_reports (id, image_path, latitude, longitude, status, description, reporter_contact)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `);

    stmt.run(reportId, imagePath, latitude, longitude, description || null, reporterContact || null);

    // Trigger async AI analysis
    this.triggerAnalysis(reportId, imagePath);

    return {
      id: reportId,
      status: 'pending',
      message: 'Report submitted successfully. Analysis in progress.',
    };
  }

  /**
   * Trigger AI analysis (async, non-blocking)
   */
  async triggerAnalysis(reportId, imagePath) {
    try {
      // Update status to analyzing
      db.prepare('UPDATE damage_reports SET status = ? WHERE id = ?').run('analyzing', reportId);

      // Call AI service
      const result = await aiService.analyzeImage(imagePath, reportId);

      if (result.success) {
        // Update report with analysis results
        const updateStmt = db.prepare(`
          UPDATE damage_reports 
          SET status = 'analyzed',
              damage_type = ?,
              severity = ?,
              estimated_cost = ?,
              analyzed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        updateStmt.run(
          result.data.damage_type,
          result.data.severity,
          result.data.estimated_cost,
          reportId
        );

        console.log(`✅ Report ${reportId} analyzed:`, result.data);
      } else {
        // Mark as failed/pending for retry
        db.prepare('UPDATE damage_reports SET status = ? WHERE id = ?').run('pending', reportId);
        console.error(`❌ Analysis failed for report ${reportId}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Analysis error for report ${reportId}:`, error);
      db.prepare('UPDATE damage_reports SET status = ? WHERE id = ?').run('pending', reportId);
    }
  }

  /**
   * Get report by ID
   */
  getReportById(reportId) {
    const stmt = db.prepare('SELECT * FROM damage_reports WHERE id = ?');
    return stmt.get(reportId);
  }

  /**
   * Get all reports with optional filters
   */
  getReports(filters = {}) {
    let query = 'SELECT * FROM damage_reports WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters.damageType) {
      query += ' AND damage_type = ?';
      params.push(filters.damageType);
    }

    // Bounding box filter for map view
    if (filters.bounds) {
      const { minLat, maxLat, minLng, maxLng } = filters.bounds;
      query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
      params.push(minLat, maxLat, minLng, maxLng);
    }

    // Sorting
    const sortField = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get reports for map view (optimized)
   * Excludes 'rejected' and 'repaired' reports from public view
   */
  getMapReports(bounds = null) {
    let query = `
      SELECT id, latitude, longitude, status, damage_type, severity, created_at
      FROM damage_reports
      WHERE status NOT IN ('rejected', 'repaired')
    `;
    const params = [];

    if (bounds) {
      query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
      params.push(bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Update report status
   */
  updateReportStatus(reportId, status, adminId = null, notes = null) {
    const report = this.getReportById(reportId);
    if (!report) {
      return null;
    }

    if (status === 'repaired') {
      const stmt = db.prepare(`
        UPDATE damage_reports 
        SET status = ?, repaired_by = ?, repaired_at = CURRENT_TIMESTAMP, repair_notes = ?
        WHERE id = ?
      `);
      stmt.run(status, adminId, notes, reportId);
    } else {
      const stmt = db.prepare('UPDATE damage_reports SET status = ? WHERE id = ?');
      stmt.run(status, reportId);
    }

    return this.getReportById(reportId);
  }

  /**
   * Get statistics for dashboard
   */
  getStatistics() {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'analyzing' THEN 1 ELSE 0 END) as analyzing,
        SUM(CASE WHEN status = 'analyzed' THEN 1 ELSE 0 END) as analyzed,
        SUM(CASE WHEN status = 'repaired' THEN 1 ELSE 0 END) as repaired,
        SUM(CASE WHEN severity = 'high' AND status != 'repaired' THEN 1 ELSE 0 END) as high_priority,
        AVG(estimated_cost) as avg_cost,
        SUM(estimated_cost) as total_estimated_cost
      FROM damage_reports
    `).get();

    const bySeverity = db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM damage_reports
      WHERE severity IS NOT NULL
      GROUP BY severity
    `).all();

    const byDamageType = db.prepare(`
      SELECT damage_type, COUNT(*) as count
      FROM damage_reports
      WHERE damage_type IS NOT NULL
      GROUP BY damage_type
    `).all();

    return {
      ...stats,
      bySeverity,
      byDamageType,
    };
  }
}

module.exports = new ReportService();
