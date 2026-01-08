// Em produção, usar caminho relativo para aproveitar o proxy do Nginx
// Em desenvolvimento, usar VITE_API_URL ou localhost
const API_BASE = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

export const API_URL = API_BASE
export const AUTH_API_URL = `${API_BASE}/auth`

<<<<<<< HEAD
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

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e


