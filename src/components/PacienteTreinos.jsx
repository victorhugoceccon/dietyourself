import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PacienteTreinos.css'

const DIAS_SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']
const DIAS_SEMANA_LABELS = {
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sáb',
  DOMINGO: 'Dom'
}

function PacienteTreinos({ refreshTrigger }) {
  const [prescricoes, setPrescricoes] = useState([])
  const [treinosExecutados, setTreinosExecutados] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [treinoParaFinalizar, setTreinoParaFinalizar] = useState(null)
  const [showSolicitacaoModal, setShowSolicitacaoModal] = useState(false)
  const [prescricaoParaSolicitar, setPrescricaoParaSolicitar] = useState(null)
  
  // Estados do formulário de feedback
  const [feedbackForm, setFeedbackForm] = useState({
    observacao: '',
    intensidade: 5,
    dificuldade: 5,
    satisfacao: 5,
    completouTreino: true,
    motivoIncompleto: ''
  })
  
  // Estados do formulário de solicitação
  const [solicitacaoForm, setSolicitacaoForm] = useState({
    titulo: '',
    mensagem: ''
  })

  useEffect(() => {
    loadTreinos()
    loadTreinosExecutados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadTreinos = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/prescricoes-treino`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setError('Erro ao carregar seus treinos')
        setPrescricoes([])
        return
      }

      const data = await response.json()
      const lista = Array.isArray(data.prescricoes) ? data.prescricoes : []
      const ativos = lista.filter((p) => p.ativo !== false)
      setPrescricoes(ativos)
    } catch (err) {
      console.error('Erro ao carregar treinos do paciente:', err)
      setError('Erro ao carregar seus treinos')
      setPrescricoes([])
    } finally {
      setLoading(false)
    }
  }

  const loadTreinosExecutados = async () => {
    try {
      const token = localStorage.getItem('token')
      const hoje = new Date().toISOString().split('T')[0]
      const response = await fetch(`${API_URL}/treinos-executados/semana/${hoje}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Organizar por prescricaoId e divisaoId
        const treinosMap = {}
        Object.keys(data.treinosPorDia || {}).forEach(dia => {
          data.treinosPorDia[dia].forEach(treino => {
            const key = `${treino.prescricaoId}-${treino.divisaoId}`
            if (!treinosMap[key]) {
              treinosMap[key] = {}
            }
            treinosMap[key][dia] = treino
          })
        })
        setTreinosExecutados(treinosMap)
      }
    } catch (err) {
      console.error('Erro ao carregar treinos executados:', err)
    }
  }

  const getDiaSemanaAtual = () => {
    const hoje = new Date()
    const dia = hoje.getDay()
    const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
    return dias[dia]
  }

  const handleIniciarTreino = async (prescricaoId, divisaoId) => {
    try {
      const token = localStorage.getItem('token')
      const diaSemana = getDiaSemanaAtual()
      
      const response = await fetch(`${API_URL}/treinos-executados/iniciar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescricaoId,
          divisaoId,
          diaSemana
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao iniciar treino')
        return
      }

      await loadTreinosExecutados()
      alert('Treino iniciado com sucesso!')
    } catch (err) {
      console.error('Erro ao iniciar treino:', err)
      alert('Erro ao iniciar treino')
    }
  }

  const handleFinalizarTreino = (treinoExecutado) => {
    setTreinoParaFinalizar(treinoExecutado)
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async () => {
    if (!treinoParaFinalizar) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/treinos-executados/finalizar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          treinoExecutadoId: treinoParaFinalizar.id,
          ...feedbackForm
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao finalizar treino')
        return
      }

      setShowFeedbackModal(false)
      setTreinoParaFinalizar(null)
      setFeedbackForm({
        observacao: '',
        intensidade: 5,
        dificuldade: 5,
        satisfacao: 5,
        completouTreino: true,
        motivoIncompleto: ''
      })
      await loadTreinosExecutados()
      alert('Treino finalizado com sucesso! Seu feedback foi enviado ao personal.')
    } catch (err) {
      console.error('Erro ao finalizar treino:', err)
      alert('Erro ao finalizar treino')
    }
  }

  const handleAbrirSolicitacao = (prescricao) => {
    setPrescricaoParaSolicitar(prescricao)
    setShowSolicitacaoModal(true)
  }

  const handleSubmitSolicitacao = async () => {
    if (!prescricaoParaSolicitar || !solicitacaoForm.titulo || !solicitacaoForm.mensagem) {
      alert('Preencha todos os campos')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/solicitacoes-mudanca`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalId: prescricaoParaSolicitar.personalId,
          prescricaoId: prescricaoParaSolicitar.id,
          titulo: solicitacaoForm.titulo,
          mensagem: solicitacaoForm.mensagem
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao enviar solicitação')
        return
      }

      setShowSolicitacaoModal(false)
      setPrescricaoParaSolicitar(null)
      setSolicitacaoForm({ titulo: '', mensagem: '' })
      alert('Solicitação enviada com sucesso! O personal será notificado.')
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err)
      alert('Erro ao enviar solicitação')
    }
  }

  const getTreinoExecutado = (prescricaoId, divisaoId, diaSemana) => {
    const key = `${prescricaoId}-${divisaoId}`
    return treinosExecutados[key]?.[diaSemana] || null
  }

  if (loading) {
    return (
      <section className="treinos-section">
        <div className="section-header">
          <h2>Seus Treinos</h2>
          <span className="badge badge-personal">Personal</span>
        </div>
        <div className="treinos-loading">Carregando treinos...</div>
      </section>
    )
  }

  if (!prescricoes.length) {
    return null
  }

  return (
    <section className="treinos-section">
      <div className="section-header">
        <h2>Seus Treinos</h2>
        <span className="badge badge-personal">Personal</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="treinos-list">
        {prescricoes.map((presc) => (
          <article key={presc.id} className="treino-card">
            <header className="treino-card-header">
              <div>
                <h3>{presc.nome}</h3>
                <p className="treino-personal">
                  Prescrito por:{' '}
                  {presc.personal?.name || presc.personal?.email || 'Seu personal'}
                </p>
              </div>
              <div className="treino-header-actions">
                <span className={`status-badge ${presc.ativo ? 'ativo' : 'inativo'}`}>
                  {presc.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  className="btn-solicitar-mudanca"
                  onClick={() => handleAbrirSolicitacao(presc)}
                  title="Solicitar mudança ao personal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Solicitar Mudança
                </button>
              </div>
            </header>

            {presc.observacoes && (
              <p className="treino-observacoes">{presc.observacoes}</p>
            )}

            <div className="treino-divisoes">
              {presc.divisoes.map((divisao) => {
                const treinoHoje = getTreinoExecutado(presc.id, divisao.id, getDiaSemanaAtual())
                const treinoIniciado = treinoHoje && !treinoHoje.finalizado
                
                return (
                  <div key={divisao.id} className="treino-divisao-card">
                    <div className="treino-divisao-header">
                      <div className="treino-divisao-title">
                        <span className="treino-divisao-badge">
                          Dia {divisao.ordem}
                        </span>
                        <h4>{divisao.nome}</h4>
                      </div>
                      <span className="treino-divisao-count">
                        {divisao.itens.length} exercício
                        {divisao.itens.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Barra de dias da semana */}
                    <div className="semana-treinos-bar">
                      {DIAS_SEMANA.map((dia) => {
                        const treinoDia = getTreinoExecutado(presc.id, divisao.id, dia)
                        const finalizado = treinoDia?.finalizado || false
                        const hoje = dia === getDiaSemanaAtual()
                        
                        return (
                          <div
                            key={dia}
                            className={`dia-semana-item ${hoje ? 'hoje' : ''} ${finalizado ? 'finalizado' : ''}`}
                            title={DIAS_SEMANA_LABELS[dia]}
                          >
                            <span className="dia-label">{DIAS_SEMANA_LABELS[dia]}</span>
                            {finalizado && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Botão de iniciar/finalizar treino */}
                    {!treinoIniciado && !treinoHoje?.finalizado && (
                      <button
                        className="btn-iniciar-treino"
                        onClick={() => handleIniciarTreino(presc.id, divisao.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Iniciar Treino
                      </button>
                    )}

                    {treinoIniciado && (
                      <button
                        className="btn-finalizar-treino"
                        onClick={() => handleFinalizarTreino(treinoHoje)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Finalizar Treino
                      </button>
                    )}

                    <div className="treino-exercicios-grid">
                      {divisao.itens.map((item, index) => (
                        <div key={item.id} className="exercicio-card">
                          <div className="exercicio-card-header">
                            <div className="exercicio-number">{index + 1}</div>
                            <div className="exercicio-title-section">
                              <h5 className="exercicio-nome">
                                {item.exercicio?.nome || 'Exercício'}
                              </h5>
                              {item.exercicio?.categoria && (
                                <span className="exercicio-categoria-badge">
                                  {item.exercicio.categoria}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="exercicio-specs">
                            <div className="spec-item">
                              <span className="spec-label">Séries</span>
                              <span className="spec-value">{item.series}x</span>
                            </div>
                            {item.repeticoes && (
                              <div className="spec-item">
                                <span className="spec-label">Repetições</span>
                                <span className="spec-value">{item.repeticoes}</span>
                              </div>
                            )}
                            {item.carga && (
                              <div className="spec-item">
                                <span className="spec-label">Carga</span>
                                <span className="spec-value">{item.carga}</span>
                              </div>
                            )}
                            {item.descanso && (
                              <div className="spec-item">
                                <span className="spec-label">Descanso</span>
                                <span className="spec-value">{item.descanso}</span>
                              </div>
                            )}
                          </div>

                          {item.exercicio?.descricao && (
                            <div className="exercicio-descricao">
                              <p>{item.exercicio.descricao}</p>
                            </div>
                          )}

                          {item.exercicio?.videoUrl && (
                            <button
                              className="btn-watch-video"
                              onClick={() => setSelectedVideo({
                                url: item.exercicio.videoUrl,
                                nome: item.exercicio.nome
                              })}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                              Ver Vídeo
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      {/* Modal de Feedback */}
      {showFeedbackModal && treinoParaFinalizar && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Finalizar Treino</h3>
              <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="feedback-intro">Conte-nos sobre sua experiência com este treino:</p>
              
              <div className="form-group">
                <label>Você completou todo o treino?</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      checked={feedbackForm.completouTreino}
                      onChange={() => setFeedbackForm({ ...feedbackForm, completouTreino: true })}
                    />
                    Sim, completei tudo
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={!feedbackForm.completouTreino}
                      onChange={() => setFeedbackForm({ ...feedbackForm, completouTreino: false })}
                    />
                    Não, não completei
                  </label>
                </div>
              </div>

              {!feedbackForm.completouTreino && (
                <div className="form-group">
                  <label>Motivo por não ter completado:</label>
                  <textarea
                    value={feedbackForm.motivoIncompleto}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, motivoIncompleto: e.target.value })}
                    placeholder="Descreva o motivo..."
                    rows="3"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Intensidade percebida (1-10): {feedbackForm.intensidade}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.intensidade}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, intensidade: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Dificuldade percebida (1-10): {feedbackForm.dificuldade}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.dificuldade}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, dificuldade: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Satisfação com o treino (1-10): {feedbackForm.satisfacao}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.satisfacao}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, satisfacao: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Observações (opcional):</label>
                <textarea
                  value={feedbackForm.observacao}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, observacao: e.target.value })}
                  placeholder="Compartilhe suas observações sobre o treino..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmitFeedback}>
                Finalizar Treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitação */}
      {showSolicitacaoModal && prescricaoParaSolicitar && (
        <div className="modal-overlay" onClick={() => setShowSolicitacaoModal(false)}>
          <div className="modal-content solicitacao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Solicitar Mudança</h3>
              <button className="modal-close" onClick={() => setShowSolicitacaoModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="solicitacao-intro">
                Envie uma solicitação ao seu personal trainer para ajustes no treino "{prescricaoParaSolicitar.nome}".
              </p>
              
              <div className="form-group">
                <label>Título da solicitação *</label>
                <input
                  type="text"
                  value={solicitacaoForm.titulo}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, titulo: e.target.value })}
                  placeholder="Ex: Ajustar carga do exercício X"
                />
              </div>

              <div className="form-group">
                <label>Mensagem detalhada *</label>
                <textarea
                  value={solicitacaoForm.mensagem}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, mensagem: e.target.value })}
                  placeholder="Descreva o que você gostaria de mudar ou solicitar..."
                  rows="6"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSolicitacaoModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmitSolicitacao}>
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vídeo */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{selectedVideo.nome}</h3>
              <button
                className="video-modal-close"
                onClick={() => setSelectedVideo(null)}
              >
                ✕
              </button>
            </div>
            <div className="video-modal-body">
              <video
                controls
                autoPlay
                className="video-modal-player"
              >
                <source src={selectedVideo.url} type="video/mp4" />
                <source src={selectedVideo.url} type="video/webm" />
                <source src={selectedVideo.url} type="video/ogg" />
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PacienteTreinos
