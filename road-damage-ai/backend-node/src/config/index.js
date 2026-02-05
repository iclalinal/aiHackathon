require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || './data/road_damage.db',
  },

  // AI Service
  aiService: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000/analyze',
  },

  // Upload
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
