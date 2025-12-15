import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import ChatWidget from './ChatWidget'
import EditPatientDietModal from './EditPatientDietModal'
import LoadingBar from './LoadingBar'
import AlimentosManager from './AlimentosManager'
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
    
    // Verificar se é nutricionista
    const role = userData.role?.toUpperCase()
    if (role !== 'NUTRICIONISTA' && role !== 'ADMIN') {
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
            <span className="role-badge">Nutricionista</span>
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
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Novo Paciente
              </button>
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
              ) : (
                pacientes.map((paciente) => (
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
                      {paciente.dieta && (
                        <div className="paciente-badge dieta">
                          Tem dieta
                        </div>
                      )}
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

// Componente para visualizar detalhes do paciente
function PacienteDetailView({ paciente, onUpdate }) {
  const [dieta, setDieta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')
  const [generatingDiet, setGeneratingDiet] = useState(false)
  const [dietError, setDietError] = useState('')

  useEffect(() => {
    loadPacienteDieta()
  }, [paciente.id])

  const loadPacienteDieta = async () => {
    setLoading(true)
    setDietError('')
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${paciente.id}/dieta`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dieta carregada:', data.dieta)
        setDieta(data.dieta)
        if (data.dieta?.refeicoes) {
          setExpandedMeals(new Set([0])) // Expandir primeira refeição
        }
      } else if (response.status === 404) {
        console.log('⚠️ Paciente não tem dieta ainda')
        setDieta(null)
      } else {
        const errorData = await response.json()
        setDietError(errorData.error || 'Erro ao carregar dieta')
        setDieta(null)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dieta:', error)
      setDietError('Erro ao carregar dieta. Tente novamente.')
      setDieta(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleMeal = (index) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados do paciente...</p>
      </div>
    )
  }

  const handleDietSaved = (updatedDieta) => {
    setDieta(updatedDieta)
    // Notificar componente pai para recarregar se necessário
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleGenerateDietAI = async () => {
    setGeneratingDiet(true)
    setDietError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${paciente.id}/dieta/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar dieta por IA.')
      }
      setDieta(data.dieta)
      if (data.dieta?.refeicoes) {
        setExpandedMeals(new Set([0]))
      }
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Erro ao gerar dieta por IA:', error)
      setDietError(error.message || 'Erro ao gerar dieta por IA. Verifique se o questionário do paciente está completo.')
    } finally {
      setGeneratingDiet(false)
    }
  }

  return (
    <div className="paciente-detail-view">
      <div className="detail-header">
        <div>
          <h2>{paciente.name || paciente.email}</h2>
          <p className="detail-subtitle">{paciente.email}</p>
          {paciente.questionnaireData && (
            <div className="detail-meta">
              <span>{paciente.questionnaireData.idade} anos</span>
              <span>{paciente.questionnaireData.sexo}</span>
              {paciente.questionnaireData.altura && (
                <span>{paciente.questionnaireData.altura} cm</span>
              )}
              {paciente.questionnaireData.pesoAtual && (
                <span>{paciente.questionnaireData.pesoAtual} kg</span>
              )}
            </div>
          )}
        </div>
        {dieta && (
          <button
            onClick={() => {
              console.log('Clicou em Editar Dieta, dieta:', dieta)
              setShowEditModal(true)
            }}
            className="edit-diet-btn"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Editar Dieta
          </button>
        )}
      </div>

      {dietError && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {dietError}
        </div>
      )}

      {!dieta ? (
        <div className="no-dieta-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Paciente ainda não tem dieta</h3>
          <p>O paciente precisa completar o questionário e gerar uma dieta primeiro.</p>
          <button
            onClick={handleGenerateDietAI}
            disabled={generatingDiet}
            className="generate-diet-btn"
            style={{ marginTop: '1.5rem' }}
          >
            {generatingDiet ? 'Gerando Dieta...' : 'Gerar Dieta por IA'}
          </button>
          {generatingDiet && <LoadingBar message="Gerando dieta personalizada..." />}
        </div>
      ) : (
        <div className="dieta-view">
          {/* Resumo */}
          <div className="dieta-summary-section">
            <div className="summary-card-primary">
              <div className="summary-label">Total do Dia</div>
              <div className="summary-value-large">{dieta.totalDiaKcal}</div>
              <div className="summary-unit">kcal</div>
            </div>
            <div className="summary-cards-secondary">
              <div className="summary-card-secondary">
                <div className="summary-icon protein">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label-small">Proteína</div>
                  <div className="summary-value-medium">{dieta.macrosDia?.proteina_g}g</div>
                </div>
              </div>
              <div className="summary-card-secondary">
                <div className="summary-icon carbs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label-small">Carboidrato</div>
                  <div className="summary-value-medium">{dieta.macrosDia?.carbo_g}g</div>
                </div>
              </div>
              <div className="summary-card-secondary">
                <div className="summary-icon fat">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <div className="summary-label-small">Gordura</div>
                  <div className="summary-value-medium">{dieta.macrosDia?.gordura_g}g</div>
                </div>
              </div>
            </div>
          </div>

          {/* Refeições */}
          <div className="diet-meals">
            {dieta.refeicoes && dieta.refeicoes.map((refeicao, mealIndex) => (
              <div key={mealIndex} className="meal-card">
                <button
                  className={`meal-header ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                  onClick={() => toggleMeal(mealIndex)}
                  type="button"
                >
                  <div className="meal-header-content">
                    <h3 className="meal-name">{refeicao.nome}</h3>
                    <span className="meal-badge">{refeicao.totalRefeicaoKcal} kcal</span>
                  </div>
                  <svg
                    className={`meal-expand-icon ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {expandedMeals.has(mealIndex) && (
                  <div className="meal-content">
                    <div className="meal-items">
                      {refeicao.itens && refeicao.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className="food-item">
                          <div className="food-item-main">
                            <div className="food-info">
                              <div className="food-name">{item.alimento}</div>
                              <div className="food-portion">{item.porcao}</div>
                            </div>
                            <span className="food-kcal">{item.kcal} kcal</span>
                          </div>
                          {item.substituicoes && item.substituicoes.length > 0 && (
                            <div className="substitutions-section">
                              <div className="substitutions-label">Substituições</div>
                              <div className="substitutions-chips">
                                {item.substituicoes.map((sub, subIndex) => (
                                  <span key={subIndex} className="substitution-chip">
                                    {sub.alimento} ({sub.kcalAproximada} kcal)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && dieta && (
        <EditPatientDietModal
          isOpen={showEditModal}
          onClose={() => {
            console.log('Fechando modal de edição')
            setShowEditModal(false)
          }}
          pacienteId={paciente.id}
          dieta={dieta}
          onSave={handleDietSaved}
        />
      )}
    </div>
  )
}

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

