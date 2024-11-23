import express from 'express';
import multer from 'multer';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import tesseract from 'node-tesseract-ocr';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and validate environment variables
const requiredEnvVars = ['PORT', 'GEMINI_API_KEY', 'UPLOADS_DIR'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(chalk.red(`Missing required environment variable: ${varName}`));
    process.exit(1);
  }
});

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || '.pdf,.png,.jpg,.jpeg').split(',');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/upload', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://ocr-iota-one.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      chalk.blue(`[${new Date().toLocaleString()}] ${req.method} ${req.path}`),
      chalk.yellow(`${res.statusCode}`),
      chalk.green(`${duration}ms`)
    );
  });
  next();
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer configuration with improved error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_FILE_TYPES.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Maximum number of files per request
  },
  fileFilter
});

// OCR Configuration
const ocrConfig = {
  lang: 'eng',
  oem: 3,
  psm: 3,
  dpi: 300,
  skip_diagnostics: false,
  debug_file: '/tmp/tesseract.log'
};

// Enhanced text extraction with better error handling
const extractTextFromFile = async (filePath) => {
  try {
    const text = await tesseract.recognize(filePath, ocrConfig);
    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from image');
    }
    return text.trim();
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

// Enhanced text summarization with retry logic
const summarizeText = async (text, retries = 3) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        Analyze and summarize the following document text. Provide:
        1. A concise summary (2-3 sentences)
        2. Key points and important information
        3. Any action items or next steps
        4. Document classification/type
        
        Text: ${text}
      `;
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      attempt++;
      if (attempt === retries) {
        throw new Error(`Summarization failed after ${retries} attempts: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
};

// Enhanced image analysis with better error handling
const analyzeImage = async (filePath) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageBuffer = await fs.promises.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    if (!base64Image) {
      throw new Error('Failed to convert image to base64');
    }

    const prompt = `
      Analyze this image and provide:
      1. Description of visual content
      2. Any visible text
      3. Document type/classification
      4. Image quality assessment
      5. Any notable details or potential issues
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: `image/${path.extname(filePath).slice(1)}`,
          data: base64Image
        }
      }
    ]);

    return result.response.text();
  } catch (error) {
    console.error('Image Analysis Error:', error);
    throw new Error(`Image analysis failed: ${error.message}`);
  }
};

// Enhanced upload route with better error handling and cleanup
app.post('/upload', upload.array('files'), async (req, res) => {
  const uploadedFiles = [];
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processingResults = await Promise.all(req.files.map(async (file) => {
      uploadedFiles.push(file.path);
      try {
        const extractedText = await extractTextFromFile(file.path);
        const textSummary = await summarizeText(extractedText);
        
        let imageDescription = null;
        const imageExtensions = ['.png', '.jpg', '.jpeg'];
        if (imageExtensions.includes(path.extname(file.originalname).toLowerCase())) {
          imageDescription = await analyzeImage(file.path);
        }

        return {
          fileName: file.originalname,
          documentType: path.extname(file.originalname).slice(1).toUpperCase(),
          extractedText,
          textSummary,
          imageDescription,
          confidence: 0.85,
          metadata: {
            processedAt: new Date().toISOString(),
            fileSize: file.size,
            mimeType: file.mimetype
          }
        };
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        return {
          fileName: file.originalname,
          error: error.message,
          status: 'failed'
        };
      }
    }));

    res.json(processingResults);
  } catch (error) {
    console.error('Processing Error:', error);
    res.status(500).json({
      error: 'Document processing failed',
      details: error.message
    });
  } finally {
    // Cleanup uploaded files
    uploadedFiles.forEach(filePath => {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting file ${filePath}:`, err);
      });
    });
  }
});

// Health check endpoint with enhanced monitoring
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(chalk.red('Error:'), err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  console.log(chalk.green('================================='));
  console.log(chalk.green('🚀 Server Started Successfully'));
  console.log(chalk.yellow(`📍 PORT: ${PORT}`));
  console.log(chalk.blue(`📅 Started at: ${new Date().toLocaleString()}`));
  console.log(chalk.green('================================='));
});

export default app;