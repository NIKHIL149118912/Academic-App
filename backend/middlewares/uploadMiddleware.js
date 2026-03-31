/**
 * Multer File Upload Configuration
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const dirs = ['uploads/notes', 'uploads/assignments', 'uploads/timetable', 'uploads/profiles'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const createStorage = (destination) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', destination));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const anyFileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('File type not supported'), false);
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

const uploadNotes = multer({
  storage: createStorage('uploads/notes'),
  fileFilter: anyFileFilter,
  limits: { fileSize: MAX_SIZE }
});

const uploadAssignment = multer({
  storage: createStorage('uploads/assignments'),
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_SIZE }
});

const uploadTimetable = multer({
  storage: createStorage('uploads/timetable'),
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_SIZE }
});

const uploadProfile = multer({
  storage: createStorage('uploads/profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = { uploadNotes, uploadAssignment, uploadTimetable, uploadProfile };
