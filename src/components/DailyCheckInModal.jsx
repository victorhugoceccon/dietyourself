import { useState, useEffect } from 'react'
import { ArrowsClockwise, Barbell, CheckCircle, Drop, Lightning, MoonStars, Smiley, Target, Trophy, X } from '@phosphor-icons/react'
import { API_URL } from '../config/api'
import './DailyCheckInModal.css'

function DailyCheckInModal({ onClose, onCheckInComplete }) {
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [nivelEnergia, setNivelEnergia] = useState(null)
  const [qualidadeSono, setQualidadeSono] = useState(null)
  const [humorGeral, setHumorGeral] = useState(null)
  const [aguaMetaLitros, setAguaMetaLitros] = useState('')
  const [treinoPlanejado, setTreinoPlanejado] = useState(null)
  const [focoDia, setFocoDia] = useState('')
  const [dietMeals, setDietMeals] = useState([])
  const [refeicoesConsumidas, setRefeicoesConsumidas] = useState([])

  useEffect(() => {
    const loadDietMeals = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/diet`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setDietMeals(data.dieta?.refeicoes || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dieta:', error)
      }
    }
    loadDietMeals()
  }, [])

  const toggleMeal = (mealIndex) => {
    setRefeicoesConsumidas(prev => (
      prev.includes(mealIndex)
        ? prev.filter(index => index !== mealIndex)
        : [...prev, mealIndex]
    ))
  }

  const getDailyScore = () => {
    let score = 0
    if (adherence === 'TOTAL') score += 45
    if (adherence === 'PARCIAL') score += 25
    if (adherence === 'NAO_SEGUIU') score += 10

    if (nivelEnergia) score += nivelEnergia * 4
    if (qualidadeSono) score += qualidadeSono * 4
    if (humorGeral) score += humorGeral * 4
    if (aguaMetaLitros) score += 8
    if (treinoPlanejado !== null) score += 6
    if (focoDia) score += 6
    if (dietMeals.length > 0 && refeicoesConsumidas.length > 0) {
      score += Math.min(10, Math.round((refeicoesConsumidas.length / dietMeals.length) * 10))
    }

    return Math.min(100, score)
  }

  const dailyScore = getDailyScore()
  const scoreLabel = dailyScore >= 80 ? 'Dia de alta performance' : dailyScore >= 60 ? 'Dia consistente' : 'Dia de progresso'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!adherence) return

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adherence,
          pesoAtual: pesoAtual ? parseFloat(pesoAtual) : null,
          observacao: observacao.trim() || null,
          nivelEnergia,
          qualidadeSono,
          humorGeral,
          aguaMetaLitros: aguaMetaLitros ? parseFloat(aguaMetaLitros) : null,
          treinoPlanejado,
          focoDia: focoDia || null,
          refeicoesConsumidas: refeicoesConsumidas.length ? refeicoesConsumidas : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Fechar modal após um breve delay para feedback visual
        setTimeout(() => {
          if (onCheckInComplete) {
            onCheckInComplete()
          }
          if (onClose) {
            onClose()
          }
        }, 500)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar check-in')
        setSaving(false)
      }
    } catch (error) {
      console.error('Erro ao salvar check-in:', error)
      alert('Erro ao salvar check-in. Tente novamente.')
      setSaving(false)
    }
  }

  const today = new Date()
  const todayFormatted = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  return (
    <div className="checkin-modal-overlay" onClick={onClose}>
      <div className="checkin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkin-modal-header">
          <div>
            <h3 className="checkin-modal-title">Check-in de Hoje</h3>
            <p className="checkin-modal-date">{todayFormatted}</p>
          </div>
          <button className="checkin-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={24} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkin-modal-form">
          <div className="checkin-quick-score">
            <div className="checkin-quick-score__header">
              <span className="checkin-quick-score__badge">
                <Trophy size={16} weight="fill" /> Pontuação do dia
              </span>
              <strong>{dailyScore}/100</strong>
            </div>
            <div className="checkin-quick-score__bar">
              <span style={{ width: `${dailyScore}%` }} />
            </div>
            <p className="checkin-quick-score__hint">{scoreLabel}</p>
          </div>

          <div className="checkin-modal-section">
            <label className="checkin-modal-label">
              Como você pretende seguir a dieta hoje? *
            </label>
            <div className="adherence-options">
              <button
                type="button"
                onClick={() => setAdherence('TOTAL')}
                className={`adherence-btn ${adherence === 'TOTAL' ? 'selected' : ''}`}
              >
                <span className="adherence-emoji">
                  <CheckCircle size={18} weight="fill" />
                </span>
                <span className="adherence-label">Segui totalmente</span>
              </button>
              <button
                type="button"
                onClick={() => setAdherence('PARCIAL')}
                className={`adherence-btn ${adherence === 'PARCIAL' ? 'selected' : ''}`}
              >
                <span className="adherence-emoji">
                  <Lightning size={18} weight="fill" />
                </span>
                <span className="adherence-label">Segui parcialmente</span>
              </button>
              <button
                type="button"
                onClick={() => setAdherence('NAO_SEGUIU')}
                className={`adherence-btn ${adherence === 'NAO_SEGUIU' ? 'selected' : ''}`}
              >
                <span className="adherence-emoji">
                  <ArrowsClockwise size={18} weight="fill" />
                </span>
                <span className="adherence-label">Não segui</span>
              </button>
            </div>
          </div>

          <div className="checkin-modal-section">
            <label className="checkin-modal-label">Como você se sentiu hoje?</label>
            <div className="checkin-metric-grid">
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <Lightning size={18} weight="fill" />
                  <span>Energia</span>
                </div>
                <div className="checkin-metric-scale">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={`energia-${value}`}
                      type="button"
                      className={`checkin-scale-btn ${nivelEnergia === value ? 'active' : ''}`}
                      onClick={() => setNivelEnergia(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <MoonStars size={18} weight="fill" />
                  <span>Sono</span>
                </div>
                <div className="checkin-metric-scale">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={`sono-${value}`}
                      type="button"
                      className={`checkin-scale-btn ${qualidadeSono === value ? 'active' : ''}`}
                      onClick={() => setQualidadeSono(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <Smiley size={18} weight="fill" />
                  <span>Humor</span>
                </div>
                <div className="checkin-metric-scale">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={`humor-${value}`}
                      type="button"
                      className={`checkin-scale-btn ${humorGeral === value ? 'active' : ''}`}
                      onClick={() => setHumorGeral(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="checkin-modal-section">
            <label className="checkin-modal-label">Plano do dia</label>
            <div className="checkin-metric-grid two-columns">
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <Drop size={18} weight="fill" />
                  <span>Meta de água (L)</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={aguaMetaLitros}
                  onChange={(e) => setAguaMetaLitros(e.target.value)}
                  placeholder="Ex: 2.0"
                  className="checkin-modal-input"
                />
              </div>
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <Barbell size={18} weight="fill" />
                  <span>Treino hoje?</span>
                </div>
                <div className="checkin-toggle">
                  <button
                    type="button"
                    className={`checkin-toggle-btn ${treinoPlanejado === true ? 'active' : ''}`}
                    onClick={() => setTreinoPlanejado(true)}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className={`checkin-toggle-btn ${treinoPlanejado === false ? 'active' : ''}`}
                    onClick={() => setTreinoPlanejado(false)}
                  >
                    Não
                  </button>
                </div>
              </div>
              <div className="checkin-metric-card">
                <div className="checkin-metric-header">
                  <Target size={18} weight="fill" />
                  <span>Foco do dia</span>
                </div>
                <div className="checkin-focus-chips">
                  {['Disciplina', 'Hidratação', 'Energia', 'Leveza', 'Constância'].map((foco) => (
                    <button
                      key={foco}
                      type="button"
                      className={`checkin-focus-chip ${focoDia === foco ? 'selected' : ''}`}
                      onClick={() => setFocoDia(foco)}
                    >
                      {foco}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {dietMeals.length > 0 && (
            <div className="checkin-modal-section">
              <label className="checkin-modal-label">Refeições do dia</label>
              <div className="checkin-meal-chips">
                {dietMeals.map((refeicao, index) => (
                  <button
                    key={`${refeicao.nome || 'refeicao'}-${index}`}
                    type="button"
                    className={`checkin-meal-chip ${refeicoesConsumidas.includes(index) ? 'selected' : ''}`}
                    onClick={() => toggleMeal(index)}
                  >
                    {refeicao.nome || `Refeição ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="checkin-modal-section">
            <label htmlFor="peso-atual-modal" className="checkin-modal-label">
              Peso atual (kg) <span className="optional-label">opcional</span>
            </label>
            <input
              id="peso-atual-modal"
              type="number"
              step="0.1"
              min="1"
              max="500"
              value={pesoAtual}
              onChange={(e) => setPesoAtual(e.target.value)}
              placeholder="Ex: 75.5"
              className="checkin-modal-input"
            />
          </div>

          <div className="checkin-modal-section">
            <label htmlFor="observacao-modal" className="checkin-modal-label">
              Como foi o dia? <span className="optional-label">opcional</span>
            </label>
            <textarea
              id="observacao-modal"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Conte como foi seu dia em relação à dieta..."
              maxLength={500}
              rows={3}
              className="checkin-modal-textarea"
            />
            <div className="char-counter">{observacao.length}/500</div>
          </div>

          <div className="checkin-modal-footer">
            <button
              type="submit"
              disabled={!adherence || saving}
              className="checkin-modal-submit-btn"
            >
              {saving ? 'Salvando...' : 'Registrar Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DailyCheckInModal


