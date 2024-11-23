import React from 'react';
import FileIcon from './Icons/FileIcon';

const ProcessButton = ({ onClick, disabled, processing, fileCount }) => (
  <button
    onClick={onClick}
    disabled={disabled || processing}
    className={`mt-4 w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2
      ${disabled || processing 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
  >
    <FileIcon className="w-5 h-5" />
    <span>
      {processing 
        ? `Processing ${fileCount} files...`
        : `Process ${fileCount} Document${fileCount !== 1 ? 's' : ''}`}
    </span>
  </button>
);

export default ProcessButton;