import { useState, useEffect } from 'react'
import './PacienteTreinos.css'

const API_URL = 'http://localhost:5000/api'

function PacienteTreinos({ refreshTrigger }) {
  const [prescricoes, setPrescricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

                  <ul className="treino-exercicios-list">
                    {divisao.itens.map((item) => (
                      <li key={item.id} className="treino-exercicio-item">
                        <div className="treino-exercicio-main">
                          <span className="treino-exercicio-nome">
                            {item.exercicio?.nome || 'Exercício'}
                          </span>
                          {item.exercicio?.categoria && (
                            <span className="treino-exercicio-categoria">
                              {item.exercicio.categoria}
                            </span>
                          )}
                        </div>
                        <div className="treino-exercicio-detalhes">
                          <span>
                            {item.series}x
                            {item.repeticoes ? ` ${item.repeticoes}` : ''}
                          </span>
                          {item.carga && <span>• {item.carga}</span>}
                          {item.descanso && <span>• Descanso: {item.descanso}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PacienteTreinos


