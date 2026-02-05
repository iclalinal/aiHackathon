/**
 * Validation middleware for request data
 */

/**
 * Validate report submission
 */
function validateReportSubmission(req, res, next) {
  const { latitude, longitude } = req.body;

  const errors = [];

  // Validate latitude
  const lat = parseFloat(latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Invalid latitude. Must be between -90 and 90.');
  }

  // Validate longitude
  const lng = parseFloat(longitude);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Invalid longitude. Must be between -180 and 180.');
  }

  // Check if file was uploaded
  if (!req.file) {
    errors.push('Image file is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors,
    });
  }

  // Normalize values
  req.body.latitude = lat;
  req.body.longitude = lng;

  next();
}

/**
 * Validate login credentials
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body;

  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    errors.push('Username is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors,
    });
  }

  req.body.username = username.trim().toLowerCase();

  next();
}

/**
 * Validate report status update
 */
function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  const validStatuses = ['pending', 'analyzing', 'analyzed', 'repaired', 'rejected'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  next();
}

module.exports = {
  validateReportSubmission,
  validateLogin,
  validateStatusUpdate,
};
