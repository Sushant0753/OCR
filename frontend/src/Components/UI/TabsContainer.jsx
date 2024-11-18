import React from 'react'

const TabsContainer = ({ children }) => {
    return (
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {children}
        </div>
      </div>
    );
};

export default TabsContainer