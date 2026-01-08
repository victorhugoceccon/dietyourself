import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import PacienteTreinos from './PacienteTreinos'
import { useBranding } from '../hooks/useBranding'
import { API_URL } from '../config/api'
import './PacienteTreino.css'

function PacienteTreino() {
  const [hasPersonal, setHasPersonal] = useState(false)
  const [loading, setLoading] = useState(true)
  const outlet = useOutletContext()
  const personalId = outlet?.userData?.personalId || null
  const navigate = useNavigate()
  const { branding } = useBranding(personalId)

  useEffect(() => {
    checkPersonal()
  }, [])

  const checkPersonal = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user?.personalId) {
          setHasPersonal(true)
        } else {
          // Se não tem personal, redirecionar para perfil
          navigate('/paciente/perfil', { replace: true })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar personal:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="paciente-treino">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    )
  }

  if (!hasPersonal) {
    return null
  }

  return (
    <div className="paciente-treino">
      {/* Hero Section */}
      <div 
        className="treino-hero"
        style={{
          backgroundImage: branding?.bannerUrl 
            ? `linear-gradient(135deg, rgba(15, 18, 27, 0.85), rgba(8, 11, 18, 0.9)), url(${branding.bannerUrl})`
            : undefined
        }}
      >
        <div className="treino-hero__glow"></div>
        <div className="treino-hero__content">
          {branding?.logoUrl && (
            <div className="treino-hero__logo">
              <img src={branding.logoUrl} alt="Logo do Personal" />
            </div>
          )}
          <p className="treino-hero__kicker">Treinos</p>
          <h1 className="treino-hero__title">Sua rotina de treino</h1>
          <p className="treino-hero__subtitle">
            Acompanhe seus treinos, execute suas divisões e veja seu progresso.
          </p>
        </div>
      </div>

      <PacienteTreinos refreshTrigger={0} />
    </div>
  )
}

export default PacienteTreino





