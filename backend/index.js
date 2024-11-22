const express = require('express');
const multer = require('multer');
const path = require('path');
const { PythonShell } = require('python-shell');
const cors = require('cors');
const chalk = require('chalk');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: 'https://ocr-iota-one.vercel.app', 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };
  
app.use(cors(corsOptions));

app.use((req, res, next) => {
    console.log(chalk.blue(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`));
    next();
});



// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
  }
});

app.use(express.json());

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir);
}

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process each uploaded file
    const processingResults = await Promise.all(req.files.map(async (file) => {
      return new Promise((resolve, reject) => {
        // Use Python-Shell to run OCR processing script
        PythonShell.run('ocr_processing.py', {
          mode: 'json',
          args: [file.path]
        }, (err, results) => {
          if (err) {
            console.error('OCR Processing Error:', err);
            resolve({
              fileName: file.originalname,
              documentType: path.extname(file.originalname).slice(1).toUpperCase(),
              confidence: 0,
              entities: [],
              suggestions: ['Processing failed']
            });
          } else {
            resolve({
              fileName: file.originalname,
              documentType: path.extname(file.originalname).slice(1).toUpperCase(),
              confidence: results[0]?.confidence || 0.8,
              entities: results[0]?.entities || [],
              suggestions: results[0]?.suggestions || []
            });
          }
        });
      });
    }));

    res.json(processingResults);
  } catch (error) {
    console.error('Processing Error:', error);
    res.status(500).json({ 
      error: 'Document processing failed', 
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Add error handling for PythonShell
PythonShell.run('ocr_processing.py', {
    mode: 'json',
    pythonPath: 'python3',  // Specify full path if needed
    args: [file.path]
  }, (err, results) => {
    if (err) {
      console.error('Detailed Python Shell Error:', err);
      // More detailed error logging
    }
});

// Startup logging
const startServer = () => {
    console.log(chalk.green('================================='));
    console.log(chalk.green('🚀 Server Started Successfully'));
    console.log(chalk.yellow(`📍 PORT: ${PORT}`));
    console.log(chalk.blue(`📅 Started at: ${new Date().toLocaleString()}`));
    console.log(chalk.green('================================='));
};
  
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
});
  
app.listen(PORT, () => {
    startServer();
});

module.exports = app;