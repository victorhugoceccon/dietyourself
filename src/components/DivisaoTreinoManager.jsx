import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './DivisaoTreinoManager.css'

function DivisaoTreinoManager() {
  const [divisoes, setDivisoes] = useState([])
  const [exercicios, setExercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDivisao, setEditingDivisao] = useState(null)
  const [error, setError] = useState('')
  const [newDivisao, setNewDivisao] = useState({
    nome: '',
    descricao: '',
    diasSemana: ''
  })
  const [saving, setSaving] = useState(false)

  const handleAddItem = () => {
    setNewDivisao((prev) => ({
      ...prev,
      itens: [
        ...(prev.itens || []),
        {
          exercicioId: '',
          series: 3,
          repeticoes: '',
          carga: '',
          descanso: '',
          ordem: (prev.itens?.length || 0) + 1
        }
      ]
    }))
  }

  const handleUpdateItem = (index, field, value) => {
    setNewDivisao((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }))
  }

  const handleRemoveItem = (index) => {
    setNewDivisao((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        ordem: i + 1
      }))
    }))
  }

  useEffect(() => {
    loadDivisoes()
    loadExercicios()
  }, [])

  const loadExercicios = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExercicios(data.exercicios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error)
    }
  }

  const loadDivisoes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/divisoes-treino`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDivisoes(data.divisoes || [])
      } else {
        setError('Erro ao carregar divisões')
      }
    } catch (error) {
      console.error('Erro ao carregar divisões:', error)
      setError('Erro ao carregar divisões')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (divisao = null) => {
    if (divisao) {
      setEditingDivisao(divisao.id)
      setNewDivisao({
        nome: divisao.nome,
        descricao: divisao.descricao || '',
        diasSemana: divisao.diasSemana || '',
        itens:
          Array.isArray(divisao.itens) && divisao.itens.length > 0
            ? divisao.itens
                .slice()
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map((item) => ({
                  id: item.id,
                  exercicioId: item.exercicioId,
                  series: item.series || 3,
                  repeticoes: item.repeticoes || '',
                  carga: item.carga || '',
                  descanso: item.descanso || '',
                  ordem: item.ordem || 1
                }))
            : []
      })
    } else {
      setEditingDivisao(null)
      setNewDivisao({
        nome: '',
        descricao: '',
        diasSemana: '',
        itens: []
      })
    }
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingDivisao(null)
    setNewDivisao({
      nome: '',
      descricao: '',
        diasSemana: '',
        itens: []
    })
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = editingDivisao
        ? `${API_URL}/divisoes-treino/${editingDivisao}`
        : `${API_URL}/divisoes-treino`
      
      const method = editingDivisao ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: newDivisao.nome,
          descricao: newDivisao.descricao || null,
          diasSemana: newDivisao.diasSemana || null,
          itens:
            Array.isArray(newDivisao.itens) && newDivisao.itens.length > 0
              ? newDivisao.itens.map((item, index) => ({
                  exercicioId: item.exercicioId,
                  series: parseInt(item.series) || 3,
                  repeticoes: item.repeticoes || null,
                  carga: item.carga || null,
                  descanso: item.descanso || null,
                  ordem: item.ordem || index + 1
                }))
              : []
        })
      })

      const data = await response.json()

      if (response.ok) {
        handleCloseModal()
        loadDivisoes()
      } else {
        setError(data.error || 'Erro ao salvar divisão')
      }
    } catch (error) {
      console.error('Erro ao salvar divisão:', error)
      setError('Erro ao salvar divisão')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta divisão?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/divisoes-treino/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadDivisoes()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao deletar divisão')
      }
    } catch (error) {
      console.error('Erro ao deletar divisão:', error)
      alert('Erro ao deletar divisão')
    }
  }

  if (loading) {
    return (
      <div className="divisoes-manager">
        <div className="loading">Carregando divisões...</div>
      </div>
    )
  }

  return (
    <div className="divisoes-manager">
      <div className="divisoes-header">
        <h2>Divisões de Treino</h2>
        <button
          className="btn-primary"
          onClick={() => handleOpenModal()}
        >
          + Nova Divisão
        </button>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="divisoes-list">
        {divisoes.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma divisão criada ainda.</p>
            <p>Crie sua primeira divisão de treino!</p>
          </div>
        ) : (
          divisoes.map(divisao => (
            <div key={divisao.id} className="divisao-card">
              <div className="divisao-content">
                <h3>{divisao.nome}</h3>
                {divisao.descricao && (
                  <p className="divisao-descricao">{divisao.descricao}</p>
                )}
                {divisao.diasSemana && (
                  <p className="divisao-dias">
                    <strong>Dias:</strong> {divisao.diasSemana}
                  </p>
                )}

                {Array.isArray(divisao.itens) && divisao.itens.length > 0 && (
                  <div className="divisao-exercicios">
                    <span className="divisao-exercicios-title">
                      Exercícios modelo ({divisao.itens.length})
                    </span>
                    <ul className="divisao-exercicios-list">
                      {divisao.itens
                        .slice()
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map((item) => (
                          <li key={item.id} className="divisao-exercicio-item">
                            <span className="divisao-exercicio-nome">
                              {item.exercicio?.nome || 'Exercício'}
                            </span>
                            <span className="divisao-exercicio-detalhes">
                              {item.series}x
                              {item.repeticoes
                                ? ` ${item.repeticoes}`
                                : ''}
                              {item.carga ? ` • ${item.carga}` : ''}
                              {item.descanso ? ` • Descanso: ${item.descanso}` : ''}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="divisao-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleOpenModal(divisao)}
                >
                  Editar
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(divisao.id)}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDivisao ? 'Editar Divisão' : 'Nova Divisão'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nome da Divisão *</label>
                <input
                  type="text"
                  value={newDivisao.nome}
                  onChange={(e) => setNewDivisao(prev => ({ ...prev, nome: e.target.value }))}
                  required
                  placeholder="Ex: A - Peito e Tríceps"
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={newDivisao.descricao}
                  onChange={(e) => setNewDivisao(prev => ({ ...prev, descricao: e.target.value }))}
                  rows="4"
                  placeholder="Descrição da divisão..."
                />
              </div>

              <div className="form-group">
                <label>Dias da Semana</label>
                <input
                  type="text"
                  value={newDivisao.diasSemana}
                  onChange={(e) => setNewDivisao(prev => ({ ...prev, diasSemana: e.target.value }))}
                  placeholder='Ex: Segunda, Quarta, Sexta'
                />
              </div>

              {/* Exercícios da divisão */}
              <div className="form-group exercicios-group">
                <label>Exercícios da divisão (modelo)</label>
                {(!newDivisao.itens || newDivisao.itens.length === 0) && (
                  <p className="hint-text">
                    Esses exercícios serão usados como base sempre que você escolher esta divisão nas prescrições.
                  </p>
                )}

                <div className="divisao-itens-list">
                  {Array.isArray(newDivisao.itens) &&
                    newDivisao.itens.map((item, index) => (
                      <div key={index} className="divisao-item-row">
                        <select
                          value={item.exercicioId}
                          onChange={(e) =>
                            handleUpdateItem(index, 'exercicioId', e.target.value)
                          }
                          required
                        >
                          <option value="">Selecione exercício</option>
                          {exercicios.map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.nome}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.series}
                          onChange={(e) =>
                            handleUpdateItem(index, 'series', e.target.value)
                          }
                          placeholder="Séries"
                        />
                        <input
                          type="text"
                          value={item.repeticoes || ''}
                          onChange={(e) =>
                            handleUpdateItem(index, 'repeticoes', e.target.value)
                          }
                          placeholder="Repetições (ex: 10-12)"
                        />
                        <input
                          type="text"
                          value={item.carga || ''}
                          onChange={(e) =>
                            handleUpdateItem(index, 'carga', e.target.value)
                          }
                          placeholder="Carga (ex: 20kg)"
                        />
                        <input
                          type="text"
                          value={item.descanso || ''}
                          onChange={(e) =>
                            handleUpdateItem(index, 'descanso', e.target.value)
                          }
                          placeholder="Descanso (ex: 60s)"
                          style={{ minWidth: '140px', fontSize: '0.9375rem' }}
                        />
                        <button
                          type="button"
                          className="btn-delete-small"
                          onClick={() => handleRemoveItem(index)}
                          style={{ width: '36px', height: '36px', flexShrink: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  type="button"
                  className="btn-add-exercicio"
                  onClick={handleAddItem}
                >
                  + Adicionar Exercício
                </button>
              </div>

              {error && (
                <div className="alert alert-error">{error}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DivisaoTreinoManager

