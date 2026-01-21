// Em produção, usar caminho relativo para aproveitar o proxy do Nginx
// Em desenvolvimento, usar VITE_API_URL ou localhost
// Tenta porta 8081 primeiro (backend atual), depois 5000 (fallback)
const getApiBase = () => {
  // Se VITE_API_URL estiver definido, usar ele
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Em produção, usar caminho relativo (proxy do Nginx)
  if (import.meta.env.PROD) {
    return '/api'
  }
  
  // Em desenvolvimento, tentar porta 8081 primeiro, depois 5000
  // O Vite proxy vai redirecionar /api para o backend
  return '/api'
}

const API_BASE = getApiBase()

// #region agent log
console.log('🔍 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
  API_BASE: API_BASE,
  AUTH_API_URL: `${API_BASE}/auth`
})
// #endregion

export const API_URL = API_BASE
export const AUTH_API_URL = `${API_BASE}/auth`

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Função para carregar o script do Google Maps dinamicamente
export const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    // Google Maps já está carregado
    if (callback) callback()
    return
  }

  const apiKey = GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY não está configurada no .env')
    if (callback) callback()
    return
  }

  // Verificar se o script já está sendo carregado
  if (document.querySelector('script[src*="maps.googleapis.com"]')) {
    // Aguardar o script carregar
    const checkGoogle = setInterval(() => {
      if (window.google && window.google.maps) {
        clearInterval(checkGoogle)
        if (callback) callback()
      }
    }, 100)
    return
  }

  // Carregar o script
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`
  script.async = true
  script.defer = true
  script.onload = () => {
    if (callback) callback()
  }
  script.onerror = () => {
    console.error('Erro ao carregar o script do Google Maps')
    if (callback) callback()
  }
  document.head.appendChild(script)
}


