import React, { useState } from 'react';
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
  
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles([...files, ...newFiles]);
    setError(null);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const processDocuments = () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setProcessing(true);
    setError(null);

    // Simulate processing
    setTimeout(() => {
      const newResults = files.map(file => ({
        fileName: file.name,
        timestamp: new Date().toISOString(),
        confidence: Math.random() * 0.3 + 0.7,
        documentType: ['Invoice', 'Contract', 'Receipt'][Math.floor(Math.random() * 3)],
        summary: "This is a sample summary of the processed document...",
        entities: ["Company: TechCorp", "Date: 2024-03-15", "Amount: $5,000"],
        suggestions: ["Verify payment", "Update records", "Follow up"]
      }));

      setResults([...results, ...newResults]);
      setFiles([]);
      setProcessing(false);
      setActiveTab('results');
    }, 2000);
  };

  const FilePreview = ({ file }) => (
    <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100">
      <div className="flex items-center space-x-3">
        <FileIcon className="text-gray-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={() => removeFile(files.indexOf(file))}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <TrashIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

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