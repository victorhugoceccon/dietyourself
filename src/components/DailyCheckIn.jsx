import { useState, useEffect } from 'react'
import './DailyCheckIn.css'

const API_URL = 'http://localhost:5000/api'

function DailyCheckIn({ onCheckInComplete }) {
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    loadTodayCheckIn()
  }, [])

  const loadTodayCheckIn = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/checkin/today`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.checkIn) {
          setTodayCheckIn(data.checkIn)
          setAdherence(data.checkIn.adherence)
          setPesoAtual(data.checkIn.pesoAtual ? data.checkIn.pesoAtual.toString() : '')
          setObservacao(data.checkIn.observacao || '')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar check-in de hoje:', error)
    } finally {
      setLoading(false)
    }
  }

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
          observacao: observacao.trim() || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTodayCheckIn(data.checkIn)
        setShowSuccess(true)
        
        // Feedback visual
        setTimeout(() => {
          setShowSuccess(false)
        }, 3000)

        if (onCheckInComplete) {
          onCheckInComplete()
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar check-in')
      }
    } catch (error) {
      console.error('Erro ao salvar check-in:', error)
      alert('Erro ao salvar check-in. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="daily-checkin-card">
        <div className="checkin-loading">Carregando...</div>
      </div>
    )
  }

  const today = new Date()
  const todayFormatted = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  return (
    <div className="daily-checkin-card">
      <div className="checkin-header">
        <h3 className="checkin-title">Check-in de Hoje</h3>
        <p className="checkin-date">{todayFormatted}</p>
      </div>

      {showSuccess && (
        <div className="checkin-success-message">
          <span className="success-icon">✓</span>
          <span>Check-in registrado com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="checkin-form">
        <div className="checkin-section">
          <label className="checkin-section-label">
            Como foi a adesão à dieta hoje? *
          </label>
          <div className="adherence-options">
            <button
              type="button"
              onClick={() => setAdherence('TOTAL')}
              className={`adherence-btn ${adherence === 'TOTAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">✅</span>
              <span className="adherence-label">Segui totalmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('PARCIAL')}
              className={`adherence-btn ${adherence === 'PARCIAL' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">⚡</span>
              <span className="adherence-label">Segui parcialmente</span>
            </button>
            <button
              type="button"
              onClick={() => setAdherence('NAO_SEGUIU')}
              className={`adherence-btn ${adherence === 'NAO_SEGUIU' ? 'selected' : ''}`}
            >
              <span className="adherence-emoji">🔄</span>
              <span className="adherence-label">Não segui</span>
            </button>
          </div>
        </div>

        <div className="checkin-section">
          <label htmlFor="peso-atual" className="checkin-section-label">
            Peso atual (kg) <span className="optional-label">opcional</span>
          </label>
          <input
            id="peso-atual"
            type="number"
            step="0.1"
            min="1"
            max="500"
            value={pesoAtual}
            onChange={(e) => setPesoAtual(e.target.value)}
            placeholder="Ex: 75.5"
            className="checkin-input"
          />
        </div>

        <div className="checkin-section">
          <label htmlFor="observacao" className="checkin-section-label">
            Como foi o dia? <span className="optional-label">opcional</span>
          </label>
          <textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Conte como foi seu dia em relação à dieta..."
            maxLength={500}
            rows={3}
            className="checkin-textarea"
          />
          <div className="char-counter">{observacao.length}/500</div>
        </div>

        <button
          type="submit"
          disabled={!adherence || saving}
          className="checkin-submit-btn"
        >
          {saving ? 'Salvando...' : todayCheckIn ? 'Atualizar Check-in' : 'Registrar Check-in'}
        </button>
      </form>
    </div>
  )
}

export default DailyCheckIn

