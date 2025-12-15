import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './DailyCheckInModal.css'

function DailyCheckInModal({ onClose, onCheckInComplete }) {
  const [adherence, setAdherence] = useState(null)
  const [pesoAtual, setPesoAtual] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkin-modal-form">
          <div className="checkin-modal-section">
            <label className="checkin-modal-label">
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


