import React from 'react';
import FileIcon from './Icons/FileIcon';
import TrashIcon from './Icons/TrashIcon';

const FilePreview = ({ file, onRemove }) => {
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
          onClick={onRemove}
          className="p-1 hover:bg-gray-200 rounded-full"
          aria-label="Remove file"
        >
          <TrashIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default FilePreview;