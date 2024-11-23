import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import GeminiService from './Components/GeminiService';
import CardContent from './Components/UI/CardContent';
import Card from './Components/UI/Card';
import CardHeader from './Components/UI/CardHeader';
import TabButton from './Components/UI/TabButton';
import TabsContainer from './Components/UI/TabsContainer';
import FileIcon from './Components/Icons/FileIcon';
import UploadIcon from './Components/Icons/UploadIcon';
import TrashIcon from './Components/Icons/TrashIcon';


const DocumentProcessor = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [geminiService, setGeminiService] = useState(null);
  const [isFatalError, setIsFatalError] = useState(false);

  useEffect(() => {
    // Initialize Gemini service when component mounts
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; // Get from environment variables
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      setError('Gemini API configuration missing');
      return;
    }
    
    const initializeGemini = () => {
      try {
        const service = new GeminiService(GEMINI_API_KEY);
        setGeminiService(service);
      } catch (error) {
        console.error('Failed to initialize Gemini service:', error);
        setError('Failed to initialize document processing service');
      }
    };

    initializeGemini();
  }, []);
  
  const handleFileChange = useCallback((event) => {
    const newFiles = Array.from(event.target.files);
    const validFiles = newFiles.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      const isValidType = /\.(pdf|png|jpg|jpeg)$/i.test(file.name);
      return isValidSize && isValidType;
    });

    if (validFiles.length !== newFiles.length) {
      setError("Some files were skipped due to invalid type or size");
    }

    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  }, []);

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };


  const processDocuments = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    if (!geminiService) {
      setError("Document processing service not initialized");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
        throw new Error("Total file size exceeds 50MB limit");
      }

      files.forEach(file => formData.append('files', file));

      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You can add a progress state and UI if needed
        },
        timeout: 30000 // 30 second timeout
      });

      setResults(response.data);
      setFiles([]);
      setActiveTab('results');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Document processing failed';
      setError(errorMessage);
      
      // Log error for debugging
      console.error('Document processing error:', {
        message: errorMessage,
        status: err.response?.status,
        files: files.map(f => ({ name: f.name, size: f.size }))
      });
    } finally {
      setProcessing(false);
    }
  }, [files, geminiService]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any file references
      files.forEach(file => {
        URL.revokeObjectURL(file);
      });
    };
  }, [files]);

  if (isFatalError) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-red-700">Something went wrong</h2>
          <p className="text-sm text-red-600 mt-2">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  const FilePreview = ({ file }) => {
    const fileSize = (file.size / 1024).toFixed(1);
    const isValidSize = file.size <= 10 * 1024 * 1024;
    const isValidType = /\.(pdf|png|jpg|jpeg)$/i.test(file.name);

    return (
      <div className={`border rounded-lg p-4 ${
        !isValidSize || !isValidType ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'
      }`}>
        <div className="flex items-center space-x-3">
          <FileIcon className={`${
            !isValidSize || !isValidType ? 'text-red-400' : 'text-gray-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className={`text-sm ${
              !isValidSize ? 'text-red-500' : 'text-gray-500'
            }`}>
              {fileSize} KB
              {!isValidSize && ' (exceeds size limit)'}
              {!isValidType && ' (invalid file type)'}
            </p>
          </div>
          <button
            onClick={() => removeFile(files.indexOf(file))}
            className="p-1 hover:bg-gray-200 rounded-full"
            aria-label="Remove file"
          >
            <TrashIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="space-y-4">
        <TabsContainer>
          <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
            Upload
          </TabButton>
          <TabButton active={activeTab === 'results'} onClick={() => setActiveTab('results')}>
            Results
          </TabButton>
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            History
          </TabButton>
        </TabsContainer>

        {/* Upload Tab Content */}
        {activeTab === 'upload' && (
          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-xl font-semibold">Document Processing System</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload multiple documents for batch processing
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                />
                <label 
                  htmlFor="fileInput"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <UploadIcon className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-400">
                    Supports PDF, PNG, JPG (max 10MB per file)
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      Selected Files ({files.length})
                    </h3>
                    <button
                      onClick={() => setFiles([])}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {files.map((file, index) => (
                      <FilePreview key={index} file={file} />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={processDocuments}
                disabled={files.length === 0 || processing}
                className={`mt-4 w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2
                  ${files.length === 0 || processing 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <FileIcon className="w-5 h-5" />
                <span>
                  {processing 
                    ? `Processing ${files.length} files...`
                    : `Process ${files.length} Document${files.length !== 1 ? 's' : ''}`}
                </span>
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Tab Content */}
        {activeTab === 'results' && (
          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-xl font-semibold">Processing Results</h2>
              <p className="text-sm text-gray-500 mt-1">
                View and analyze processed documents
              </p>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{result.fileName}</h3>
                            <p className="text-sm text-gray-500">{result.documentType}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Extracted Text Section */}
                        {result.extractedText && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Extracted Text</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {result.extractedText}
                            </p>
                          </div>
                        )}
      
                        {/* Text Summary Section */}
                        {result.textSummary && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {result.textSummary}
                            </p>
                          </div>
                        )}
      
                        {/* Image Description Section */}
                        {result.imageDescription && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Image Analysis</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {result.imageDescription}
                            </p>
                          </div>
                        )}
      
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Key Entities</h4>
                            <ul className="text-sm space-y-1">
                              {result.entities.map((entity, i) => (
                                <li key={i}>{entity}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Suggested Actions</h4>
                            <ul className="text-sm space-y-1">
                              {result.suggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileIcon className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Process some documents to see the results here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-xl font-semibold">Processing History</h2>
              <p className="text-sm text-gray-500 mt-1">
                View past document processing activities
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                No processing history available
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentProcessor;