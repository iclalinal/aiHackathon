const express = require('express');
const router = express.Router();
const path = require('path');
const reportService = require('../services/report.service');
const { upload, handleUploadError } = require('../middleware/upload');
const { validateReportSubmission } = require('../middleware/validate');

/**
 * POST /api/reports
 * Submit a new damage report (citizen endpoint - no auth required)
 */
router.post(
  '/',
  upload.single('image'),
  handleUploadError,
  validateReportSubmission,
  async (req, res) => {
    try {
      const { latitude, longitude, description, reporterContact } = req.body;

      // Get relative image path for storage
      const imagePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');

      const result = await reportService.createReport({
        imagePath,
        latitude,
        longitude,
        description,
        reporterContact,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Create report error:', error);
      res.status(500).json({
        error: 'Rapor oluşturulamadı',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/reports/:id
 * Get a specific report by ID (public endpoint for status checking)
 */
router.get('/:id', (req, res) => {
  try {
    const report = reportService.getReportById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Rapor bulunamadı',
      });
    }

    // Return limited info for public access
    res.json({
      id: report.id,
      status: report.status,
      damage_type: report.damage_type,
      severity: report.severity,
      estimated_cost: report.estimated_cost,
      created_at: report.created_at,
      analyzed_at: report.analyzed_at,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      error: 'Rapor alınamadı',
    });
  }
});

/**
 * GET /api/reports/:id/status
 * Get just the status of a report (for polling)
 */
router.get('/:id/status', (req, res) => {
  try {
    const report = reportService.getReportById(req.params.id);

    if (!report) {
      return res.status(404).json({
        error: 'Rapor bulunamadı',
      });
    }

    res.json({
      id: report.id,
      status: report.status,
      damage_type: report.damage_type,
      severity: report.severity,
      estimated_cost: report.estimated_cost,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'Durum alınamadı',
    });
  }
});

/**
 * GET /api/reports/map/markers
 * Get reports for map display (public endpoint with limited data)
 */
router.get('/map/markers', (req, res) => {
  try {
    let bounds = null;

    // Parse bounds if provided
    if (req.query.minLat && req.query.maxLat && req.query.minLng && req.query.maxLng) {
      bounds = {
        minLat: parseFloat(req.query.minLat),
        maxLat: parseFloat(req.query.maxLat),
        minLng: parseFloat(req.query.minLng),
        maxLng: parseFloat(req.query.maxLng),
      };
    }

    const reports = reportService.getMapReports(bounds);

    res.json({
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error('Get map reports error:', error);
    res.status(500).json({
      error: 'Harita raporları alınamadı',
    });
  }
});

module.exports = router;
