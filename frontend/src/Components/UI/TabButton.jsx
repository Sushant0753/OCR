import React from 'react'

const TabButton = ({ active, onClick, children }) => {
    return (
      <button
        onClick={onClick}
        className={`py-2 px-1 -mb-px border-b-2 ${
          active 
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {children}
      </button>
    );
};

export default TabButton