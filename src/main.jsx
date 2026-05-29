import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./styles/tokens.css"
import "./styles/ui.css"
import App from './App.jsx'
import { getToken, clearAuth } from './utils/auth.js'

// Inyecta Authorization header automáticamente en todas las llamadas /api
// y redirige a /login si el servidor devuelve 401.
const _fetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url ?? ''
  const isApi = url.includes('/api/') || url.startsWith('/api')
  if (isApi) {
    const token = getToken()
    if (token) {
      init = { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } }
    }
  }
  const response = await _fetch(input, init)
  if (response.status === 401 && isApi) {
    clearAuth()
    window.location.href = '/login'
  }
  return response
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
