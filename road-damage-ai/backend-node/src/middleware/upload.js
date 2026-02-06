const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create date-based subdirectory for better organization
    const dateFolder = new Date().toISOString().split('T')[0];
    const uploadPath = path.join(config.upload.dir, dateFolder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${uniqueId}${extension}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Geçersiz dosya türü. İzin verilen türler: ${config.upload.allowedMimeTypes.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Dosya çok büyük',
        message: `Maksimum dosya boyutu ${config.upload.maxFileSize / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      error: 'Yükleme hatası',
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      error: 'Yükleme başarısız',
      message: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
};
