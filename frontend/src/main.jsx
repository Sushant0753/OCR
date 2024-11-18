import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DocumentProcessor from './DocumentProcessor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DocumentProcessor />
  </StrictMode>,
)
