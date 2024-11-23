import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import LlamaAI from 'llamaai';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize LlamaAI with the API token
const apiToken = 'LA-bb30967fec6e4e928f6517e43925af3f33c745a93611429f8d5d3596018c8ea9';
const llamaAPI = new LlamaAI(apiToken);

// Constants
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
    cb(new Error(`File type '${ext}' is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

// Run OCR process
const runOCR = async (filePath, retries = MAX_RETRIES) => {
  const executeOCR = () => {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['ocr.py', filePath]);
      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => result += data.toString());
      pythonProcess.stderr.on('data', (data) => error += data.toString());

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`OCR process failed with code ${code}: ${error}`));
          return;
        }
        try {
          const ocrResult = JSON.parse(result);
          if (ocrResult.status === 'error') {
            reject(new Error(ocrResult.error));
            return;
          }
          resolve(ocrResult);
        } catch (e) {
          reject(new Error(`Failed to parse OCR results: ${e.message}`));
        }
      });
    });
  };

  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await executeOCR();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Function to get summary using LlamaAI
async function getSummary(text, imageContent) {
  const prompt = `Please provide a concise summary of the following document. Include key points and any notable information.

  Extracted Text: ${text}

  Image Content Description: ${imageContent}

  Please format the summary in a clear, readable way.`;

  const exponentialBackoff = async (fn, retries) => {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }
        const delay = Math.pow(2, attempt) * RETRY_DELAY;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  };

  try {
    return await exponentialBackoff(async () => {
      const apiRequestJson = {
        messages: [
          { role: "user", content: prompt }
        ],
        functions: [
          {
            name: "get_summary", // Ensure you have the correct function name in LlamaAI
            description: "Get a summary of the document.",
            parameters: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Extracted text to summarize"
                },
                imageContent: {
                  type: "string",
                  description: "Description of the image content"
                }
              }
            },
            required: ["text", "imageContent"],
          }
        ],
        stream: false,
        function_call: "get_summary", // Ensure the function name matches your LlamaAI setup
      };

      const llamaResponse = await llamaAPI.run(apiRequestJson);
      return llamaResponse.summary || llamaResponse;
    }, MAX_RETRIES);
  } catch (error) {
    console.error('Error with LlamaAI API:', error);
    return {
      summary: "Summary generation is currently unavailable due to API limits and fallback failure. Here's the extracted text:",
      extracted_text: text,
      error: "All fallback APIs failed"
    };
  }
}

// File upload route
app.post('/upload', upload.array('files'), async (req, res) => {
  const uploadedFiles = [];
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processingResults = await Promise.all(req.files.map(async (file) => {
      uploadedFiles.push(file.path);
      try {
        const ocrResult = await runOCR(file.path);
        const summaryResult = await getSummary(
          ocrResult.extracted_text,
          `This is a ${path.extname(file.originalname).slice(1).toUpperCase()} document with ${ocrResult.word_count} words and ${ocrResult.character_count} characters.`
        );

        return {
          fileName: file.originalname,
          documentType: path.extname(file.originalname).slice(1).toUpperCase(),
          extractedText: ocrResult.extracted_text,
          summary: summaryResult.summary || summaryResult
        };
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        return {
          fileName: file.originalname,
          error: error.message
        };
      }
    }));

    res.json({ files: processingResults });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: 'An error occurred while processing the files' });
  } finally {
    // Cleanup uploaded files
    for (const filePath of uploadedFiles) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting file ${filePath}:`, err);
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});