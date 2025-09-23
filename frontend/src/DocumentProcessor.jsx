import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import TabButton from './Components/UI/TabButton'
import TabsContainer from './Components/UI/TabsContainer';
import UploadTab from './Components/Tabs/UploadTab';
import ResultTab from './Components/Tabs/ResultTab';
import HistoryTab from './Components/Tabs/HistoryTab';

const DocumentProcessor = () => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileChange = useCallback((event) => {
    const newFiles = Array.from(event.target.files);
    const validFiles = newFiles.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024;
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

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const BACKEND_URL = import.meta.env.BACKEND_URL
      const response = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data.files);
      setFiles([]);
      setActiveTab('results');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Document processing failed';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [files]);

  useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(file);
      });
    };
  }, [files]);

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

        {activeTab === 'upload' && (
          <UploadTab
            files={files}
            onFileChange={handleFileChange}
            onRemoveFile={removeFile}
            onClearFiles={() => setFiles([])}
            onProcessDocuments={processDocuments}
            processing={processing}
            error={error}
          />
        )}

        {activeTab === 'results' && (
          <ResultTab results={results} />
        )}

        {activeTab === 'history' && (
          <HistoryTab />
        )}
      </div>
    </div>
  );
};

export default DocumentProcessor;
