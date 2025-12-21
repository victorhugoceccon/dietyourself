import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfessionalLayout from './ProfessionalLayout'
import ExerciciosManager from './ExerciciosManager'
import DivisaoTreinoManager from './DivisaoTreinoManager'
import PersonalPacientes from './PersonalPacientes'
import PrescricaoTreino from './PrescricaoTreino'
import PersonalFeedbackSolicitacoes from './PersonalFeedbackSolicitacoes'
import BrandingSettings from './BrandingSettings'
import PersonalStats from './PersonalStats'
import LoadingBar from './LoadingBar'
import './Personal.css'

function Personal() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)
    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <ProfessionalLayout allowedRoles={['PERSONAL', 'ADMIN']}>
        <LoadingBar message="Carregando..." />
      </ProfessionalLayout>
    )
  }

  const navItems = (
    <>
      <button
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        <span className="nav-text">Dashboard</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'exercicios' ? 'active' : ''}`}
        onClick={() => setActiveTab('exercicios')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <path d="M6 14h12"></path>
        </svg>
        <span className="nav-text">Exercícios</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'divisoes' ? 'active' : ''}`}
        onClick={() => setActiveTab('divisoes')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span className="nav-text">Divisões</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'prescricoes' ? 'active' : ''}`}
        onClick={() => setActiveTab('prescricoes')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span className="nav-text">Prescrições</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'pacientes' ? 'active' : ''}`}
        onClick={() => setActiveTab('pacientes')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span className="nav-text">Alunos</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'feedbacks' ? 'active' : ''}`}
        onClick={() => setActiveTab('feedbacks')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M13 8H7M17 12H7"></path>
        </svg>
        <span className="nav-text">Feedbacks</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'branding' ? 'active' : ''}`}
        onClick={() => setActiveTab('branding')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <span className="nav-text">Branding</span>
      </button>
    </>
  )

  return (
    <ProfessionalLayout allowedRoles={['PERSONAL', 'ADMIN']} headerNavItems={navItems}>
      <div className="personal-content-wrapper">
        {/* Navegação por Tabs - Mobile apenas */}
        <nav className="personal-nav">
          <div className="nav-content">
            {navItems}
          </div>
        </nav>

        {/* Conteúdo Principal */}
        <div className="personal-main-content">
          {activeTab === 'dashboard' && <PersonalStats onTabChange={setActiveTab} />}
          {activeTab === 'exercicios' && <ExerciciosManager />}
          {activeTab === 'divisoes' && <DivisaoTreinoManager />}
          {activeTab === 'prescricoes' && <PrescricaoTreino />}
          {activeTab === 'pacientes' && <PersonalPacientes />}
          {activeTab === 'feedbacks' && <PersonalFeedbackSolicitacoes />}
          {activeTab === 'branding' && <BrandingSettings />}
        </div>
      </div>
    </ProfessionalLayout>
  )
}

export default Personal
