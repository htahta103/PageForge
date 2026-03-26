import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { registerDefaultComponents } from './registry/bootstrap'
import './index.css'

registerDefaultComponents()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
