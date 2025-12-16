import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import ChatWidget from './ChatWidget'
import PacienteDetailView from './PacienteDetailView'
import LoadingBar from './LoadingBar'
import AlimentosManager from './AlimentosManager'
import RoleSelector from './RoleSelector'
import { hasAnyRole, getCurrentRole } from '../utils/roleUtils'
import './Nutricionista.css'
import { API_URL } from '../config/api'

function Nutricionista() {
  const [user, setUser] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPaciente, setNewPaciente] = useState({ email: '', password: '', name: '' })
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('pacientes') // 'pacientes' ou 'alimentos'
  const [searchQuery, setSearchQuery] = useState('')
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
    
    // Verificar se tem acesso de nutricionista ou admin
    if (!hasAnyRole(userData, ['NUTRICIONISTA', 'ADMIN'])) {
      navigate('/login')
      return
    }

    setUser(userData)
    loadPacientes(token)
  }, [navigate])

  const loadPacientes = async (token) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/nutricionista/pacientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Pacientes recebidos da API:', data.pacientes || [])
        setPacientes(data.pacientes || [])
      } else {
        const errorData = await response.json()
        console.error('❌ Erro ao carregar pacientes:', errorData)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaciente = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/nutricionista/pacientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPaciente)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar paciente')
      }

      // Recarregar lista
      await loadPacientes(token)
      
      // Fechar modal e limpar formulário
      setShowCreateModal(false)
      setNewPaciente({ email: '', password: '', name: '' })
    } catch (error) {
      alert(error.message || 'Erro ao criar paciente')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Função para normalizar texto (remover acentos)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  // Filtrar pacientes baseado na pesquisa
  const filteredPacientes = pacientes.filter(paciente => {
    if (!searchQuery.trim()) return true
    
    const queryNormalized = normalizeText(searchQuery)
    const nomeNormalized = normalizeText(paciente.name || '')
    const emailNormalized = normalizeText(paciente.email || '')
    
    return nomeNormalized.includes(queryNormalized) || emailNormalized.includes(queryNormalized)
  })

  if (loading) {
    return (
      <div className="nutricionista-container">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="nutricionista-container">
      <header className="nutricionista-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">DietYourself</h1>
            <p className="welcome-text">
              Olá, {user?.name || user?.email}! 👋
            </p>
            <RoleSelector user={user} />
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <button onClick={handleLogout} className="logout-btn">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="nutricionista-main">
        {/* Tabs */}
        <div className="nutricionista-tabs">
          <button
            className={`tab-btn ${activeTab === 'pacientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('pacientes')}
          >
            Meus Pacientes
          </button>
          <button
            className={`tab-btn ${activeTab === 'alimentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('alimentos')}
          >
            Alimentos
          </button>
        </div>

        <div className="nutricionista-content">
          {/* Sidebar com lista de pacientes */}
          {activeTab === 'pacientes' && (
          <aside className="pacientes-sidebar">
            <div className="sidebar-header">
              <h2>Meus Pacientes</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="add-paciente-btn"
                title="Adicionar novo paciente"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Novo
              </button>
            </div>

            {/* Campo de pesquisa */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className={`search-input ${searchQuery ? 'has-value' : ''}`}
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Limpar pesquisa"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
              {pacientes.length > 0 && (
                <div className="search-results-count">
                  {filteredPacientes.length === pacientes.length ? (
                    <span>{pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}</span>
                  ) : (
                    <span>{filteredPacientes.length} de {pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}</span>
                  )}
                </div>
              )}
            </div>

            <div className="pacientes-list">
              {pacientes.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>Nenhum paciente cadastrado ainda</p>
                  <p className="empty-hint">Clique em "Novo Paciente" para começar</p>
                </div>
              ) : filteredPacientes.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>Nenhum paciente encontrado</p>
                  <p className="empty-hint">Tente buscar com outros termos</p>
                </div>
              ) : (
                filteredPacientes.map((paciente) => (
                  <div
                    key={paciente.id}
                    className={`paciente-item ${selectedPaciente?.id === paciente.id ? 'active' : ''}`}
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <div className="paciente-avatar">
                      {paciente.name ? paciente.name.charAt(0).toUpperCase() : paciente.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="paciente-info">
                      <div className="paciente-name">
                        {paciente.name || paciente.email}
                      </div>
                      <div className="paciente-email">{paciente.email}</div>
                      {paciente.questionnaireData && (
                        <div className="paciente-meta">
                          {paciente.questionnaireData.idade} anos • {paciente.questionnaireData.sexo}
                        </div>
                      )}
                      <div className="paciente-badges">
                        {paciente.dieta && (
                          <div className="paciente-badge dieta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Tem dieta
                          </div>
                        )}
                        {paciente.questionnaireData && (
                          <div className="paciente-badge questionnaire">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Questionário
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
          )}

          {/* Área principal - Detalhes do paciente ou alimentos */}
          {activeTab === 'pacientes' ? (
          <section className="paciente-details">
            {selectedPaciente ? (
              <PacienteDetailView
                paciente={selectedPaciente}
                onUpdate={() => loadPacientes(localStorage.getItem('token'))}
              />
            ) : (
              <div className="empty-selection">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3>Selecione um paciente</h3>
                <p>Escolha um paciente da lista ao lado para ver e gerenciar sua dieta</p>
              </div>
            )}
          </section>
          ) : (
          <section className="alimentos-section">
            <AlimentosManager />
          </section>
          )}
        </div>
      </main>

      {/* Modal de criação de paciente */}
      {showCreateModal && (
        <CreatePacienteModal
          onClose={() => {
            setShowCreateModal(false)
            setNewPaciente({ email: '', password: '', name: '' })
          }}
          onSubmit={handleCreatePaciente}
          paciente={newPaciente}
          setPaciente={setNewPaciente}
          loading={creating}
        />
      )}

      {/* Widget de Chat */}
      <ChatWidget />
    </div>
  )
}

// Componente PacienteDetailView agora está em arquivo separado (PacienteDetailView.jsx)

// Modal para criar novo paciente
function CreatePacienteModal({ onClose, onSubmit, paciente, setPaciente, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Novo Paciente</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="create-paciente-form">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={paciente.email}
              onChange={(e) => setPaciente({ ...paciente, email: e.target.value })}
              required
              placeholder="paciente@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Nome (opcional)</label>
            <input
              id="name"
              type="text"
              value={paciente.name}
              onChange={(e) => setPaciente({ ...paciente, name: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha *</label>
            <input
              id="password"
              type="password"
              value={paciente.password}
              onChange={(e) => setPaciente({ ...paciente, password: e.target.value })}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Criando...' : 'Criar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Nutricionista

