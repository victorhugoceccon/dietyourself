import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PersonalPacientes.css'

function PersonalPacientes() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPaciente, setNewPaciente] = useState({ email: '', password: '', name: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadPacientes()
  }, [])

  const loadPacientes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/personal/pacientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPacientes(data.pacientes || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar pacientes')
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
      setError('Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaciente = async (e) => {
    e.preventDefault()
    
    if (!newPaciente.email || !newPaciente.password || !newPaciente.name) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (newPaciente.password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/personal/pacientes/create`, {
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
      await loadPacientes()
      
      // Fechar modal e limpar formulário
      setShowCreateModal(false)
      setNewPaciente({ email: '', password: '', name: '' })
      alert('Paciente criado e vinculado com sucesso!')
    } catch (error) {
      alert(error.message || 'Erro ao criar paciente')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="personal-pacientes">
        <div className="loading">Carregando pacientes...</div>
      </div>
    )
  }

  return (
    <div className="personal-pacientes">
      <div className="pacientes-header">
        <div>
          <h2>Meus Pacientes</h2>
          <p className="subtitle">
            {pacientes.length} {pacientes.length === 1 ? 'paciente vinculado' : 'pacientes vinculados'}
          </p>
        </div>
        {pacientes.length === 0 && (
          <button
            className="btn-create-paciente"
            onClick={() => setShowCreateModal(true)}
          >
            + Criar Primeiro Paciente
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {pacientes.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não tem pacientes vinculados.</p>
          <p>Os pacientes serão vinculados a você quando você prescrever treinos para eles ou você pode criar um novo paciente.</p>
          <button
            className="btn-create-paciente-empty"
            onClick={() => setShowCreateModal(true)}
          >
            + Criar Primeiro Paciente
          </button>
        </div>
      ) : (
        <div className="pacientes-list">
          {pacientes.map(paciente => (
            <div
              key={paciente.id}
              className={`paciente-card ${selectedPaciente?.id === paciente.id ? 'selected' : ''}`}
              onClick={() => setSelectedPaciente(paciente)}
            >
              <div className="paciente-info">
                <h3>{paciente.name || paciente.email}</h3>
                <p className="paciente-email">{paciente.email}</p>
                {paciente.questionnaireData && (
                  <div className="paciente-data">
                    {paciente.questionnaireData.idade && (
                      <span className="data-item">
                        <strong>Idade:</strong> {paciente.questionnaireData.idade} anos
                      </span>
                    )}
                    {paciente.questionnaireData.pesoAtual && (
                      <span className="data-item">
                        <strong>Peso:</strong> {paciente.questionnaireData.pesoAtual} kg
                      </span>
                    )}
                    {paciente.questionnaireData.altura && (
                      <span className="data-item">
                        <strong>Altura:</strong> {paciente.questionnaireData.altura} cm
                      </span>
                    )}
                    {paciente.questionnaireData.objetivo && (
                      <span className="data-item">
                        <strong>Objetivo:</strong> {paciente.questionnaireData.objetivo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPaciente && (
        <div className="paciente-detail">
          <h3>Detalhes do Paciente</h3>
          <p><strong>Nome:</strong> {selectedPaciente.name || 'Não informado'}</p>
          <p><strong>Email:</strong> {selectedPaciente.email}</p>
          {selectedPaciente.questionnaireData && (
            <>
              {selectedPaciente.questionnaireData.idade && (
                <p><strong>Idade:</strong> {selectedPaciente.questionnaireData.idade} anos</p>
              )}
              {selectedPaciente.questionnaireData.sexo && (
                <p><strong>Sexo:</strong> {selectedPaciente.questionnaireData.sexo}</p>
              )}
              {selectedPaciente.questionnaireData.pesoAtual && (
                <p><strong>Peso:</strong> {selectedPaciente.questionnaireData.pesoAtual} kg</p>
              )}
              {selectedPaciente.questionnaireData.altura && (
                <p><strong>Altura:</strong> {selectedPaciente.questionnaireData.altura} cm</p>
              )}
              {selectedPaciente.questionnaireData.objetivo && (
                <p><strong>Objetivo:</strong> {selectedPaciente.questionnaireData.objetivo}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setNewPaciente({ email: '', password: '', name: '' })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Paciente</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPaciente({ email: '', password: '', name: '' })
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreatePaciente} className="create-paciente-form">
                <div className="form-group">
                  <label>Email: *</label>
                  <input
                    type="email"
                    value={newPaciente.email}
                    onChange={(e) => setNewPaciente({ ...newPaciente, email: e.target.value })}
                    placeholder="paciente@exemplo.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nome: *</label>
                  <input
                    type="text"
                    value={newPaciente.name}
                    onChange={(e) => setNewPaciente({ ...newPaciente, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Senha: *</label>
                  <input
                    type="password"
                    value={newPaciente.password}
                    onChange={(e) => setNewPaciente({ ...newPaciente, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creating}
                  >
                    {creating ? 'Criando...' : 'Criar Paciente'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewPaciente({ email: '', password: '', name: '' })
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalPacientes


