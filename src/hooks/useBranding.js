import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'

export function useBranding(userId = null) {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBranding()
  }, [userId])

  const loadBranding = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = userId 
        ? `${API_URL}/branding/${userId}`
        : `${API_URL}/branding`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
      }
    } catch (error) {
      console.error('Erro ao carregar branding:', error)
    } finally {
      setLoading(false)
    }
  }

  return { branding, loading, reload: loadBranding }
}




