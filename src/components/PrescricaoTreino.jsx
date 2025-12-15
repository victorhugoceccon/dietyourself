import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PrescricaoTreino.css'

function PrescricaoTreino() {
  const [prescricoes, setPrescricoes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [exercicios, setExercicios] = useState([])
  const [divisoesModelo, setDivisoesModelo] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [newPrescricao, setNewPrescricao] = useState({
    pacienteId: '',
    nome: '',
    observacoes: '',
    dataInicio: '',
    dataFim: '',
    ativo: true,
    divisoes: [{ nome: '', ordem: 1, divisaoTreinoId: '', itens: [] }]
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const [prescricoesRes, pacientesRes, exerciciosRes, divisoesRes] = await Promise.all([
        fetch(`${API_URL}/prescricoes-treino`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/personal/pacientes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/exercicios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/divisoes-treino`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (prescricoesRes.ok) {
        const data = await prescricoesRes.json()
        setPrescricoes(data.prescricoes || [])
      }

      if (pacientesRes.ok) {
        const data = await pacientesRes.json()
        setPacientes(data.pacientes || [])
      }

      if (exerciciosRes.ok) {
        const data = await exerciciosRes.json()
        setExercicios(data.exercicios || [])
      }

      if (divisoesRes.ok) {
        const data = await divisoesRes.json()
        setDivisoesModelo(data.divisoes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setNewPrescricao({
      pacienteId: '',
      nome: '',
      observacoes: '',
      dataInicio: '',
      dataFim: '',
      ativo: true,
      divisoes: [{ nome: '', ordem: 1, divisaoTreinoId: '', itens: [] }]
    })
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError('')
  }

  const handleAddDivisao = () => {
    setNewPrescricao(prev => ({
      ...prev,
      divisoes: [
        ...prev.divisoes,
        { nome: '', ordem: prev.divisoes.length + 1, divisaoTreinoId: '', itens: [] }
      ]
    }))
  }

  const handleUpdateDivisao = (index, field, value) => {
    setNewPrescricao(prev => ({
      ...prev,
      divisoes: prev.divisoes.map((div, i) => 
        i === index ? { ...div, [field]: value } : div
      )
    }))
  }

  const handleAddItem = (divisaoIndex) => {
    setNewPrescricao(prev => ({
      ...prev,
      divisoes: prev.divisoes.map((div, i) => 
        i === divisaoIndex 
          ? { ...div, itens: [...div.itens, { exercicioId: '', series: 3, repeticoes: '', carga: '', descanso: '', ordem: div.itens.length + 1 }] }
          : div
      )
    }))
  }

  const handleUpdateItem = (divisaoIndex, itemIndex, field, value) => {
    setNewPrescricao(prev => ({
      ...prev,
      divisoes: prev.divisoes.map((div, i) => 
        i === divisaoIndex
          ? {
              ...div,
              itens: div.itens.map((item, j) =>
                j === itemIndex ? { ...item, [field]: value } : item
              )
            }
          : div
      )
    }))
  }

  const handleRemoveItem = (divisaoIndex, itemIndex) => {
    setNewPrescricao(prev => ({
      ...prev,
      divisoes: prev.divisoes.map((div, i) => 
        i === divisaoIndex
          ? { ...div, itens: div.itens.filter((_, j) => j !== itemIndex) }
          : div
      )
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Validação básica
    if (!newPrescricao.pacienteId || !newPrescricao.nome) {
      setError('Preencha o paciente e o nome do treino')
      setSaving(false)
      return
    }

    if (newPrescricao.divisoes.length === 0) {
      setError('Adicione pelo menos uma divisão')
      setSaving(false)
      return
    }

    for (const div of newPrescricao.divisoes) {
      if (!div.nome || div.itens.length === 0) {
        setError('Todas as divisões precisam de nome e pelo menos um exercício')
        setSaving(false)
        return
      }
      for (const item of div.itens) {
        if (!item.exercicioId) {
          setError('Todos os itens precisam de um exercício selecionado')
          setSaving(false)
          return
        }
      }
    }

    try {
      const token = localStorage.getItem('token')
      
      const payload = {
        pacienteId: newPrescricao.pacienteId,
        nome: newPrescricao.nome,
        observacoes: newPrescricao.observacoes || null,
        dataInicio: newPrescricao.dataInicio || null,
        dataFim: newPrescricao.dataFim || null,
        ativo: newPrescricao.ativo,
        divisoes: newPrescricao.divisoes.map(div => ({
          nome: div.nome,
          ordem: div.ordem,
          divisaoTreinoId: div.divisaoTreinoId || null,
          itens: div.itens.map(item => ({
            exercicioId: item.exercicioId,
            series: parseInt(item.series) || 3,
            repeticoes: item.repeticoes || null,
            carga: item.carga || null,
            descanso: item.descanso || null,
            observacoes: null,
            ordem: item.ordem
          }))
        }))
      }

      const response = await fetch(`${API_URL}/prescricoes-treino`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        handleCloseModal()
        loadData()
      } else {
        setError(data.error || 'Erro ao criar prescrição')
      }
    } catch (error) {
      console.error('Erro ao salvar prescrição:', error)
      setError('Erro ao salvar prescrição')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="prescricao-treino">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="prescricao-treino">
      <div className="prescricao-header">
        <h2>Prescrições de Treino</h2>
        <button className="btn-primary" onClick={handleOpenModal}>
          + Nova Prescrição
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {prescricoes.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma prescrição criada ainda.</p>
          <p>Crie sua primeira prescrição de treino!</p>
        </div>
      ) : (
        <div className="prescricoes-list">
          {prescricoes.map(presc => (
            <div key={presc.id} className="prescricao-card">
              <div className="prescricao-header-card">
                <div>
                  <h3>{presc.nome}</h3>
                  <p className="prescricao-paciente">
                    Paciente: {presc.paciente.name || presc.paciente.email}
                  </p>
                </div>
                <span className={`status-badge ${presc.ativo ? 'ativo' : 'inativo'}`}>
                  {presc.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {presc.observacoes && (
                <p className="prescricao-observacoes">{presc.observacoes}</p>
              )}
              <div className="prescricao-divisoes">
                <strong>Divisões ({presc.divisoes.length}):</strong>
                <ul>
                  {presc.divisoes.map(div => (
                    <li key={div.id}>{div.nome} ({div.itens.length} exercícios)</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Prescrição de Treino</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Paciente *</label>
                  <select
                    value={newPrescricao.pacienteId}
                    onChange={(e) => setNewPrescricao(prev => ({ ...prev, pacienteId: e.target.value }))}
                    required
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nome do Treino *</label>
                  <input
                    type="text"
                    value={newPrescricao.nome}
                    onChange={(e) => setNewPrescricao(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    placeholder="Ex: Treino A/B/C"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={newPrescricao.observacoes}
                  onChange={(e) => setNewPrescricao(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows="3"
                />
              </div>

              {/* Divisões */}
              <div className="divisoes-section">
                <div className="section-header">
                  <h4>Divisões de Treino</h4>
                  <button type="button" className="btn-secondary" onClick={handleAddDivisao}>
                    + Adicionar Divisão
                  </button>
                </div>

                {newPrescricao.divisoes.map((divisao, divIndex) => (
                  <div key={divIndex} className="divisao-form">
                    <div className="divisao-header-form">
                      <div className="divisao-header-left">
                        <input
                          type="text"
                          placeholder="Nome da divisão (ex: A - Peito e Tríceps)"
                          value={divisao.nome}
                          onChange={(e) => handleUpdateDivisao(divIndex, 'nome', e.target.value)}
                          required
                          className="divisao-nome-input"
                        />
                        {divisoesModelo.length > 0 && (
                          <select
                            className="divisao-modelo-select"
                            value={divisao.divisaoTreinoId || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const modelo = divisoesModelo.find(d => d.id === value)
                              setNewPrescricao(prev => ({
                                ...prev,
                                divisoes: prev.divisoes.map((d, i) =>
                                  i === divIndex
                                    ? (() => {
                                        const updated = {
                                          ...d,
                                          divisaoTreinoId: value || '',
                                          nome: value && modelo ? modelo.nome : d.nome
                                        }
                                        // Se escolheu um modelo com itens e ainda não há itens, pré-carregar
                                        if (
                                          value &&
                                          modelo &&
                                          Array.isArray(modelo.itens) &&
                                          modelo.itens.length > 0 &&
                                          (!d.itens || d.itens.length === 0)
                                        ) {
                                          updated.itens = modelo.itens.map((item, idx) => ({
                                            exercicioId: item.exercicioId,
                                            series: item.series || 3,
                                            repeticoes: item.repeticoes || '',
                                            carga: item.carga || '',
                                            descanso: item.descanso || '',
                                            ordem: idx + 1
                                          }))
                                        }
                                        return updated
                                      })()
                                    : d
                                )
                              }))
                            }}
                          >
                            <option value="">Usar divisão existente (opcional)</option>
                            {divisoesModelo.map((div) => (
                              <option key={div.id} value={div.id}>
                                {div.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-delete-small"
                        onClick={() =>
                          setNewPrescricao((prev) => ({
                            ...prev,
                            divisoes: prev.divisoes.filter((_, i) => i !== divIndex)
                          }))
                        }
                      >
                        Remover
                      </button>
                    </div>

                    <div className="exercicios-list">
                      {divisao.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className="exercicio-item-form">
                          <select
                            value={item.exercicioId}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'exercicioId', e.target.value)}
                            required
                          >
                            <option value="">Selecione exercício</option>
                            {exercicios.map(ex => (
                              <option key={ex.id} value={ex.id}>{ex.nome}</option>
                            ))}
                          </select>
                          
                          <input
                            type="number"
                            placeholder="Séries"
                            value={item.series}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'series', e.target.value)}
                            min="1"
                            required
                          />
                          
                          <input
                            type="text"
                            placeholder="Repetições (ex: 10-12)"
                            value={item.repeticoes}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'repeticoes', e.target.value)}
                          />
                          
                          <input
                            type="text"
                            placeholder="Carga (ex: 20kg)"
                            value={item.carga}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'carga', e.target.value)}
                          />
                          
                          <input
                            type="text"
                            placeholder="Descanso (ex: 60s)"
                            value={item.descanso}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'descanso', e.target.value)}
                          />
                          
                          <button
                            type="button"
                            className="btn-delete-small"
                            onClick={() => handleRemoveItem(divIndex, itemIndex)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        className="btn-add-exercicio"
                        onClick={() => handleAddItem(divIndex)}
                      >
                        + Adicionar Exercício
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Prescrição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrescricaoTreino

