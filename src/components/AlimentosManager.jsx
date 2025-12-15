import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './AlimentosManager.css'

const API_URL = 'http://localhost:5000/api'

function AlimentosManager() {
  const [alimentos, setAlimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedAlimento, setSelectedAlimento] = useState(null)
  const [pesoGramas, setPesoGramas] = useState('')
  const [calculado, setCalculado] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 18 // 3 linhas x 3 colunas x 2 páginas visíveis
  const [newAlimento, setNewAlimento] = useState({
    descricao: '',
    categoria: '',
    energiaKcal: '',
    proteina: '',
    lipideos: '',
    carboidrato: '',
    umidade: ''
  })
  const [creating, setCreating] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    loadAlimentos()
  }, [])

  const loadAlimentos = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlimentos(data.alimentos || [])
      } else {
        setError('Erro ao carregar alimentos')
      }
    } catch (error) {
      console.error('Erro ao carregar alimentos:', error)
      setError('Erro ao carregar alimentos')
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async () => {
    setCreating(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos/import-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        alert(`Importação concluída! ${data.imported} alimentos importados, ${data.skipped} ignorados.`)
        loadAlimentos()
      } else {
        setError(data.error || 'Erro ao importar CSV')
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error)
      setError('Erro ao importar alimentos do CSV')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateAlimento = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          descricao: newAlimento.descricao,
          categoria: newAlimento.categoria || null,
          energiaKcal: parseFloat(newAlimento.energiaKcal) || 0,
          proteina: parseFloat(newAlimento.proteina) || 0,
          lipideos: parseFloat(newAlimento.lipideos) || 0,
          carboidrato: parseFloat(newAlimento.carboidrato) || 0,
          umidade: newAlimento.umidade ? parseFloat(newAlimento.umidade) : null
        })
      })

      const data = await response.json()
      if (response.ok) {
        setShowModal(false)
        setNewAlimento({
          descricao: '',
          categoria: '',
          energiaKcal: '',
          proteina: '',
          lipideos: '',
          carboidrato: '',
          umidade: ''
        })
        loadAlimentos()
      } else {
        setError(data.error || 'Erro ao criar alimento')
      }
    } catch (error) {
      console.error('Erro ao criar alimento:', error)
      setError('Erro ao criar alimento')
    } finally {
      setCreating(false)
    }
  }

  const handleCalcular = async (alimento) => {
    if (!pesoGramas || parseFloat(pesoGramas) <= 0) {
      setError('Informe um peso válido em gramas')
      return
    }

    setCalculando(true)
    setError('')
    setSelectedAlimento(alimento)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos/calcular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alimentoId: alimento.id,
          pesoGramas: parseFloat(pesoGramas)
        })
      })

      const data = await response.json()
      if (response.ok) {
        setCalculado(data.calculado)
      } else {
        setError(data.error || 'Erro ao calcular')
      }
    } catch (error) {
      console.error('Erro ao calcular:', error)
      setError('Erro ao calcular valores')
    } finally {
      setCalculando(false)
    }
  }

  // Filtrar e paginar alimentos
  const filteredAlimentos = alimentos.filter(alimento =>
    alimento.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (alimento.categoria && alimento.categoria.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalPages = Math.ceil(filteredAlimentos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAlimentos = filteredAlimentos.slice(startIndex, endIndex)

  const handleSelectAlimento = (alimento) => {
    setSelectedAlimento(alimento)
    setCalculado(null)
  }

  if (loading) {
    return (
      <div className="alimentos-manager">
        <div className="loading">Carregando alimentos...</div>
      </div>
    )
  }

  return (
    <div className={`alimentos-manager ${theme}`}>
      <div className="alimentos-manager-content">
        {/* Sidebar com lista de alimentos - ocupa toda a largura */}
        <aside className="alimentos-sidebar">
          <div className="sidebar-header">
            <h2>Alimentos ({alimentos.length})</h2>
            <div className="header-actions-compact">
              <button
                onClick={handleImportCSV}
                disabled={creating}
                className="btn-icon"
                title="Importar do CSV"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn-icon primary"
                title="Novo Alimento"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="sidebar-search">
            <input
              type="text"
              placeholder="Buscar alimentos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="search-input"
            />
          </div>

          <div className="alimentos-scroll-container">
            <div className="alimentos-grid-compact">
              {paginatedAlimentos.map((alimento) => (
                <div
                  key={alimento.id}
                  className={`alimento-card-compact ${selectedAlimento?.id === alimento.id ? 'active' : ''}`}
                  onClick={() => handleSelectAlimento(alimento)}
                >
                  <div className="alimento-name-compact">{alimento.descricao}</div>
                  {alimento.categoria && (
                    <div className="alimento-categoria-compact">{alimento.categoria}</div>
                  )}
                  <div className="alimento-kcal-compact">{alimento.energiaKcal} kcal/100g</div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Próxima
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Modal de detalhes do alimento */}
      {selectedAlimento && (
        <div className="alimento-detail-modal-overlay" onClick={() => setSelectedAlimento(null)}>
          <div className="alimento-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-detail-header">
              <div>
                <h2>{selectedAlimento.descricao}</h2>
                {selectedAlimento.categoria && (
                  <p className="detail-category">{selectedAlimento.categoria}</p>
                )}
              </div>
              <button 
                className="modal-detail-close"
                onClick={() => setSelectedAlimento(null)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-detail-content">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {/* Informações nutricionais base (100g) */}
              <div className="nutrition-base-section">
                <h3>Valores Nutricionais (por 100g)</h3>
                <div className="nutrition-cards-base">
                  <div className="nutrition-card-base">
                    <div className="card-icon-base energy">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="card-content-base">
                      <div className="card-label">Energia</div>
                      <div className="card-value">{selectedAlimento.energiaKcal}</div>
                      <div className="card-unit">kcal</div>
                    </div>
                  </div>
                  <div className="nutrition-card-base">
                    <div className="card-icon-base protein">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="card-content-base">
                      <div className="card-label">Proteína</div>
                      <div className="card-value">{selectedAlimento.proteina}</div>
                      <div className="card-unit">g</div>
                    </div>
                  </div>
                  <div className="nutrition-card-base">
                    <div className="card-icon-base fat">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="card-content-base">
                      <div className="card-label">Lipídios</div>
                      <div className="card-value">{selectedAlimento.lipideos}</div>
                      <div className="card-unit">g</div>
                    </div>
                  </div>
                  <div className="nutrition-card-base">
                    <div className="card-icon-base carb">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="card-content-base">
                      <div className="card-label">Carboidrato</div>
                      <div className="card-value">{selectedAlimento.carboidrato}</div>
                      <div className="card-unit">g</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculadora */}
              <div className="calculo-section-detail">
                <h3>Calcular para Peso Específico</h3>
                <div className="calculo-input-detail">
                  <input
                    type="number"
                    placeholder="Peso em gramas (ex: 100, 150, 200)"
                    value={pesoGramas}
                    onChange={(e) => {
                      setPesoGramas(e.target.value)
                      setCalculado(null)
                    }}
                    min="1"
                    step="1"
                    className="peso-input"
                  />
                  <button
                    onClick={() => handleCalcular(selectedAlimento)}
                    disabled={!pesoGramas || calculando}
                    className="btn-calcular-detail"
                  >
                    {calculando ? 'Calculando...' : 'Calcular'}
                  </button>
                </div>

                {calculado && (
                  <div className="calculo-result-detail">
                    <h4>Resultado para {pesoGramas}g</h4>
                    <div className="result-cards-detail">
                      <div className="result-card-detail">
                        <div className="result-label-detail">Energia</div>
                        <div className="result-value-detail">{calculado.energiaKcal}</div>
                        <div className="result-unit-detail">kcal</div>
                      </div>
                      <div className="result-card-detail">
                        <div className="result-label-detail">Proteína</div>
                        <div className="result-value-detail">{calculado.proteina}</div>
                        <div className="result-unit-detail">g</div>
                      </div>
                      <div className="result-card-detail">
                        <div className="result-label-detail">Lipídios</div>
                        <div className="result-value-detail">{calculado.lipideos}</div>
                        <div className="result-unit-detail">g</div>
                      </div>
                      <div className="result-card-detail">
                        <div className="result-label-detail">Carboidrato</div>
                        <div className="result-value-detail">{calculado.carboidrato}</div>
                        <div className="result-unit-detail">g</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para criar alimento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cadastrar Novo Alimento</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleCreateAlimento} className="alimento-form">
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  value={newAlimento.descricao}
                  onChange={(e) => setNewAlimento({ ...newAlimento, descricao: e.target.value })}
                  required
                  placeholder="Ex: Arroz, integral, cozido"
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input
                  type="text"
                  value={newAlimento.categoria}
                  onChange={(e) => setNewAlimento({ ...newAlimento, categoria: e.target.value })}
                  placeholder="Ex: Cereais e derivados"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Energia (kcal por 100g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlimento.energiaKcal}
                    onChange={(e) => setNewAlimento({ ...newAlimento, energiaKcal: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Proteína (g por 100g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlimento.proteina}
                    onChange={(e) => setNewAlimento({ ...newAlimento, proteina: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lipídios (g por 100g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlimento.lipideos}
                    onChange={(e) => setNewAlimento({ ...newAlimento, lipideos: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Carboidrato (g por 100g) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlimento.carboidrato}
                    onChange={(e) => setNewAlimento({ ...newAlimento, carboidrato: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Umidade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.umidade}
                  onChange={(e) => setNewAlimento({ ...newAlimento, umidade: e.target.value })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlimentosManager

