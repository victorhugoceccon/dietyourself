import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { StatCard, SectionHeader, Skeleton } from './ui'
import './PersonalStats.css'

/**
 * PersonalStats - Dashboard de KPIs para Personal Trainers.
 */
function PersonalStats({ onTabChange }) {
  const [stats, setStats] = useState({
    totalExercicios: 0,
    totalDivisoes: 0,
    totalPrescricoes: 0,
    totalAlunos: 0,
    feedbacksPendentes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Carregar dados em paralelo
      const [exerciciosRes, divisoesRes, alunosRes, feedbacksRes] = await Promise.all([
        fetch(`${API_URL}/exercicios`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/divisoes`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/personal/pacientes`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/personal/feedbacks?status=pendente`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
      ])

      let totalExercicios = 0
      let totalDivisoes = 0
      let totalAlunos = 0
      let feedbacksPendentes = 0

      if (exerciciosRes?.ok) {
        const data = await exerciciosRes.json()
        totalExercicios = data.exercicios?.length || 0
      }

      if (divisoesRes?.ok) {
        const data = await divisoesRes.json()
        totalDivisoes = data.divisoes?.length || 0
      }

      if (alunosRes?.ok) {
        const data = await alunosRes.json()
        totalAlunos = data.pacientes?.length || 0
      }

      if (feedbacksRes?.ok) {
        const data = await feedbacksRes.json()
        feedbacksPendentes = data.feedbacks?.filter(f => f.status === 'pendente').length || 0
      }

      setStats({
        totalExercicios,
        totalDivisoes,
        totalPrescricoes: 0, // TODO: adicionar endpoint
        totalAlunos,
        feedbacksPendentes
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="personal-stats">
        <div className="stats-grid">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    )
  }

  return (
    <div className="personal-stats">
      {/* KPIs Grid */}
      <div className="stats-grid lifefit-stats-grid">
        <StatCard
          label="Exercícios"
          value={stats.totalExercicios}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12" />
            </svg>
          }
        />

        <StatCard
          label="Divisões de Treino"
          value={stats.totalDivisoes}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
        />

        <StatCard
          label="Alunos Ativos"
          value={stats.totalAlunos}
          highlight
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <StatCard
          label="Feedbacks Pendentes"
          value={stats.feedbacksPendentes}
          change={stats.feedbacksPendentes > 0 ? 'Verificar' : ''}
          positive={stats.feedbacksPendentes === 0}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M13 8H7M17 12H7" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <SectionHeader title="Ações Rápidas" />
        
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => onTabChange?.('exercicios')}
          >
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="action-label">Novo Exercício</span>
          </button>

          <button 
            className="action-card"
            onClick={() => onTabChange?.('divisoes')}
          >
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="action-label">Nova Divisão</span>
          </button>

          <button 
            className="action-card"
            onClick={() => onTabChange?.('prescricoes')}
          >
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <span className="action-label">Prescrever Treino</span>
          </button>

          <button 
            className="action-card"
            onClick={() => onTabChange?.('feedbacks')}
          >
            <div className="action-icon action-icon--warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="action-label">Ver Feedbacks</span>
            {stats.feedbacksPendentes > 0 && (
              <span className="action-badge">{stats.feedbacksPendentes}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonalStats


