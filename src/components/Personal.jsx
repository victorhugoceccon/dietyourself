import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import ChatWidget from './ChatWidget'
import ExerciciosManager from './ExerciciosManager'
import DivisaoTreinoManager from './DivisaoTreinoManager'
import PersonalPacientes from './PersonalPacientes'
import PrescricaoTreino from './PrescricaoTreino'
import LoadingBar from './LoadingBar'
import './Personal.css'

function Personal() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('exercicios') // 'exercicios', 'divisoes', 'prescricoes', 'pacientes'
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      navigate('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    
    // Verificar se é personal trainer
    const role = userData.role?.toUpperCase()
    if (role !== 'PERSONAL' && role !== 'ADMIN') {
      navigate('/login')
      return
    }

    setUser(userData)
    setLoading(false)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="personal-container">
        <LoadingBar message="Carregando..." />
      </div>
    )
  }

  return (
    <div className="personal-container">
      <header className="personal-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">DietYourself</h1>
            <p className="welcome-text">
              Olá, {user?.name || 'Personal Trainer'}! 💪
            </p>
            <span className="role-badge">Personal Trainer</span>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="personal-main">
        {/* Tabs */}
        <div className="personal-tabs">
          <button
            className={`tab-btn ${activeTab === 'exercicios' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercicios')}
          >
            Exercícios
          </button>
          <button
            className={`tab-btn ${activeTab === 'divisoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('divisoes')}
          >
            Divisões de Treino
          </button>
          <button
            className={`tab-btn ${activeTab === 'prescricoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescricoes')}
          >
            Prescrições
          </button>
          <button
            className={`tab-btn ${activeTab === 'pacientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pacientes')}
          >
            Meus Pacientes
          </button>
        </div>

        {/* Tab Content */}
        <div className="personal-content">
          {activeTab === 'exercicios' && <ExerciciosManager />}
          {activeTab === 'divisoes' && <DivisaoTreinoManager />}
          {activeTab === 'prescricoes' && <PrescricaoTreino />}
          {activeTab === 'pacientes' && <PersonalPacientes />}
        </div>
      </main>

      <ChatWidget />
    </div>
  )
}

export default Personal
