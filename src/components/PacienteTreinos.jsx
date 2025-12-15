import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PacienteTreinos.css'

function PacienteTreinos({ refreshTrigger }) {
  const [prescricoes, setPrescricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    loadTreinos()
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

      // Opcional: considerar apenas treinos ativos
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

  // Se não há treinos, não mostra nada (ou um bloco suave)
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
              <span className={`status-badge ${presc.ativo ? 'ativo' : 'inativo'}`}>
                {presc.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </header>

            {presc.observacoes && (
              <p className="treino-observacoes">{presc.observacoes}</p>
            )}

            <div className="treino-divisoes">
              {presc.divisoes.map((divisao) => (
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
              ))}
            </div>
          </article>
        ))}
      </div>

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



