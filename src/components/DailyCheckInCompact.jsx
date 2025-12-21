import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './DailyCheckInCompact.css'

function DailyCheckInCompact({ refreshTrigger, onCheckInComplete }) {
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTodayCheckIn()
  }, [refreshTrigger])

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
        } else {
          setTodayCheckIn(null)
          setAdherence(null)
          setPesoAtual('')
          setObservacao('')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar check-in:', error)
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
        setShowForm(false)
        if (onCheckInComplete) {
          onCheckInComplete()
        }
        // Recarregar para atualizar outros componentes
        loadTodayCheckIn()
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

  const getAdherenceInfo = (adherence) => {
    switch (adherence) {
      case 'TOTAL':
        return { emoji: '✅', label: 'Segui totalmente', color: '#4CAF50' }
      case 'PARCIAL':
        return { emoji: '⚡', label: 'Segui parcialmente', color: '#FF9800' }
      case 'NAO_SEGUIU':
        return { emoji: '🔄', label: 'Não segui', color: '#F44336' }
      default:
        return { emoji: '○', label: 'Não registrado', color: '#999' }
    }
  }

  if (loading) {
    return (
      <div className="daily-checkin-compact">
        <div className="checkin-loading">Carregando...</div>
      </div>
    )
  }

  const adherenceInfo = todayCheckIn ? getAdherenceInfo(todayCheckIn.adherence) : null

  return (
    <div className="daily-checkin-compact">
      {!showForm ? (
        <>
          {todayCheckIn ? (
            <div className="checkin-status-card">
              <div className="checkin-status-header">
                <div className="checkin-status-icon" style={{ backgroundColor: `${adherenceInfo.color}15`, borderColor: adherenceInfo.color }}>
                  <span className="checkin-status-emoji">{adherenceInfo.emoji}</span>
                </div>
                <div className="checkin-status-content">
                  <h3 className="checkin-status-title">Check-in de hoje</h3>
                  <p className="checkin-status-label">{adherenceInfo.label}</p>
                </div>
              </div>
              {todayCheckIn.pesoAtual && (
                <div className="checkin-status-detail">
                  <span className="checkin-detail-label">Peso:</span>
                  <span className="checkin-detail-value">{todayCheckIn.pesoAtual} kg</span>
                </div>
              )}
              {todayCheckIn.observacao && (
                <div className="checkin-status-note">
                  <p>"{todayCheckIn.observacao}"</p>
                </div>
              )}
              <button
                className="checkin-edit-btn"
                onClick={() => setShowForm(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Atualizar</span>
              </button>
            </div>
          ) : (
            <div className="checkin-prompt-card">
              <div className="checkin-prompt-icon">📝</div>
              <div className="checkin-prompt-content">
                <h3 className="checkin-prompt-title">Registre seu check-in</h3>
                <p className="checkin-prompt-description">Como foi sua adesão à dieta hoje?</p>
              </div>
              <button
                className="checkin-start-btn"
                onClick={() => setShowForm(true)}
              >
                Registrar
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="checkin-form-card">
          <div className="checkin-form-header">
            <h3 className="checkin-form-title">Check-in de hoje</h3>
            <button
              className="checkin-form-close"
              onClick={() => {
                setShowForm(false)
                if (todayCheckIn) {
                  setAdherence(todayCheckIn.adherence)
                  setPesoAtual(todayCheckIn.pesoAtual ? todayCheckIn.pesoAtual.toString() : '')
                  setObservacao(todayCheckIn.observacao || '')
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="checkin-form">
            <div className="checkin-form-section">
              <label className="checkin-form-label">Como foi a adesão hoje? *</label>
              <div className="adherence-options-compact">
                <button
                  type="button"
                  onClick={() => setAdherence('TOTAL')}
                  className={`adherence-option ${adherence === 'TOTAL' ? 'selected' : ''}`}
                  style={adherence === 'TOTAL' ? { borderColor: '#4CAF50', backgroundColor: '#4CAF5015' } : {}}
                >
                  <span className="adherence-option-emoji">✅</span>
                  <span className="adherence-option-label">Total</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdherence('PARCIAL')}
                  className={`adherence-option ${adherence === 'PARCIAL' ? 'selected' : ''}`}
                  style={adherence === 'PARCIAL' ? { borderColor: '#FF9800', backgroundColor: '#FF980015' } : {}}
                >
                  <span className="adherence-option-emoji">⚡</span>
                  <span className="adherence-option-label">Parcial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdherence('NAO_SEGUIU')}
                  className={`adherence-option ${adherence === 'NAO_SEGUIU' ? 'selected' : ''}`}
                  style={adherence === 'NAO_SEGUIU' ? { borderColor: '#F44336', backgroundColor: '#F4433615' } : {}}
                >
                  <span className="adherence-option-emoji">🔄</span>
                  <span className="adherence-option-label">Não segui</span>
                </button>
              </div>
            </div>

            <div className="checkin-form-section">
              <label htmlFor="peso-checkin" className="checkin-form-label">
                Peso atual (kg) <span className="optional">opcional</span>
              </label>
              <input
                id="peso-checkin"
                type="number"
                step="0.1"
                min="1"
                max="500"
                value={pesoAtual}
                onChange={(e) => setPesoAtual(e.target.value)}
                placeholder="Ex: 75.5"
                className="checkin-form-input"
              />
            </div>

            <div className="checkin-form-section">
              <label htmlFor="obs-checkin" className="checkin-form-label">
                Como foi o dia? <span className="optional">opcional</span>
              </label>
              <textarea
                id="obs-checkin"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Conte como foi seu dia..."
                maxLength={200}
                rows={2}
                className="checkin-form-textarea"
              />
            </div>

            <div className="checkin-form-actions">
              <button
                type="button"
                className="checkin-form-cancel"
                onClick={() => {
                  setShowForm(false)
                  if (todayCheckIn) {
                    setAdherence(todayCheckIn.adherence)
                    setPesoAtual(todayCheckIn.pesoAtual ? todayCheckIn.pesoAtual.toString() : '')
                    setObservacao(todayCheckIn.observacao || '')
                  }
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!adherence || saving}
                className="checkin-form-submit"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default DailyCheckInCompact




