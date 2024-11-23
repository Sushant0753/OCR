import React from 'react';
import UploadIcon from './Icons/UploadIcon';

const FileUploader = ({ onFileChange }) => (
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
    <input
      type="file"
      onChange={onFileChange}
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
);

export default FileUploader;