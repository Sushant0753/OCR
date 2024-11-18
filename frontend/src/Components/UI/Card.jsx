import React from 'react'

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
        {children}
    </div>
  )
}

export default Card