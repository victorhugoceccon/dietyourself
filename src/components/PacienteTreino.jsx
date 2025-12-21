import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PacienteTreinos from './PacienteTreinos'
import { API_URL } from '../config/api'
import './PacienteTreino.css'

function PacienteTreino() {
  const [hasPersonal, setHasPersonal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
      <PacienteTreinos refreshTrigger={0} />
    </div>
  )
}

export default PacienteTreino




