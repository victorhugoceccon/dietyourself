import { useState, useRef, useEffect } from 'react'
import './FoodSwapModal.css'

const API_URL = 'http://localhost:5000/api'

function FoodSwapModal({ isOpen, onClose, foodItem, mealName, mealIndex, itemIndex, onConfirm, dieta }) {
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [swapResponse, setSwapResponse] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setInputMessage('')
      setSwapResponse(null)
      setError('')
    }
  }, [isOpen])

  const handleSendRequest = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    setLoading(true)
    setError('')
    setSwapResponse(null)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/diet/swap-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mealIndex,
          itemIndex,
          userDesiredFood: inputMessage.trim(),
          dieta
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.reason && response.status === 400) {
          setSwapResponse({
            ...data.details,
            infoMessage: data.reason
          })
        } else {
          throw new Error(data.error || data.reason || 'Erro ao buscar sugestões')
        }
        return
      }

      if (data.reasonBlocked) {
        setSwapResponse({
          ...data,
          infoMessage: data.reasonBlocked
        })
        return
      }

      setSwapResponse(data)

    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      setError(error.message || 'Erro ao buscar sugestões. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = (selectedItem) => {
    if (onConfirm) {
      const newItem = {
        alimento: selectedItem.alimento,
        porcao: selectedItem.porcaoEquivalente_g 
          ? `${selectedItem.porcaoEquivalente_g} g` 
          : selectedItem.porcao || '',
        kcal: selectedItem.kcalAproximada || selectedItem.kcal || 0
      }
      onConfirm(mealIndex, itemIndex, newItem)
    }
    handleClose()
  }

  const handleClose = () => {
    setInputMessage('')
    setSwapResponse(null)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="food-swap-overlay" onClick={handleClose}>
      <div className="food-swap-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="swap-modal-header">
          <div className="swap-header-content">
            <h2 className="swap-modal-title">Trocar Alimento</h2>
            <p className="swap-modal-subtitle">
              Substituir <span className="highlight">{foodItem?.alimento}</span> ({foodItem?.porcao}, {foodItem?.kcal} kcal) do <span className="highlight">{mealName}</span>
            </p>
          </div>
          <button className="swap-close-btn" onClick={handleClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="swap-modal-body">
          {/* Input Section */}
          <form onSubmit={handleSendRequest} className="swap-search-form">
            <label htmlFor="swap-input" className="swap-input-label">
              O que você gostaria de comer no lugar?
            </label>
            <div className="swap-input-container">
              <input
                ref={inputRef}
                id="swap-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ex: maçã, iogurte grego, aveia..."
                disabled={loading}
                className="swap-input-field"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="swap-search-btn"
              >
                {loading ? (
                  <div className="swap-spinner"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="swap-input-hint">
              Descreva o alimento desejado ou peça sugestões. Nossa IA irá sugerir opções adequadas.
            </p>
          </form>

          {/* Error Message */}
          {error && (
            <div className="swap-alert swap-alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Info Message */}
          {swapResponse && !swapResponse.bestMatch && (swapResponse.infoMessage || swapResponse.notes) && (
            <div className="swap-alert swap-alert-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{swapResponse.infoMessage || swapResponse.notes}</span>
            </div>
          )}

          {/* Suggestions */}
          {swapResponse && (swapResponse.bestMatch || swapResponse.suggestions) && (
            <div className="swap-suggestions">
              {/* Best Match */}
              {swapResponse.bestMatch && (
                <div className="swap-best-match-section">
                  <div className="swap-best-label">⭐ Melhor opção</div>
                  <div className="swap-item-card swap-best-card">
                    <div className="swap-item-info">
                      <div className="swap-item-name">{swapResponse.bestMatch.alimento}</div>
                      <div className="swap-item-meta">
                        <span className="swap-item-weight">{swapResponse.bestMatch.porcaoEquivalente_g} g</span>
                        <span className="swap-item-kcal">{swapResponse.bestMatch.kcalAproximada} kcal</span>
                      </div>
                      {swapResponse.bestMatch.observacao && (
                        <div className="swap-item-note">{swapResponse.bestMatch.observacao}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleConfirm(swapResponse.bestMatch)}
                      className="swap-select-btn swap-select-primary"
                    >
                      Selecionar
                    </button>
                  </div>
                </div>
              )}

              {/* Other Suggestions */}
              {swapResponse.suggestions && swapResponse.suggestions.length > 0 && (
                <div className="swap-other-suggestions">
                  <h3 className="swap-suggestions-title">
                    {swapResponse.bestMatch ? 'Outras opções:' : 'Opções disponíveis:'}
                  </h3>
                  <div className="swap-items-list">
                    {swapResponse.suggestions.map((suggestion, index) => (
                      <div key={index} className="swap-item-card">
                        <div className="swap-item-info">
                          <div className="swap-item-name">{suggestion.alimento}</div>
                          <div className="swap-item-meta">
                            <span className="swap-item-weight">{suggestion.porcaoEquivalente_g} g</span>
                            <span className="swap-item-kcal">{suggestion.kcalAproximada} kcal</span>
                          </div>
                          {suggestion.observacao && (
                            <div className="swap-item-note">{suggestion.observacao}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleConfirm(suggestion)}
                          className="swap-select-btn"
                        >
                          Selecionar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {swapResponse.notes && (
                <div className="swap-notes">
                  <p>{swapResponse.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="swap-modal-footer">
          <button onClick={handleClose} className="swap-cancel-btn">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default FoodSwapModal
