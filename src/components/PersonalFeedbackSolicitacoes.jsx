import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PersonalFeedbackSolicitacoes.css'

function PersonalFeedbackSolicitacoes() {
  const [activeTab, setActiveTab] = useState('feedback') // 'feedback' ou 'solicitacoes'
  const [feedbacks, setFeedbacks] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null)
  const [respostaForm, setRespostaForm] = useState({
    resposta: '',
    status: 'EM_ANALISE'
  })

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbacks()
    } else {
      loadSolicitacoes()
    }
  }, [activeTab])

  const loadFeedbacks = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/treinos-executados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setError('Erro ao carregar feedbacks')
        setFeedbacks([])
        return
      }

      const data = await response.json()
      const treinosComFeedback = (data.treinosExecutados || [])
        .filter(t => t.feedback && t.finalizado)
        .sort((a, b) => new Date(b.dataExecucao) - new Date(a.dataExecucao))
      
      setFeedbacks(treinosComFeedback)
    } catch (err) {
      console.error('Erro ao carregar feedbacks:', err)
      setError('Erro ao carregar feedbacks')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  const loadSolicitacoes = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/solicitacoes-mudanca`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setError('Erro ao carregar solicitações')
        setSolicitacoes([])
        return
      }

      const data = await response.json()
      const lista = (data.solicitacoes || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setSolicitacoes(lista)
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err)
      setError('Erro ao carregar solicitações')
      setSolicitacoes([])
    } finally {
      setLoading(false)
    }
  }

  const handleResponderSolicitacao = async () => {
    if (!selectedSolicitacao || !respostaForm.resposta.trim()) {
      alert('Preencha a resposta')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/solicitacoes-mudanca/${selectedSolicitacao.id}/responder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(respostaForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao responder solicitação')
        return
      }

      setSelectedSolicitacao(null)
      setRespostaForm({ resposta: '', status: 'EM_ANALISE' })
      await loadSolicitacoes()
      alert('Resposta enviada com sucesso!')
    } catch (err) {
      console.error('Erro ao responder solicitação:', err)
      alert('Erro ao responder solicitação')
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      PENDENTE: 'status-pendente',
      EM_ANALISE: 'status-analise',
      RESOLVIDA: 'status-resolvida',
      REJEITADA: 'status-rejeitada'
    }
    return statusMap[status] || 'status-pendente'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDENTE: 'Pendente',
      EM_ANALISE: 'Em Análise',
      RESOLVIDA: 'Resolvida',
      REJEITADA: 'Rejeitada'
    }
    return statusMap[status] || status
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="personal-feedback-solicitacoes">
        <div className="loading-state">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="personal-feedback-solicitacoes">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Feedbacks dos Treinos
        </button>
        <button
          className={`tab-btn ${activeTab === 'solicitacoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('solicitacoes')}
        >
          Solicitações de Mudança
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'feedback' && (
        <div className="feedbacks-list">
          {feedbacks.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum feedback recebido ainda.</p>
            </div>
          ) : (
            feedbacks.map((treino) => (
              <div key={treino.id} className="feedback-card">
                <div className="feedback-header">
                  <div>
                    <h4>{treino.prescricao?.nome || 'Treino'}</h4>
                    <p className="feedback-paciente">
                      Aluno: {treino.paciente?.name || treino.paciente?.email || 'N/A'}
                    </p>
                    <p className="feedback-data">
                      {treino.divisao?.nome} • {formatDate(treino.dataExecucao)}
                    </p>
                  </div>
                  {treino.feedback?.completouTreino ? (
                    <span className="badge badge-success">Completo</span>
                  ) : (
                    <span className="badge badge-incomplete">Incompleto</span>
                  )}
                </div>

                {treino.feedback && (
                  <div className="feedback-content">
                    {!treino.feedback.completouTreino && treino.feedback.motivoIncompleto && (
                      <div className="feedback-item">
                        <strong>Motivo por não completar:</strong>
                        <p>{treino.feedback.motivoIncompleto}</p>
                      </div>
                    )}

                    <div className="feedback-metrics">
                      {treino.feedback.intensidade && (
                        <div className="metric-item">
                          <span className="metric-label">Intensidade:</span>
                          <span className="metric-value">{treino.feedback.intensidade}/10</span>
                        </div>
                      )}
                      {treino.feedback.dificuldade && (
                        <div className="metric-item">
                          <span className="metric-label">Dificuldade:</span>
                          <span className="metric-value">{treino.feedback.dificuldade}/10</span>
                        </div>
                      )}
                      {treino.feedback.satisfacao && (
                        <div className="metric-item">
                          <span className="metric-label">Satisfação:</span>
                          <span className="metric-value">{treino.feedback.satisfacao}/10</span>
                        </div>
                      )}
                    </div>

                    {treino.feedback.observacao && (
                      <div className="feedback-item">
                        <strong>Observações:</strong>
                        <p>{treino.feedback.observacao}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'solicitacoes' && (
        <div className="solicitacoes-list">
          {solicitacoes.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma solicitação recebida ainda.</p>
            </div>
          ) : (
            solicitacoes.map((solicitacao) => (
              <div key={solicitacao.id} className="solicitacao-card">
                <div className="solicitacao-header">
                  <div>
                    <h4>{solicitacao.titulo}</h4>
                    <p className="solicitacao-paciente">
                      Aluno: {solicitacao.paciente?.name || solicitacao.paciente?.email || 'N/A'}
                    </p>
                    {solicitacao.prescricao && (
                      <p className="solicitacao-treino">
                        Treino: {solicitacao.prescricao.nome}
                      </p>
                    )}
                    <p className="solicitacao-data">
                      {formatDate(solicitacao.createdAt)}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(solicitacao.status)}`}>
                    {getStatusLabel(solicitacao.status)}
                  </span>
                </div>

                <div className="solicitacao-content">
                  <div className="solicitacao-mensagem">
                    <strong>Mensagem:</strong>
                    <p>{solicitacao.mensagem}</p>
                  </div>

                  {solicitacao.resposta && (
                    <div className="solicitacao-resposta">
                      <strong>Sua Resposta:</strong>
                      <p>{solicitacao.resposta}</p>
                    </div>
                  )}

                  {!solicitacao.resposta && solicitacao.status === 'PENDENTE' && (
                    <button
                      className="btn-responder"
                      onClick={() => setSelectedSolicitacao(solicitacao)}
                    >
                      Responder Solicitação
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Resposta */}
      {selectedSolicitacao && (
        <div className="modal-overlay" onClick={() => setSelectedSolicitacao(null)}>
          <div className="modal-content resposta-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Responder Solicitação</h3>
              <button className="modal-close" onClick={() => setSelectedSolicitacao(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="solicitacao-info">
                <h4>{selectedSolicitacao.titulo}</h4>
                <p><strong>Aluno:</strong> {selectedSolicitacao.paciente?.name || selectedSolicitacao.paciente?.email}</p>
                <p><strong>Mensagem:</strong></p>
                <p className="mensagem-original">{selectedSolicitacao.mensagem}</p>
              </div>

              <div className="form-group">
                <label>Sua Resposta *</label>
                <textarea
                  value={respostaForm.resposta}
                  onChange={(e) => setRespostaForm({ ...respostaForm, resposta: e.target.value })}
                  placeholder="Digite sua resposta ao aluno..."
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={respostaForm.status}
                  onChange={(e) => setRespostaForm({ ...respostaForm, status: e.target.value })}
                >
                  <option value="EM_ANALISE">Em Análise</option>
                  <option value="RESOLVIDA">Resolvida</option>
                  <option value="REJEITADA">Rejeitada</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedSolicitacao(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleResponderSolicitacao}>
                Enviar Resposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalFeedbackSolicitacoes

