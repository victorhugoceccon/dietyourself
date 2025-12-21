import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfessionalLayout from './ProfessionalLayout'
import PacienteDetailView from './PacienteDetailView'
import LoadingBar from './LoadingBar'
import AlimentosManager from './AlimentosManager'
import BrandingSettings from './BrandingSettings'
import NutricionistaStats from './NutricionistaStats'
import { API_URL } from '../config/api'
import './Nutricionista.css'

function Nutricionista() {
  const [user, setUser] = useState(null)
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPaciente, setNewPaciente] = useState({ email: '', password: '', name: '' })
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('pacientes')
  const [searchQuery, setSearchQuery] = useState('')
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
        setPacientes(data.pacientes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
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

      await loadPacientes(token)
      setShowCreateModal(false)
      setNewPaciente({ email: '', password: '', name: '' })
    } catch (error) {
      alert(error.message || 'Erro ao criar paciente')
    } finally {
      setCreating(false)
    }
  }

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  const filteredPacientes = pacientes.filter(paciente => {
    if (!searchQuery.trim()) return true
    
    const queryNormalized = normalizeText(searchQuery)
    const nomeNormalized = normalizeText(paciente.name || '')
    const emailNormalized = normalizeText(paciente.email || '')
    
    return nomeNormalized.includes(queryNormalized) || emailNormalized.includes(queryNormalized)
  })

  if (loading) {
    return (
      <ProfessionalLayout allowedRoles={['NUTRICIONISTA', 'ADMIN']}>
        <LoadingBar message="Carregando..." />
      </ProfessionalLayout>
    )
  }

  const navItems = (
    <>
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
        <span className="nav-text">Pacientes</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'alimentos' ? 'active' : ''}`}
        onClick={() => setActiveTab('alimentos')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span className="nav-text">Alimentos</span>
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
    <ProfessionalLayout
      allowedRoles={['NUTRICIONISTA', 'ADMIN']}
      headerNavItems={navItems}
      headerNavClassName="header-nav-items-nutricionista"
    >
      <div className="nutricionista-content-wrapper">
        {/* Navegação por Tabs - Mobile apenas (barra inferior) */}
        <nav className="nutricionista-nav">
          <div className="nav-content">{navItems}</div>
        </nav>

        {/* Conteúdo Principal */}
        <div className="nutricionista-main-content">
          {activeTab === 'pacientes' && (
            <>
              {/* Dashboard de Estatísticas */}
              <NutricionistaStats 
                pacientes={pacientes} 
                onPacienteClick={(p) => setSelectedPaciente(p)}
              />

              <div className="pacientes-layout">
              {/* Sidebar com lista de pacientes */}
              <aside className="pacientes-sidebar">
                <div className="sidebar-header">
                  <h2 className="sidebar-title">Meus Pacientes</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="add-paciente-btn"
                    title="Adicionar novo paciente"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5V19M5 12H19" strokeLinecap="round"/>
                    </svg>
                    <span>Novo</span>
                  </button>
                </div>

                {/* Campo de pesquisa */}
                <div className="search-container">
                  <div className="search-input-wrapper">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Buscar paciente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        title="Limpar pesquisa"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  {pacientes.length > 0 && (
                    <div className="search-results-count">
                      {filteredPacientes.length === pacientes.length ? (
                        <span>{pacientes.length} {pacientes.length === 1 ? 'paciente' : 'pacientes'}</span>
                      ) : (
                        <span>{filteredPacientes.length} de {pacientes.length}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de pacientes */}
                <div className="pacientes-list">
                  {pacientes.length === 0 ? (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4"></circle>
                        <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" strokeLinecap="round"/>
                      </svg>
                      <p>Nenhum paciente cadastrado</p>
                      <p className="empty-hint">Clique em "Novo" para adicionar</p>
                    </div>
                  ) : filteredPacientes.length === 0 ? (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                      </svg>
                      <p>Nenhum paciente encontrado</p>
                      <p className="empty-hint">Tente outros termos de busca</p>
                    </div>
                  ) : (
                    filteredPacientes.map((paciente) => (
                      <div
                        key={paciente.id}
                        className={`paciente-item ${selectedPaciente?.id === paciente.id ? 'active' : ''}`}
                        onClick={() => setSelectedPaciente(paciente)}
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Dieta
                              </div>
                            )}
                            {paciente.questionnaireData && (
                              <div className="paciente-badge questionnaire">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
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

              {/* Área de detalhes do paciente */}
              <section className="paciente-details">
                {selectedPaciente ? (
                  <PacienteDetailView
                    paciente={selectedPaciente}
                    onUpdate={() => loadPacientes(localStorage.getItem('token'))}
                  />
                ) : (
                  <div className="empty-selection">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8V16M8 12H16" strokeLinecap="round"/>
                    </svg>
                    <h3>Selecione um paciente</h3>
                    <p>Escolha um paciente da lista para ver e gerenciar sua dieta</p>
                  </div>
                )}
              </section>
            </div>
            </>
          )}

          {activeTab === 'alimentos' && (
            <section className="alimentos-section">
              <AlimentosManager />
            </section>
          )}

          {activeTab === 'branding' && (
            <section className="branding-section">
              <BrandingSettings />
            </section>
          )}
        </div>
      </div>

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
    </ProfessionalLayout>
  )
}

// Modal para criar novo paciente
function CreatePacienteModal({ onClose, onSubmit, paciente, setPaciente, loading }) {
  return (
    <div className="create-paciente-overlay" onClick={onClose}>
      <div className="create-paciente-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-paciente-header">
          <div className="create-paciente-header-text">
            <h2>Cadastrar Novo Paciente</h2>
            <p className="create-paciente-subtitle">Crie o acesso do paciente para começar o acompanhamento.</p>
          </div>
          <button className="create-paciente-close" onClick={onClose} aria-label="Fechar" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="create-paciente-form" autoComplete="off">
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

          <div className="create-paciente-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Criando...' : 'Criar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Nutricionista
