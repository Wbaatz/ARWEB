import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ARScene from './Ar.tsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ARScene/>
  </StrictMode>,
)
