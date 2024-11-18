import React from 'react'

const Icon = ({ children, className = "" }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`w-6 h-6 ${className}`}
    >
      {children}
    </svg>
);

export default Icon