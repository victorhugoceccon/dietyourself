import { useState, useEffect, useMemo, useRef } from 'react'
import { API_URL } from '../config/api'
import { Modal } from './ui'
import './PrescricaoTreino.css'

const DRAFT_KEY = 'lifefit:prescricaoTreinoDraft:v1'

function normalizeText(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function reorderArray(list, fromIndex, toIndex) {
  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

function withSequentialOrder(list) {
  return list.map((item, idx) => ({ ...item, ordem: idx + 1 }))
}

function ExerciseCombobox({ exercicios, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)

  const selected = useMemo(() => exercicios.find((e) => e.id === value) || null, [exercicios, value])

  const filtered = useMemo(() => {
    const q = normalizeText(query)
    const base = q ? exercicios.filter((e) => normalizeText(e.nome).includes(q)) : exercicios
    return base.slice(0, 25)
  }, [exercicios, query])

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
  }, [open, query])

  useEffect(() => {
    const onDocDown = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  const commit = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="ptw-combobox" ref={rootRef}>
      <button
        type="button"
        className={`ptw-combobox__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`ptw-combobox__value ${selected ? '' : 'is-placeholder'}`}>
          {selected ? selected.nome : 'Selecione um exercício *'}
        </span>
        <span className="ptw-combobox__chev">▾</span>
      </button>

      {open && (
        <div className="ptw-combobox__popover" role="listbox">
          <input
            className="ptw-combobox__search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar exercício..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setOpen(false)
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (filtered[activeIndex]) commit(filtered[activeIndex].id)
              }
            }}
          />

          <div className="ptw-combobox__list">
            {filtered.length === 0 ? (
              <div className="ptw-combobox__empty">Nenhum exercício encontrado.</div>
            ) : (
              filtered.map((ex, idx) => (
                <button
                  type="button"
                  key={ex.id}
                  className={`ptw-combobox__option ${idx === activeIndex ? 'active' : ''} ${ex.id === value ? 'selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(ex.id)}
                >
                  {ex.nome}
                </button>
              ))
            )}
          </div>

          {value && (
            <button type="button" className="ptw-combobox__clear" onClick={() => onChange('')}>
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PrescricaoTreino() {
  const [prescricoes, setPrescricoes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [exercicios, setExercicios] = useState([])
  const [divisoesModelo, setDivisoesModelo] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [pacienteQuery, setPacienteQuery] = useState('')
  const [activeDivIndex, setActiveDivIndex] = useState(0)
  const [showItemOptions, setShowItemOptions] = useState({})
  const [draftInfo, setDraftInfo] = useState(null)
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
      grupoMuscularSecundario: '',
      diaSemana: '',
      itens: [] 
    }]
  })
  const [saving, setSaving] = useState(false)

  const MUSCLE_OPTIONS = useMemo(() => ([
    'Peito',
    'Costas',
    'Ombro',
    'Bíceps',
    'Tríceps',
    'Pernas',
    'Glúteos',
    'Abdômen',
    'Cardio',
    'Full Body'
  ]), [])

  const WIZARD_STEPS = [
    { key: 'paciente', label: 'Aluno' },
    { key: 'detalhes', label: 'Detalhes' },
    { key: 'divisoes', label: 'Divisões' },
    { key: 'revisao', label: 'Revisão' }
  ]

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
        grupoMuscularSecundario: '',
        diaSemana: '',
        itens: [] 
      }]
    })
    setShowModal(true)
    setWizardStep(0)
    setPacienteQuery('')
    setActiveDivIndex(0)
    setShowItemOptions({})
    setError('')

    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      setDraftInfo(raw ? JSON.parse(raw) : null)
    } catch {
      setDraftInfo(null)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError('')
  }

  const toggleItemOptions = (divIndex, itemIndex) => {
    const key = `${divIndex}:${itemIndex}`
    setShowItemOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const setDragPayload = (e, payload) => {
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify(payload))
      e.dataTransfer.effectAllowed = 'move'
    } catch {
      // ignore
    }
  }

  const getDragPayload = (e) => {
    try {
      const raw = e.dataTransfer.getData('text/plain')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const validateStep = (step) => {
    if (step === 0) {
      return !!newPrescricao.pacienteId
    }
    if (step === 1) {
      return (
        !!newPrescricao.pacienteId &&
        !!newPrescricao.categoria &&
        !!newPrescricao.nivelAluno &&
        !!newPrescricao.objetivoPrincipal &&
        !!newPrescricao.duracaoSemanas &&
        !!newPrescricao.nome
      )
    }
    if (step === 2) {
      const meaningful = (newPrescricao.divisoes || []).filter((d) => (d.nome || '').trim() || (d.itens?.length || 0) > 0)
      if (!meaningful.length) return false
      for (const div of meaningful) {
        if (!div.nome || !div.itens?.length) return false
        for (const item of div.itens) {
          if (!item.exercicioId) return false
        }
      }
      return true
    }
    return true
  }

  const validateDivisao = (div) => {
    if (!div) return false
    if (!(div.nome || '').trim()) return false
    if (!div.itens?.length) return false
    for (const item of div.itens) {
      if (!item.exercicioId) return false
    }
    return true
  }

  const normalizeDivisoesForSubmit = (divisoes) => {
    const meaningful = (divisoes || []).filter((d) => (d.nome || '').trim() || (d.itens?.length || 0) > 0)
    return withSequentialOrder(meaningful).map((d, idx) => ({
      ...d,
      ordem: idx + 1,
      itens: withSequentialOrder(d.itens || []).map((it, j) => ({ ...it, ordem: j + 1 }))
    }))
  }

  const goNext = () => {
    setError('')
    if (!validateStep(wizardStep)) {
      if (wizardStep === 0) return setError('Selecione um aluno para continuar')
      if (wizardStep === 1) return setError('Preencha categoria, nível, objetivo, duração e nome do treino')
      if (wizardStep === 2) return setError('Cada divisão precisa de nome e pelo menos 1 exercício selecionado')
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  }

  const goBack = () => {
    setError('')
    setWizardStep((s) => Math.max(s - 1, 0))
  }

  const handleAddDivisao = () => {
    setNewPrescricao(prev => {
      const next = [
        ...withSequentialOrder(prev.divisoes),
        { 
          nome: '', 
          ordem: prev.divisoes.length + 1,
          divisaoTreinoId: '', 
          grupoMuscularPrincipal: '',
          grupoMuscularSecundario: '',
          diaSemana: '',
          itens: [] 
        }
      ]
      return { ...prev, divisoes: next }
    })
    setActiveDivIndex((prev) => {
      // vai para a última divisão recém-criada
      const nextIndex = (newPrescricao.divisoes?.length || 0)
      return nextIndex
    })
  }

  const goPrevDivisao = () => setActiveDivIndex((i) => Math.max(i - 1, 0))
  const goNextDivisao = () => {
    setError('')
    const current = newPrescricao.divisoes?.[activeDivIndex]
    if (!validateDivisao(current)) {
      return setError('Preencha o nome da divisão e selecione pelo menos 1 exercício antes de avançar.')
    }
    setActiveDivIndex((i) => Math.min(i + 1, (newPrescricao.divisoes?.length || 1) - 1))
  }

  const handleRemoveDivisao = (divIndex) => {
    setNewPrescricao((prev) => {
      const next = withSequentialOrder(prev.divisoes.filter((_, i) => i !== divIndex))
      return { ...prev, divisoes: next.length ? next : [{
        nome: '',
        ordem: 1,
        divisaoTreinoId: '',
        grupoMuscularPrincipal: '',
        grupoMuscularSecundario: '',
        diaSemana: '',
        itens: []
      }] }
    })
    setActiveDivIndex((i) => {
      if (divIndex < i) return Math.max(i - 1, 0)
      if (divIndex === i) return Math.max(i - 1, 0)
      return i
    })
  }

  const addNextDivisaoGuided = () => {
    setError('')
    const current = newPrescricao.divisoes?.[activeDivIndex]
    if (!validateDivisao(current)) {
      return setError('Preencha o nome da divisão e selecione pelo menos 1 exercício antes de adicionar outra.')
    }
    setNewPrescricao((prev) => {
      const nextDivisoes = [
        ...withSequentialOrder(prev.divisoes),
        {
          nome: '',
          ordem: prev.divisoes.length + 1,
          divisaoTreinoId: '',
          grupoMuscularPrincipal: '',
          grupoMuscularSecundario: '',
          diaSemana: '',
          itens: []
        }
      ]
      return { ...prev, divisoes: nextDivisoes }
    })
    setActiveDivIndex((i) => i + 1)
  }

  const filteredPacientes = useMemo(() => {
    const q = normalizeText(pacienteQuery)
    const base = q
      ? pacientes.filter((p) => {
          const name = normalizeText(p.name || '')
          const email = normalizeText(p.email || '')
          return name.includes(q) || email.includes(q)
        })
      : pacientes
    return base
  }, [pacientes, pacienteQuery])

  useEffect(() => {
    if (wizardStep !== 2) return
    setActiveDivIndex((i) => {
      const max = Math.max((newPrescricao.divisoes?.length || 1) - 1, 0)
      return Math.min(i, max)
    })
  }, [wizardStep, newPrescricao.divisoes?.length])

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
          ? { ...div, itens: withSequentialOrder(div.itens.filter((_, j) => j !== itemIndex)) }
          : div
      )
    }))
  }

  const handleMoveDivisao = (fromIndex, toIndex) => {
    setNewPrescricao(prev => {
      if (toIndex < 0 || toIndex >= prev.divisoes.length) return prev
      const next = reorderArray(prev.divisoes, fromIndex, toIndex)
      setShowItemOptions({})
      return { ...prev, divisoes: withSequentialOrder(next) }
    })
  }

  const handleMoveItem = (divisaoIndex, fromIndex, toIndex) => {
    setNewPrescricao(prev => {
      const div = prev.divisoes[divisaoIndex]
      if (!div) return prev
      if (toIndex < 0 || toIndex >= div.itens.length) return prev
      const itensNext = reorderArray(div.itens, fromIndex, toIndex)
      setShowItemOptions({})
      return {
        ...prev,
        divisoes: prev.divisoes.map((d, i) =>
          i === divisaoIndex ? { ...d, itens: withSequentialOrder(itensNext) } : d
        )
      }
    })
  }

  const handleMoveItemToDivisao = (fromDivIndex, fromItemIndex, toDivIndex, toItemIndex = null) => {
    setNewPrescricao(prev => {
      const fromDiv = prev.divisoes[fromDivIndex]
      const toDiv = prev.divisoes[toDivIndex]
      if (!fromDiv || !toDiv) return prev
      const item = fromDiv.itens[fromItemIndex]
      if (!item) return prev

      const fromItens = fromDiv.itens.filter((_, idx) => idx !== fromItemIndex)
      const insertAt = toItemIndex == null ? toDiv.itens.length : Math.max(0, Math.min(toItemIndex, toDiv.itens.length))
      const toItens = [...toDiv.itens]
      toItens.splice(insertAt, 0, { ...item, ordem: 0 })

      setShowItemOptions({})
      return {
        ...prev,
        divisoes: prev.divisoes.map((d, i) => {
          if (i === fromDivIndex) return { ...d, itens: withSequentialOrder(fromItens) }
          if (i === toDivIndex) return { ...d, itens: withSequentialOrder(toItens) }
          return d
        })
      }
    })
  }

  const handleDuplicateDivisao = (divisaoIndex) => {
    setNewPrescricao(prev => {
      const src = prev.divisoes[divisaoIndex]
      if (!src) return prev
      const clone = {
        ...src,
        nome: src.nome ? `${src.nome} (cópia)` : '',
        divisaoTreinoId: '', // duplicação vira “custom”, sem amarrar ao modelo
        itens: withSequentialOrder(
          (src.itens || []).map((it) => ({
            ...it,
            ordem: 0
          }))
        )
      }
      const next = [
        ...prev.divisoes.slice(0, divisaoIndex + 1),
        clone,
        ...prev.divisoes.slice(divisaoIndex + 1)
      ]
      return { ...prev, divisoes: withSequentialOrder(next) }
    })
  }

  const handleDuplicateItem = (divisaoIndex, itemIndex) => {
    setNewPrescricao(prev => {
      const div = prev.divisoes[divisaoIndex]
      if (!div) return prev
      const src = div.itens[itemIndex]
      if (!src) return prev
      const clone = { ...src, ordem: 0 }
      const itensNext = [
        ...div.itens.slice(0, itemIndex + 1),
        clone,
        ...div.itens.slice(itemIndex + 1)
      ]
      return {
        ...prev,
        divisoes: prev.divisoes.map((d, i) =>
          i === divisaoIndex ? { ...d, itens: withSequentialOrder(itensNext) } : d
        )
      }
    })
  }

  const handleSaveDraft = () => {
    try {
      const payload = { savedAt: new Date().toISOString(), data: newPrescricao }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
      setDraftInfo(payload)
    } catch {
      // ignore
    }
  }

  const handleRestoreDraft = () => {
    if (!draftInfo?.data) return
    setNewPrescricao(draftInfo.data)
    setWizardStep(0)
    setError('')
  }

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    setDraftInfo(null)
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

    const divisoesForSubmit = normalizeDivisoesForSubmit(newPrescricao.divisoes)

    if (divisoesForSubmit.length === 0) {
      setError('Adicione pelo menos uma divisão')
      setSaving(false)
      return
    }

    for (const div of divisoesForSubmit) {
      if (!validateDivisao(div)) {
        setError('Todas as divisões precisam de nome e pelo menos um exercício')
        setSaving(false)
        return
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
        divisoes: divisoesForSubmit.map(div => ({
          nome: div.nome,
          ordem: div.ordem,
          divisaoTreinoId: div.divisaoTreinoId || null,
          grupoMuscularPrincipal: div.grupoMuscularPrincipal || null,
          grupoMuscularSecundario: div.grupoMuscularSecundario || null,
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

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Nova Prescrição de Treino"
        subtitle="Siga o passo a passo para montar o treino do aluno."
        size="xl"
        className="lifefit-modal--scroll-body"
        footer={(
          <>
            <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className="btn-secondary" onClick={handleSaveDraft} disabled={saving}>
              Salvar rascunho
            </button>
            {wizardStep > 0 && (
              <button type="button" className="btn-secondary" onClick={goBack} disabled={saving}>
                Voltar
              </button>
            )}
            {wizardStep < WIZARD_STEPS.length - 1 ? (
              <button type="button" className="btn-primary" onClick={goNext} disabled={saving}>
                Próximo
              </button>
            ) : (
              <button type="submit" form="prescricao-wizard-form" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar prescrição'}
              </button>
            )}
          </>
        )}
      >
        <div className="ptw">
          {draftInfo?.savedAt && (
            <div className="ptw-draft">
              <div className="ptw-draft__text">
                Você tem um rascunho salvo ({new Date(draftInfo.savedAt).toLocaleString()}).
              </div>
              <div className="ptw-draft__actions">
                <button type="button" className="btn-secondary" onClick={handleRestoreDraft}>
                  Restaurar
                </button>
                <button type="button" className="btn-secondary" onClick={handleDiscardDraft}>
                  Descartar
                </button>
              </div>
            </div>
          )}

          <div className="ptw-steps">
            {WIZARD_STEPS.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                className={`ptw-step ${idx === wizardStep ? 'active' : ''} ${idx < wizardStep ? 'done' : ''}`}
                onClick={() => {
                  // permitir voltar para passos anteriores; avançar só com validação
                  if (idx <= wizardStep) setWizardStep(idx)
                }}
              >
                <span className="ptw-step__num">{idx + 1}</span>
                <span className="ptw-step__label">{s.label}</span>
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form id="prescricao-wizard-form" onSubmit={handleSave} className="ptw-form">
            {/* STEP 1: PACIENTE */}
            {wizardStep === 0 && (
              <div className="ptw-panel">
                <div className="ptw-panel__title">Selecione o aluno</div>
                <div className="ptw-panel__subtitle">
                  {pacientes.length} {pacientes.length === 1 ? 'aluno' : 'alunos'} vinculados
                </div>

                <div className="ptw-search">
                  <input
                    className="lifefit-input"
                    type="text"
                    value={pacienteQuery}
                    onChange={(e) => setPacienteQuery(e.target.value)}
                    placeholder="Buscar aluno por nome ou e-mail..."
                  />
                  {pacienteQuery && (
                    <button type="button" className="btn-secondary" onClick={() => setPacienteQuery('')}>
                      Limpar
                    </button>
                  )}
                </div>

                {filteredPacientes.length === 0 ? (
                  <div className="ptw-empty">Nenhum aluno encontrado com esse filtro.</div>
                ) : (
                  <div className="ptw-grid">
                    {filteredPacientes.slice(0, 60).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`ptw-choice ${newPrescricao.pacienteId === p.id ? 'selected' : ''}`}
                      onClick={() => setNewPrescricao(prev => ({ ...prev, pacienteId: p.id }))}
                    >
                      <div className="ptw-choice__name">{p.name || p.email}</div>
                      <div className="ptw-choice__meta">{p.email}</div>
                    </button>
                    ))}
                  </div>
                )}

                {filteredPacientes.length > 60 && (
                  <div className="ptw-hint">
                    Mostrando 60 de {filteredPacientes.length}. Refine a busca para encontrar mais rápido.
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DETALHES */}
            {wizardStep === 1 && (
              <div className="ptw-panel">
                <div className="ptw-panel__title">Detalhes do treino</div>
                <div className="ptw-fields">
                  <div className="ptw-row">
                    <div className="ptw-field">
                      <label>Categoria *</label>
                      <select
                        value={newPrescricao.categoria}
                        onChange={(e) => {
                          const categoria = e.target.value
                          setNewPrescricao(prev => {
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
                        <option value="">Selecione</option>
                        <option value="Hipertrofia">Hipertrofia</option>
                        <option value="Emagrecimento">Emagrecimento</option>
                        <option value="Condicionamento físico">Condicionamento físico</option>
                        <option value="Reabilitação">Reabilitação</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Performance esportiva">Performance esportiva</option>
                      </select>
                    </div>

                    <div className="ptw-field">
                      <label>Nível *</label>
                      <select
                        value={newPrescricao.nivelAluno}
                        onChange={(e) => setNewPrescricao(prev => ({ ...prev, nivelAluno: e.target.value }))}
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                      </select>
                    </div>
                  </div>

                  <div className="ptw-row">
                    <div className="ptw-field">
                      <label>Objetivo *</label>
                      <select
                        value={newPrescricao.objetivoPrincipal}
                        onChange={(e) => setNewPrescricao(prev => ({ ...prev, objetivoPrincipal: e.target.value }))}
                        required
                      >
                        <option value="">Selecione</option>
                        <option value="Ganho de massa">Ganho de massa</option>
                        <option value="Redução de gordura">Redução de gordura</option>
                        <option value="Força">Força</option>
                        <option value="Resistência">Resistência</option>
                        <option value="Mobilidade">Mobilidade</option>
                      </select>
                    </div>

                    <div className="ptw-field">
                      <label>Duração (semanas) *</label>
                      <input
                        type="number"
                        value={newPrescricao.duracaoSemanas}
                        onChange={(e) => {
                          const semanas = e.target.value
                          setNewPrescricao(prev => {
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

                  <div className="ptw-row">
                    <div className="ptw-field">
                      <label>Nome do treino *</label>
                      <input
                        type="text"
                        value={newPrescricao.nome}
                        onChange={(e) => setNewPrescricao(prev => ({ ...prev, nome: e.target.value }))}
                        required
                        placeholder="Ex: Hipertrofia A/B – 8 semanas"
                      />
                    </div>
                  </div>

                  <div className="ptw-row">
                    <div className="ptw-field">
                      <label>Orientações (opcional)</label>
                      <textarea
                        value={newPrescricao.observacoes}
                        onChange={(e) => setNewPrescricao(prev => ({ ...prev, observacoes: e.target.value }))}
                        rows="4"
                        placeholder="Cardio complementar, ritmo, descanso, observações clínicas..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DIVISÕES */}
            {wizardStep === 2 && (
              <div className="ptw-panel">
                <div className="ptw-panel__title">Monte as divisões e exercícios</div>
                <div className="ptw-divisoes">
                  <div className="ptw-divisoes__top">
                    <div className="ptw-divisoes__meta">
                      <div className="ptw-divisoes__title">Divisões</div>
                      {newPrescricao.divisoes.length > 0 && (
                        <div className="ptw-divisoes__subtitle">
                          {newPrescricao.divisoes.length} {newPrescricao.divisoes.length === 1 ? 'divisão' : 'divisões'} •{' '}
                          {newPrescricao.divisoes.reduce((total, div) => total + (div.itens?.length || 0), 0)} exercícios
                        </div>
                      )}
                    </div>
                    <div className="ptw-divisoes__nav">
                      <div className="ptw-divisoes__counter">
                        Divisão {Math.min(activeDivIndex + 1, newPrescricao.divisoes.length)} de {newPrescricao.divisoes.length}
                      </div>
                      <div className="ptw-divisoes__nav-actions">
                        <button type="button" className="btn-secondary" onClick={goPrevDivisao} disabled={activeDivIndex === 0}>
                          ← Anterior
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={goNextDivisao}
                          disabled={activeDivIndex >= newPrescricao.divisoes.length - 1}
                        >
                          Próxima →
                        </button>
                        <button type="button" className="btn-secondary" onClick={addNextDivisaoGuided}>
                          + Adicionar próxima
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ptw-divisoes-tabs" role="tablist" aria-label="Divisões do treino">
                    {newPrescricao.divisoes.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeDivIndex}
                        className={`ptw-divisao-tab ${idx === activeDivIndex ? 'active' : ''} ${validateDivisao(d) ? 'done' : ''}`}
                        onClick={() => setActiveDivIndex(idx)}
                        title={d.nome ? d.nome : `Divisão ${idx + 1}`}
                      >
                        <span className="ptw-divisao-tab__num">{idx + 1}</span>
                        <span className="ptw-divisao-tab__label">{d.nome ? d.nome : 'Sem nome'}</span>
                      </button>
                    ))}
                    <button type="button" className="ptw-divisao-tab add" onClick={handleAddDivisao} title="Adicionar divisão">
                      + Divisão
                    </button>
                  </div>

                  {(() => {
                    const divIndex = activeDivIndex
                    const divisao = newPrescricao.divisoes?.[divIndex]
                    if (!divisao) return null
                    return (
                    <div className="ptw-divisao">
                      <div className="ptw-divisao__header">
                        <div className="ptw-divisao__heading">
                          <div className="ptw-divisao__title">Divisão {divIndex + 1}</div>
                          <div className="ptw-divisao__hint">
                            {[
                              divisao.itens?.length ? `${divisao.itens.length} exercícios` : 'Sem exercícios ainda',
                              [divisao.grupoMuscularPrincipal, divisao.grupoMuscularSecundario].filter(Boolean).join(' + ') || null,
                              divisao.diaSemana || null
                            ].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                        <div className="ptw-divisao__actions">
                          <button type="button" className="ptw-icon-btn" onClick={() => handleDuplicateDivisao(divIndex)} title="Duplicar divisão">
                            ⧉
                          </button>
                          <button
                            type="button"
                            className="ptw-icon-btn danger"
                            onClick={() => handleRemoveDivisao(divIndex)}
                            title="Remover divisão"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="ptw-fields">
                        {divisoesModelo.length > 0 && (
                          <details className="ptw-disclosure">
                            <summary className="ptw-disclosure__summary">Carregar divisão existente (opcional)</summary>
                            <div className="ptw-disclosure__content">
                              <select
                                value={divisao.divisaoTreinoId || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  const modelo = divisoesModelo.find(d => d.id === value)

                                  if (value && modelo) {
                                    setNewPrescricao(prev => ({
                                      ...prev,
                                      divisoes: prev.divisoes.map((d, i) =>
                                        i === divIndex
                                          ? {
                                              nome: modelo.nome || '',
                                              ordem: d.ordem,
                                              divisaoTreinoId: value,
                                              grupoMuscularPrincipal: '',
                                              grupoMuscularSecundario: '',
                                              diaSemana: '',
                                              itens: Array.isArray(modelo.itens) && modelo.itens.length > 0
                                                ? modelo.itens.map((item, idx) => ({
                                                    exercicioId: item.exercicio?.id || item.exercicioId || '',
                                                    series: item.series || 3,
                                                    repeticoes: item.repeticoes || '',
                                                    carga: item.carga || '',
                                                    descanso: item.descanso || '',
                                                    tipoExercicio: '',
                                                    enfase: '',
                                                    tempoDescanso: '',
                                                    ordem: item.ordem || idx + 1
                                                  }))
                                                : []
                                            }
                                          : d
                                      )
                                    }))
                                  } else if (!value) {
                                    setNewPrescricao(prev => ({
                                      ...prev,
                                      divisoes: prev.divisoes.map((d, i) =>
                                        i === divIndex ? { ...d, divisaoTreinoId: '' } : d
                                      )
                                    }))
                                  }
                                }}
                              >
                                <option value="">Selecione uma divisão...</option>
                                {divisoesModelo.map((div) => (
                                  <option key={div.id} value={div.id}>
                                    {div.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </details>
                        )}

                        <div className="ptw-row">
                          <div className="ptw-field">
                            <label>Nome da divisão *</label>
                            <input
                              type="text"
                              placeholder="Ex: A - Peito e Tríceps"
                              value={divisao.nome}
                              onChange={(e) => handleUpdateDivisao(divIndex, 'nome', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="ptw-row">
                          <div className="ptw-field">
                            <label>Grupo muscular (1)</label>
                            <select
                              value={divisao.grupoMuscularPrincipal || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                // evita duplicar seleção
                                setNewPrescricao((prev) => ({
                                  ...prev,
                                  divisoes: prev.divisoes.map((d, i) => {
                                    if (i !== divIndex) return d
                                    const next = { ...d, grupoMuscularPrincipal: value }
                                    if (value && value === (d.grupoMuscularSecundario || '')) next.grupoMuscularSecundario = ''
                                    return next
                                  })
                                }))
                              }}
                            >
                              <option value="">Selecione...</option>
                              {MUSCLE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="ptw-field">
                            <label>Grupo muscular (2) (opcional)</label>
                            <select
                              value={divisao.grupoMuscularSecundario || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value && value === (divisao.grupoMuscularPrincipal || '')) return
                                handleUpdateDivisao(divIndex, 'grupoMuscularSecundario', value)
                              }}
                            >
                              <option value="">Selecione...</option>
                              {MUSCLE_OPTIONS.filter((opt) => opt !== (divisao.grupoMuscularPrincipal || '')).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="ptw-row">
                          <div className="ptw-field">
                            <label>Dia sugerido</label>
                            <select
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

                      <div className="ptw-exercicios">
                        <div className="ptw-exercicios__title">Exercícios</div>
                        {divisao.itens.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="ptw-exercicio"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault()
                              const payload = getDragPayload(e)
                              if (!payload) return
                              if (payload.kind === 'item') {
                                if (payload.divIndex === divIndex) {
                                  handleMoveItem(divIndex, payload.itemIndex, itemIndex)
                                } else {
                                  handleMoveItemToDivisao(payload.divIndex, payload.itemIndex, divIndex, itemIndex)
                                }
                              }
                            }}
                          >
                            <div className="ptw-exercicio__row">
                              <div className="ptw-exercicio__main">
                                <label className="ptw-sr-only">Exercício</label>
                                <ExerciseCombobox
                                  exercicios={exercicios}
                                  value={item.exercicioId}
                                  onChange={(id) => handleUpdateItem(divIndex, itemIndex, 'exercicioId', id)}
                                />
                              </div>

                              <div className="ptw-exercicio__mini">
                                <label className="ptw-sr-only">Séries</label>
                                <input
                                  type="number"
                                  placeholder="Séries *"
                                  value={item.series}
                                  onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'series', e.target.value)}
                                  min="1"
                                  required
                                />
                              </div>

                              <div className="ptw-exercicio__mini">
                                <label className="ptw-sr-only">Repetições</label>
                                <input
                                  type="text"
                                  placeholder="Reps (ex: 10-12)"
                                  value={item.repeticoes}
                                  onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'repeticoes', e.target.value)}
                                />
                              </div>

                              <div className="ptw-exercicio__actions">
                                <button
                                  type="button"
                                  className="ptw-icon-btn"
                                  title="Arraste para reordenar"
                                  draggable
                                  onDragStart={(e) => setDragPayload(e, { kind: 'item', divIndex, itemIndex })}
                                >
                                  ⋮⋮
                                </button>
                                <button
                                  type="button"
                                  className="ptw-icon-btn"
                                  onClick={() => handleMoveItem(divIndex, itemIndex, itemIndex - 1)}
                                  title="Mover exercício para cima"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  className="ptw-icon-btn"
                                  onClick={() => handleMoveItem(divIndex, itemIndex, itemIndex + 1)}
                                  title="Mover exercício para baixo"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  className="ptw-icon-btn"
                                  onClick={() => handleDuplicateItem(divIndex, itemIndex)}
                                  title="Duplicar exercício"
                                >
                                  ⧉
                                </button>
                                <button
                                  type="button"
                                  className="ptw-link"
                                  onClick={() => toggleItemOptions(divIndex, itemIndex)}
                                >
                                  Opções
                                </button>
                                <button
                                  type="button"
                                  className="ptw-link-danger"
                                  onClick={() => handleRemoveItem(divIndex, itemIndex)}
                                  title="Remover exercício"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>

                            {showItemOptions[`${divIndex}:${itemIndex}`] && (
                              <div className="ptw-exercicio__options">
                                <div className="ptw-row">
                                  <div className="ptw-field">
                                    <label>Carga (opcional)</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: 20kg"
                                      value={item.carga}
                                      onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'carga', e.target.value)}
                                    />
                                  </div>

                                  <div className="ptw-field">
                                    <label>Descanso</label>
                                    <select
                                      value={item.tempoDescanso || ''}
                                      onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'tempoDescanso', e.target.value)}
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="30s">30s</option>
                                      <option value="45s">45s</option>
                                      <option value="60s">60s</option>
                                      <option value="90s">90s</option>
                                      <option value="120s">120s</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="ptw-row">
                                  <div className="ptw-field">
                                    <label>Descanso customizado</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: 2min entre séries"
                                      value={item.descanso}
                                      onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'descanso', e.target.value)}
                                    />
                                  </div>
                                  <div className="ptw-field">
                                    <label>Tipo</label>
                                    <select
                                      value={item.tipoExercicio || ''}
                                      onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'tipoExercicio', e.target.value)}
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="Composto">Composto</option>
                                      <option value="Isolado">Isolado</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="ptw-row">
                                  <div className="ptw-field">
                                    <label>Ênfase</label>
                                    <select
                                      value={item.enfase || ''}
                                      onChange={(e) => handleUpdateItem(divIndex, itemIndex, 'enfase', e.target.value)}
                                    >
                                      <option value="">Selecione...</option>
                                      <option value="Força">Força</option>
                                      <option value="Técnica">Técnica</option>
                                      <option value="Metabólico">Metabólico</option>
                                    </select>
                                  </div>
                                  <div className="ptw-field">
                                    <label>&nbsp;</label>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={() => toggleItemOptions(divIndex, itemIndex)}
                                    >
                                      Fechar opções
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleAddItem(divIndex)}
                        >
                          + Adicionar Exercício
                        </button>
                      </div>
                    </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* STEP 4: REVISÃO */}
            {wizardStep === 3 && (
              <div className="ptw-panel">
                <div className="ptw-panel__title">Revisão</div>
                <div className="ptw-review">
                  <div className="ptw-review__row">
                    <span>Aluno</span>
                    <b>{pacientes.find(p => p.id === newPrescricao.pacienteId)?.name || pacientes.find(p => p.id === newPrescricao.pacienteId)?.email}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Treino</span>
                    <b>{newPrescricao.nome}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Categoria</span>
                    <b>{newPrescricao.categoria}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Nível</span>
                    <b>{newPrescricao.nivelAluno}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Objetivo</span>
                    <b>{newPrescricao.objetivoPrincipal}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Duração</span>
                    <b>{newPrescricao.duracaoSemanas} semanas</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Divisões</span>
                    <b>{newPrescricao.divisoes.length}</b>
                  </div>
                  <div className="ptw-review__row">
                    <span>Total de exercícios</span>
                    <b>{newPrescricao.divisoes.reduce((t, d) => t + (d.itens?.length || 0), 0)}</b>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>
    </div>
  )
}

export default PrescricaoTreino

