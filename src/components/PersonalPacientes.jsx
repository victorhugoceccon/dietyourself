import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PersonalPacientes.css'

function PersonalPacientes() {
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAluno, setSelectedAluno] = useState(null)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAluno, setNewAluno] = useState({ email: '', password: '', name: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadAlunos()
  }, [])

  const loadAlunos = async () => {
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
        setAlunos(data.pacientes || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar alunos')
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      setError('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAluno = async (e) => {
    e.preventDefault()
    
    if (!newAluno.email || !newAluno.password || !newAluno.name) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (newAluno.password.length < 6) {
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
        body: JSON.stringify(newAluno)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar aluno')
      }

      // Recarregar lista
      await loadAlunos()
      
      // Fechar modal e limpar formulário
      setShowCreateModal(false)
      setNewAluno({ email: '', password: '', name: '' })
      alert('Aluno criado e vinculado com sucesso!')
    } catch (error) {
      alert(error.message || 'Erro ao criar aluno')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="personal-pacientes">
        <div className="loading">Carregando alunos...</div>
      </div>
    )
  }

  return (
    <div className="personal-pacientes">
      <div className="pacientes-header">
        <div>
          <h2>Meus Alunos</h2>
          <p className="subtitle">
            {alunos.length} {alunos.length === 1 ? 'aluno vinculado' : 'alunos vinculados'}
          </p>
        </div>
        <button
          className="btn-create-paciente"
          onClick={() => setShowCreateModal(true)}
        >
          + Criar Novo Aluno
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {alunos.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não tem alunos vinculados.</p>
          <p>Os alunos serão vinculados a você quando você prescrever treinos para eles ou você pode criar um novo aluno.</p>
        </div>
      ) : (
        <div className="pacientes-list">
          {alunos.map(aluno => (
            <div
              key={aluno.id}
              className={`paciente-card ${selectedAluno?.id === aluno.id ? 'selected' : ''}`}
              onClick={() => setSelectedAluno(aluno)}
            >
              <div className="paciente-info">
                <h3>{aluno.name || aluno.email}</h3>
                <p className="paciente-email">{aluno.email}</p>
                {aluno.questionnaireData && (
                  <div className="paciente-data">
                    {aluno.questionnaireData.idade && (
                      <span className="data-item">
                        <strong>Idade:</strong> {aluno.questionnaireData.idade} anos
                      </span>
                    )}
                    {aluno.questionnaireData.pesoAtual && (
                      <span className="data-item">
                        <strong>Peso:</strong> {aluno.questionnaireData.pesoAtual} kg
                      </span>
                    )}
                    {aluno.questionnaireData.altura && (
                      <span className="data-item">
                        <strong>Altura:</strong> {aluno.questionnaireData.altura} cm
                      </span>
                    )}
                    {aluno.questionnaireData.objetivo && (
                      <span className="data-item">
                        <strong>Objetivo:</strong> {aluno.questionnaireData.objetivo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAluno && (
        <div className="paciente-detail">
          <h3>Detalhes do Aluno</h3>
          <p><strong>Nome:</strong> {selectedAluno.name || 'Não informado'}</p>
          <p><strong>Email:</strong> {selectedAluno.email}</p>
          {selectedAluno.questionnaireData && (
            <>
              {selectedAluno.questionnaireData.idade && (
                <p><strong>Idade:</strong> {selectedAluno.questionnaireData.idade} anos</p>
              )}
              {selectedAluno.questionnaireData.sexo && (
                <p><strong>Sexo:</strong> {selectedAluno.questionnaireData.sexo}</p>
              )}
              {selectedAluno.questionnaireData.pesoAtual && (
                <p><strong>Peso:</strong> {selectedAluno.questionnaireData.pesoAtual} kg</p>
              )}
              {selectedAluno.questionnaireData.altura && (
                <p><strong>Altura:</strong> {selectedAluno.questionnaireData.altura} cm</p>
              )}
              {selectedAluno.questionnaireData.objetivo && (
                <p><strong>Objetivo:</strong> {selectedAluno.questionnaireData.objetivo}</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setNewAluno({ email: '', password: '', name: '' })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Aluno</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewAluno({ email: '', password: '', name: '' })
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateAluno} className="create-paciente-form">
                <div className="form-group">
                  <label>Email: *</label>
                  <input
                    type="email"
                    value={newAluno.email}
                    onChange={(e) => setNewAluno({ ...newAluno, email: e.target.value })}
                    placeholder="aluno@exemplo.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nome: *</label>
                  <input
                    type="text"
                    value={newAluno.name}
                    onChange={(e) => setNewAluno({ ...newAluno, name: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Senha: *</label>
                  <input
                    type="password"
                    value={newAluno.password}
                    onChange={(e) => setNewAluno({ ...newAluno, password: e.target.value })}
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
                    {creating ? 'Criando...' : 'Criar Aluno'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewAluno({ email: '', password: '', name: '' })
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


