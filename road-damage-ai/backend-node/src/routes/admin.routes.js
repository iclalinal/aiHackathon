const express = require('express');
const router = express.Router();
const reportService = require('../services/report.service');
const { authenticateToken } = require('../middleware/auth');
const { validateStatusUpdate } = require('../middleware/validate');

// All admin routes require authentication
router.use(authenticateToken);

/**
 * GET /api/admin/reports
 * Get all reports with full details (admin only)
 */
router.get('/reports', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      damageType: req.query.damageType,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null,
    };

    // Parse bounds for map filter
    if (req.query.minLat && req.query.maxLat && req.query.minLng && req.query.maxLng) {
      filters.bounds = {
        minLat: parseFloat(req.query.minLat),
        maxLat: parseFloat(req.query.maxLat),
        minLng: parseFloat(req.query.minLng),
        maxLng: parseFloat(req.query.maxLng),
      };
    }

    const reports = reportService.getReports(filters);

    res.json({
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({
      error: 'Failed to get reports',
    });
  }
});

/**
 * GET /api/admin/reports/grouped
 * Get reports grouped by location (within 2 meter radius)
 */
router.get('/reports-grouped', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      severity: req.query.severity,
      damageType: req.query.damageType,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const radius = req.query.radius ? parseFloat(req.query.radius) : 2;
    const groups = reportService.getGroupedReports(filters, radius);

    res.json({
      count: groups.length,
      totalReports: groups.reduce((sum, g) => sum + g.reportCount, 0),
      data: groups,
    });
  } catch (error) {
    console.error('Get grouped reports error:', error);
    res.status(500).json({
      error: 'Failed to get grouped reports',
    });
  }
});

/**
 * GET /api/admin/reports/:id
 * Get single report with full details (admin only)
 */
router.get('/reports/:id', (req, res) => {
  try {
    const report = reportService.getReportById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    res.json({
      data: report,
    });
  } catch (error) {
    console.error('Get admin report error:', error);
    res.status(500).json({
      error: 'Failed to get report',
    });
  }
});

/**
 * PATCH /api/admin/reports/:id/status
 * Update report status (admin only)
 */
router.patch('/reports/:id/status', validateStatusUpdate, (req, res) => {
  try {
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const updatedReport = reportService.updateReportStatus(
      req.params.id,
      status,
      adminId,
      notes
    );

    if (!updatedReport) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      message: `Report status updated to "${status}"`,
      data: updatedReport,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      error: 'Failed to update status',
    });
  }
});

/**
 * POST /api/admin/reports/:id/repair
 * Mark report as repaired (convenience endpoint)
 */
router.post('/reports/:id/repair', (req, res) => {
  try {
    const { notes } = req.body;
    const adminId = req.user.id;

    const updatedReport = reportService.updateReportStatus(
      req.params.id,
      'repaired',
      adminId,
      notes
    );

    if (!updatedReport) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    res.json({
      success: true,
      message: 'Report marked as repaired',
      data: updatedReport,
    });
  } catch (error) {
    console.error('Mark repaired error:', error);
    res.status(500).json({
      error: 'Failed to mark as repaired',
    });
  }
});

/**
 * GET /api/admin/statistics
 * Get dashboard statistics (admin only)
 */
router.get('/statistics', (req, res) => {
  try {
    const stats = reportService.getStatistics();

    res.json({
      data: stats,
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
    });
  }
});

/**
 * GET /api/admin/map
 * Get all reports for admin map view with full details
 */
router.get('/map', (req, res) => {
  try {
    let bounds = null;

    if (req.query.minLat && req.query.maxLat && req.query.minLng && req.query.maxLng) {
      bounds = {
        minLat: parseFloat(req.query.minLat),
        maxLat: parseFloat(req.query.maxLat),
        minLng: parseFloat(req.query.minLng),
        maxLng: parseFloat(req.query.maxLng),
      };
    }

    const reports = reportService.getReports({
      bounds,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    res.json({
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Get admin map error:', error);
    res.status(500).json({
      error: 'Failed to get map data',
    });
  }
});

module.exports = router;
