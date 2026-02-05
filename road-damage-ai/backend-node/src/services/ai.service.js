const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * AI Service for image analysis
 */
class AIService {
  /**
   * Send image to AI service for analysis
   * @param {string} imagePath - Path to the image file
   * @param {string} reportId - Report ID for reference
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(imagePath, reportId) {
    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.join(process.cwd(), imagePath);

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', fs.createReadStream(absolutePath));
      formData.append('report_id', reportId);

      // Send to AI service
      const response = await axios.post(config.aiService.url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout for AI processing
      });

      return {
        success: true,
        data: {
          damage_type: response.data.damage_type,
          severity: response.data.severity,
          estimated_cost: response.data.estimated_cost,
          confidence: response.data.confidence,
          raw_response: response.data,
        },
      };
    } catch (error) {
      console.error('AI Service Error:', error.message);

      // Return mock data for development if AI service is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Using mock AI response (development mode)');
        return this.getMockAnalysis();
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate mock analysis for development/testing
   */
  getMockAnalysis() {
    const damageTypes = ['pothole', 'crack', 'rutting', 'patching', 'erosion'];
    const severities = ['low', 'medium', 'high'];

    const damageType = damageTypes[Math.floor(Math.random() * damageTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    // Estimate cost based on severity
    const baseCosts = { low: 500, medium: 1500, high: 3500 };
    const estimatedCost = baseCosts[severity] + Math.floor(Math.random() * 500);

    return {
      success: true,
      data: {
        damage_type: damageType,
        severity: severity,
        estimated_cost: estimatedCost,
        confidence: 0.75 + Math.random() * 0.2,
        is_mock: true,
      },
    };
  }
}

module.exports = new AIService();
