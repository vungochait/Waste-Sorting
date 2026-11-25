import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SystemStatusProvider } from './hooks/useSystemStatus'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SystemStatusProvider>
        <App />
      </SystemStatusProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
