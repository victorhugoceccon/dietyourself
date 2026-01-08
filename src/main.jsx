import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// #region agent log - global error instrumentation
const DEBUG_ENDPOINT = 'http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485'
const debugSessionId = 'debug-session'
const debugRunId = 'blank-screen'

const safeLog = (payload) => {
  try {
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: debugSessionId,
        runId: debugRunId,
        timestamp: Date.now(),
        ...payload,
      }),
    }).catch(() => {})
  } catch {}
}

// Captura erros globais não tratados
window.addEventListener('error', (event) => {
  safeLog({
    hypothesisId: 'E1',
    location: 'main.jsx:window.onerror',
    message: 'Uncaught error',
    data: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  })
})

window.addEventListener('unhandledrejection', (event) => {
  safeLog({
    hypothesisId: 'E2',
    location: 'main.jsx:unhandledrejection',
    message: 'Unhandled promise rejection',
    data: {
      reason: event.reason ? (event.reason.message || event.reason.toString()) : 'unknown',
    },
  })
})

// Log de render inicial
safeLog({
  hypothesisId: 'E0',
  location: 'main.jsx:bootstrap',
  message: 'Root render start',
  data: { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a' },
})
// #endregion

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

