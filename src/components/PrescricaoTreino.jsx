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
    categoria: '',
    nivelAluno: '',
    objetivoPrincipal: '',
    duracaoSemanas: '',
    divisoes: [{ 
      nome: '', 
      ordem: 1, 
      divisaoTreinoId: '', 
      grupoMuscularPrincipal: '',
      diaSemana: '',
      itens: [] 
    }]
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
      categoria: '',
      nivelAluno: '',
      objetivoPrincipal: '',
      duracaoSemanas: '',
      divisoes: [{ 
        nome: '', 
        ordem: 1, 
        divisaoTreinoId: '', 
        grupoMuscularPrincipal: '',
        diaSemana: '',
        itens: [] 
      }]
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
        { 
          nome: '', 
          ordem: prev.divisoes.length + 1, 
          divisaoTreinoId: '', 
          grupoMuscularPrincipal: '',
          diaSemana: '',
          itens: [] 
        }
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
          ? { 
              ...div, 
              itens: [...div.itens, { 
                exercicioId: '', 
                series: 3, 
                repeticoes: '', 
                carga: '', 
                descanso: '', 
                tipoExercicio: '',
                enfase: '',
                tempoDescanso: '',
                ordem: div.itens.length + 1 
              }] 
            }
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
        categoria: newPrescricao.categoria || null,
        nivelAluno: newPrescricao.nivelAluno || null,
        objetivoPrincipal: newPrescricao.objetivoPrincipal || null,
        duracaoSemanas: newPrescricao.duracaoSemanas ? parseInt(newPrescricao.duracaoSemanas) : null,
        divisoes: newPrescricao.divisoes.map(div => ({
          nome: div.nome,
          ordem: div.ordem,
          divisaoTreinoId: div.divisaoTreinoId || null,
          grupoMuscularPrincipal: div.grupoMuscularPrincipal || null,
          diaSemana: div.diaSemana || null,
          itens: div.itens.map(item => ({
            exercicioId: item.exercicioId,
            series: parseInt(item.series) || 3,
            repeticoes: item.repeticoes || null,
            carga: item.carga || null,
            descanso: item.descanso || null,
            tipoExercicio: item.tipoExercicio || null,
            enfase: item.enfase || null,
            tempoDescanso: item.tempoDescanso || null,
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
              <div className="modal-header-content">
                <h3>Nova Prescrição de Treino</h3>
                <p className="modal-subtitle">Estruture o plano de treino do seu aluno</p>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Bloco: Informações do Treino */}
              <div className="form-section form-section-card">
                <h4 className="section-title">Informações do Treino</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria do Treino *</label>
                    <select
                      value={newPrescricao.categoria}
                      onChange={(e) => {
                        const categoria = e.target.value
                        setNewPrescricao(prev => {
                          // Sugerir nome automático baseado na categoria e duração
                          let nomeSugerido = prev.nome
                          if (!prev.nome && categoria && prev.duracaoSemanas) {
                            const categoriaMap = {
                              'Hipertrofia': 'Hipertrofia',
                              'Emagrecimento': 'Emagrecimento',
                              'Condicionamento físico': 'Condicionamento',
                              'Reabilitação': 'Reabilitação',
                              'Manutenção': 'Manutenção',
                              'Performance esportiva': 'Performance'
                            }
                            nomeSugerido = `${categoriaMap[categoria] || categoria} A/B – ${prev.duracaoSemanas} semanas`
                          }
                          return { ...prev, categoria, nome: nomeSugerido }
                        })
                      }}
                      required
                    >
                      <option value="">Selecione a categoria</option>
                      <option value="Hipertrofia">Hipertrofia</option>
                      <option value="Emagrecimento">Emagrecimento</option>
                      <option value="Condicionamento físico">Condicionamento físico</option>
                      <option value="Reabilitação">Reabilitação</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Performance esportiva">Performance esportiva</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nível do Aluno *</label>
                    <select
                      value={newPrescricao.nivelAluno}
                      onChange={(e) => setNewPrescricao(prev => ({ ...prev, nivelAluno: e.target.value }))}
                      required
                    >
                      <option value="">Selecione o nível</option>
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Objetivo Principal *</label>
                    <select
                      value={newPrescricao.objetivoPrincipal}
                      onChange={(e) => setNewPrescricao(prev => ({ ...prev, objetivoPrincipal: e.target.value }))}
                      required
                    >
                      <option value="">Selecione o objetivo</option>
                      <option value="Ganho de massa">Ganho de massa</option>
                      <option value="Redução de gordura">Redução de gordura</option>
                      <option value="Força">Força</option>
                      <option value="Resistência">Resistência</option>
                      <option value="Mobilidade">Mobilidade</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Duração (semanas) *</label>
                    <input
                      type="number"
                      value={newPrescricao.duracaoSemanas}
                      onChange={(e) => {
                        const semanas = e.target.value
                        setNewPrescricao(prev => {
                          // Sugerir nome automático
                          let nomeSugerido = prev.nome
                          if (!prev.nome && prev.categoria && semanas) {
                            const categoriaMap = {
                              'Hipertrofia': 'Hipertrofia',
                              'Emagrecimento': 'Emagrecimento',
                              'Condicionamento físico': 'Condicionamento',
                              'Reabilitação': 'Reabilitação',
                              'Manutenção': 'Manutenção',
                              'Performance esportiva': 'Performance'
                            }
                            nomeSugerido = `${categoriaMap[prev.categoria] || prev.categoria} A/B – ${semanas} semanas`
                          }
                          return { ...prev, duracaoSemanas: semanas, nome: nomeSugerido }
                        })
                      }}
                      required
                      min="1"
                      placeholder="Ex: 4, 8, 12"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco: Paciente e Nome */}
              <div className="form-section form-section-card">
                <h4 className="section-title">Paciente e Nome do Treino</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Paciente *</label>
                    <div className="paciente-select-wrapper">
                      <select
                        value={newPrescricao.pacienteId}
                        onChange={(e) => setNewPrescricao(prev => ({ ...prev, pacienteId: e.target.value }))}
                        required
                        className="paciente-select"
                      >
                        <option value="">Selecione um paciente</option>
                        {pacientes.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.email}
                          </option>
                        ))}
                      </select>
                      {newPrescricao.pacienteId && (() => {
                        const pacienteSelecionado = pacientes.find(p => p.id === newPrescricao.pacienteId)
                        const iniciais = pacienteSelecionado?.name 
                          ? pacienteSelecionado.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : '??'
                        return (
                          <div className="paciente-avatar">
                            {iniciais}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nome do Treino *</label>
                    <input
                      type="text"
                      value={newPrescricao.nome}
                      onChange={(e) => setNewPrescricao(prev => ({ ...prev, nome: e.target.value }))}
                      required
                      placeholder="Ex: Hipertrofia A/B – 8 semanas"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco: Orientações Gerais */}
              <div className="form-section form-section-card orientacoes-section">
                <h4 className="section-title">Orientações Gerais do Treino</h4>
                <div className="form-group">
                  <label>Orientações e Observações</label>
                  <textarea
                    value={newPrescricao.observacoes}
                    onChange={(e) => setNewPrescricao(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows="4"
                    placeholder="Cardio complementar, ritmo, descanso, observações clínicas, ajustes necessários..."
                    className="orientacoes-textarea"
                  />
                </div>
              </div>

              {/* Divisões */}
              <div className="divisoes-section form-section-card">
                <div className="section-header">
                  <div>
                    <h4 className="section-title">Divisões de Treino</h4>
                    {newPrescricao.divisoes.length > 0 && (
                      <p className="section-summary">
                        {newPrescricao.divisoes.length} {newPrescricao.divisoes.length === 1 ? 'divisão' : 'divisões'} • {' '}
                        {newPrescricao.divisoes.reduce((total, div) => total + (div.itens?.length || 0), 0)} exercícios no total
                      </p>
                    )}
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleAddDivisao}>
                    + Adicionar Divisão
                  </button>
                </div>

                {newPrescricao.divisoes.map((divisao, divIndex) => (
                  <div key={divIndex} className="divisao-form">
                    <div className="divisao-header-main">
                      <div className="divisao-header-top">
                        <h5 className="divisao-number">Divisão {divIndex + 1}</h5>
                        <button
                          type="button"
                          className="btn-delete-small divisao-remove-btn"
                          onClick={() =>
                            setNewPrescricao((prev) => ({
                              ...prev,
                              divisoes: prev.divisoes.filter((_, i) => i !== divIndex)
                            }))
                          }
                        >
                          Remover Divisão
                        </button>
                      </div>

                      {/* Seleção de divisão existente */}
                      {divisoesModelo.length > 0 && (
                        <div className="divisao-modelo-wrapper">
                          <label className="divisao-modelo-label">Carregar divisão existente (opcional)</label>
                          <select
                            className="divisao-modelo-select"
                            value={divisao.divisaoTreinoId || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              const modelo = divisoesModelo.find(d => d.id === value)
                              
                              if (value && modelo) {
                                // Carregar divisão existente - SUBSTITUIR tudo completamente
                                setNewPrescricao(prev => ({
                                  ...prev,
                                  divisoes: prev.divisoes.map((d, i) =>
                                    i === divIndex
                                      ? {
                                          nome: modelo.nome || '',
                                          ordem: d.ordem, // Manter a ordem original
                                          divisaoTreinoId: value,
                                          grupoMuscularPrincipal: '', // Campo não existe no modelo, começar vazio
                                          diaSemana: '', // Campo não existe no modelo, começar vazio
                                          itens: Array.isArray(modelo.itens) && modelo.itens.length > 0
                                            ? modelo.itens.map((item, idx) => ({
                                                exercicioId: item.exercicio?.id || item.exercicioId || '',
                                                series: item.series || 3,
                                                repeticoes: item.repeticoes || '',
                                                carga: item.carga || '',
                                                descanso: item.descanso || '',
                                                tipoExercicio: '', // Campos novos, começar vazio
                                                enfase: '', // Campos novos, começar vazio
                                                tempoDescanso: '', // Campos novos, começar vazio
                                                ordem: item.ordem || idx + 1
                                              }))
                                            : []
                                        }
                                      : d
                                  )
                                }))
                              } else if (!value) {
                                // Limpar divisão modelo - manter valores atuais mas remover referência ao modelo
                                setNewPrescricao(prev => ({
                                  ...prev,
                                  divisoes: prev.divisoes.map((d, i) =>
                                    i === divIndex ? { ...d, divisaoTreinoId: '' } : d
                                  )
                                }))
                              }
                            }}
                          >
                            <option value="">Selecione uma divisão para carregar...</option>
                            {divisoesModelo.map((div) => (
                              <option key={div.id} value={div.id}>
                                {div.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Campos de edição da divisão */}
                      <div className="divisao-campos-wrapper">
                        <div className="divisao-campo-row">
                          <div className="divisao-campo-group">
                            <label className="divisao-campo-label">Nome da Divisão *</label>
                            <input
                              type="text"
                              placeholder="Ex: A - Peito e Tríceps"
                              value={divisao.nome}
                              onChange={(e) => handleUpdateDivisao(divIndex, 'nome', e.target.value)}
                              required
                              className="divisao-nome-input"
                            />
                          </div>

                          <div className="divisao-campo-group">
                            <label className="divisao-campo-label">Grupo Muscular Principal</label>
                            <select
                              className="divisao-grupo-select"
                              value={divisao.grupoMuscularPrincipal || ''}
                              onChange={(e) => handleUpdateDivisao(divIndex, 'grupoMuscularPrincipal', e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="Peito">Peito</option>
                              <option value="Costas">Costas</option>
                              <option value="Ombro">Ombro</option>
                              <option value="Bíceps">Bíceps</option>
                              <option value="Tríceps">Tríceps</option>
                              <option value="Pernas">Pernas</option>
                              <option value="Glúteos">Glúteos</option>
                              <option value="Abdômen">Abdômen</option>
                              <option value="Cardio">Cardio</option>
                              <option value="Full Body">Full Body</option>
                            </select>
                          </div>

                          <div className="divisao-campo-group">
                            <label className="divisao-campo-label">Dia Sugerido</label>
                            <select
                              className="divisao-dia-select"
                              value={divisao.diaSemana || ''}
                              onChange={(e) => handleUpdateDivisao(divIndex, 'diaSemana', e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="Segunda">Segunda</option>
                              <option value="Terça">Terça</option>
                              <option value="Quarta">Quarta</option>
                              <option value="Quinta">Quinta</option>
                              <option value="Sexta">Sexta</option>
                              <option value="Sábado">Sábado</option>
                              <option value="Domingo">Domingo</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Resumo da divisão */}
                      {divisao.itens && divisao.itens.length > 0 && (
                        <div className="divisao-resumo">
                          <span className="divisao-resumo-icon">📋</span>
                          <span>
                            {divisao.itens.length} {divisao.itens.length === 1 ? 'exercício' : 'exercícios'}
                            {divisao.grupoMuscularPrincipal && ` • ${divisao.grupoMuscularPrincipal}`}
                            {divisao.diaSemana && ` • ${divisao.diaSemana}`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="exercicios-list">
                      {divisao.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className="exercicio-item-form">
                          <select
                            value={item.exercicioId}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'exercicioId', e.target.value)}
                            required
                            className="exercicio-select"
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
                            className="series-input"
                          />
                          
                          <input
                            type="text"
                            placeholder="Repetições (ex: 10-12)"
                            value={item.repeticoes}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'repeticoes', e.target.value)}
                            className="repeticoes-input"
                          />
                          
                          <input
                            type="text"
                            placeholder="Carga (ex: 20kg)"
                            value={item.carga}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'carga', e.target.value)}
                            className="carga-input"
                          />
                          
                          <select
                            value={item.tempoDescanso || ''}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'tempoDescanso', e.target.value)}
                            className="tempo-descanso-select"
                          >
                            <option value="">Descanso</option>
                            <option value="30s">30s</option>
                            <option value="45s">45s</option>
                            <option value="60s">60s</option>
                            <option value="90s">90s</option>
                            <option value="120s">120s</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Descanso customizado"
                            value={item.descanso}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'descanso', e.target.value)}
                            className="descanso-input"
                          />
                          
                          <select
                            value={item.tipoExercicio || ''}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'tipoExercicio', e.target.value)}
                            className="tipo-exercicio-select"
                          >
                            <option value="">Tipo (opcional)</option>
                            <option value="Composto">Composto</option>
                            <option value="Isolado">Isolado</option>
                          </select>

                          <select
                            value={item.enfase || ''}
                            onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'enfase', e.target.value)}
                            className="enfase-select"
                          >
                            <option value="">Ênfase (opcional)</option>
                            <option value="Força">Força</option>
                            <option value="Técnica">Técnica</option>
                            <option value="Metabólico">Metabólico</option>
                          </select>
                          
                          <button
                            type="button"
                            className="btn-delete-small exercicio-remove-btn"
                            onClick={() => handleRemoveItem(divIndex, itemIndex)}
                            title="Remover exercício"
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

