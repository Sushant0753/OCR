import React from 'react';
import Card from '../UI/Card';
import CardHeader from '../UI/CardHeader';
import CardContent from '../UI/CardContent';
import FileUploader from '../FileUploader';
import FilePreview from '../FilePreview';
import ProcessButton from '../ProcessButtton';

const UploadTab = ({ 
  files, 
  onFileChange, 
  onRemoveFile, 
  onClearFiles, 
  onProcessDocuments, 
  processing, 
  error 
}) => (
  <Card className="mt-4">
    <CardHeader>
      <h2 className="text-xl font-semibold">Document Processing System</h2>
      <p className="text-sm text-gray-500 mt-1">
        Upload multiple documents for batch processing
      </p>
    </CardHeader>
    <CardContent>
      <FileUploader onFileChange={onFileChange} />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={onClearFiles}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <FilePreview 
                key={index} 
                file={file} 
                onRemove={() => onRemoveFile(index)} 
              />
            ))}
          </div>
        </div>
      )}

      <ProcessButton 
        onClick={onProcessDocuments}
        disabled={files.length === 0}
        processing={processing}
        fileCount={files.length}
      />

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default UploadTab;