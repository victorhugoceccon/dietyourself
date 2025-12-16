// Em produção, usar caminho relativo para aproveitar o proxy do Nginx
// Em desenvolvimento, usar VITE_API_URL ou localhost
const API_BASE = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

export const API_URL = API_BASE
export const AUTH_API_URL = `${API_BASE}/auth`



