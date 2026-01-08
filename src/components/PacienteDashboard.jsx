import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Questionnaire from './Questionnaire'
import EstadoDoDia from './EstadoDoDia'
import DailyCheckInCompact from './DailyCheckInCompact'
import NutritionDashboard from './NutritionDashboard'
import WeeklyAdherence from './WeeklyAdherence'
import ProgressTimeline from './ProgressTimeline'
import NextMealWidget from './NextMealWidget'
import { API_URL } from '../config/api'
import './PacienteDashboard.css'

function PacienteDashboard() {
  const [loading, setLoading] = useState(true)
  const [hasDiet, setHasDiet] = useState(false)
  const [dietRefreshTrigger, setDietRefreshTrigger] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    checkDietStatus()
  }, [])
  
  const checkDietStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.dieta) {
          setHasDiet(true)
        } else {
          // Se não tem dieta, redirecionar para página de dieta
          navigate('/paciente/dieta', { replace: true })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar dieta:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="paciente-dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
      </div>
    )
  }

  // Se não tem dieta, não mostrar dashboard
  if (!hasDiet) {
    return null
  }

  return (
    <div className="paciente-dashboard">
<<<<<<< HEAD
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="dashboard-hero__glow"></div>
        <div className="dashboard-hero__content">
          <p className="dashboard-hero__kicker">Dashboard</p>
          <h1 className="dashboard-hero__title">Seu dia no LifeFit</h1>
          <p className="dashboard-hero__subtitle">
            Acompanhe seu progresso, refeições e atividades do dia.
          </p>
        </div>
      </div>

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      {/* Grid Principal: Estado + Próxima Refeição */}
      <section className="dashboard-section dashboard-hero-grid">
        <div className="estado-section">
          <EstadoDoDia refreshTrigger={dietRefreshTrigger} />
        </div>
        <div className="next-meal-section">
          <NextMealWidget refreshTrigger={dietRefreshTrigger} />
        </div>
      </section>

      {/* Check-in Diário */}
      <section className="dashboard-section checkin-section">
        <DailyCheckInCompact 
          refreshTrigger={dietRefreshTrigger}
          onCheckInComplete={() => {
            setDietRefreshTrigger(prev => prev + 1)
          }}
        />
      </section>

      {/* Constância Semanal - PROTAGONISMO */}
      <section className="dashboard-section adherence-section">
        <WeeklyAdherence refreshTrigger={dietRefreshTrigger} />
      </section>

      {/* Nutrição */}
      <section className="dashboard-section nutrition-section">
        <NutritionDashboard 
          refreshTrigger={dietRefreshTrigger}
        />
      </section>

      {/* Progresso Histórico */}
      <section className="dashboard-section timeline-section">
        <ProgressTimeline refreshTrigger={dietRefreshTrigger} />
      </section>
    </div>
  )
}

export default PacienteDashboard




