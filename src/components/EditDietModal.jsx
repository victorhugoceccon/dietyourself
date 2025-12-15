import { useState, useEffect } from 'react'
import './EditDietModal.css'

const API_URL = 'http://localhost:5000/api'

function EditDietModal({ isOpen, onClose, dieta, pacienteId, onSave }) {
  const [editedDieta, setEditedDieta] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedMeals, setExpandedMeals] = useState(new Set())

  useEffect(() => {
    if (isOpen && dieta) {
      // Deep copy da dieta para edição
      setEditedDieta(JSON.parse(JSON.stringify(dieta)))
      // Expandir todas as refeições
      if (dieta.refeicoes) {
        setExpandedMeals(new Set(dieta.refeicoes.map((_, index) => index)))
      }
    }
  }, [isOpen, dieta])

  const toggleMeal = (index) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const updateItem = (mealIndex, itemIndex, field, value) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    
    if (field === 'alimento') {
      item.alimento = value
    } else if (field === 'porcao') {
      item.porcao = value
    } else if (field === 'kcal') {
      const kcal = parseFloat(value) || 0
      item.kcal = kcal
      
      // Recalcular total da refeição
      const totalRefeicao = newDieta.refeicoes[mealIndex].itens.reduce((sum, i) => sum + (i.kcal || 0), 0)
      newDieta.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicao
      
      // Recalcular total do dia
      const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
      newDieta.totalDiaKcal = totalDia
    }

    setEditedDieta(newDieta)
  }

  const removeItem = (mealIndex, itemIndex) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    newDieta.refeicoes[mealIndex].itens.splice(itemIndex, 1)
    
    // Recalcular total da refeição
    const totalRefeicao = newDieta.refeicoes[mealIndex].itens.reduce((sum, i) => sum + (i.kcal || 0), 0)
    newDieta.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicao
    
    // Recalcular total do dia
    const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
    newDieta.totalDiaKcal = totalDia

    setEditedDieta(newDieta)
  }

  const addItem = (mealIndex) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    const newItem = {
      alimento: 'Novo alimento',
      porcao: '100 g',
      kcal: 100,
      substituicoes: []
    }
    
    newDieta.refeicoes[mealIndex].itens.push(newItem)
    setEditedDieta(newDieta)
  }

  const handleSave = async () => {
    if (!editedDieta) return

    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${pacienteId}/dieta`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dieta: editedDieta
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar dieta')
      }

      if (onSave) {
        onSave(editedDieta)
      }

      onClose()
    } catch (error) {
      console.error('Erro ao salvar dieta:', error)
      setError(error.message || 'Erro ao salvar dieta')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !editedDieta) return null

  return (
    <div className="edit-diet-modal-overlay" onClick={onClose}>
      <div className="edit-diet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Editar Dieta</h2>
            <p className="modal-subtitle">Fazer alterações na dieta do paciente</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Resumo */}
          <div className="edit-summary">
            <div className="summary-item">
              <label>Total do Dia</label>
              <div className="summary-value">{editedDieta.totalDiaKcal} kcal</div>
            </div>
            <div className="summary-item">
              <label>Proteína</label>
              <div className="summary-value">{editedDieta.macrosDia?.proteina_g}g</div>
            </div>
            <div className="summary-item">
              <label>Carboidrato</label>
              <div className="summary-value">{editedDieta.macrosDia?.carbo_g}g</div>
            </div>
            <div className="summary-item">
              <label>Gordura</label>
              <div className="summary-value">{editedDieta.macrosDia?.gordura_g}g</div>
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Refeições editáveis */}
          <div className="editable-meals">
            {editedDieta.refeicoes && editedDieta.refeicoes.map((refeicao, mealIndex) => (
              <div key={mealIndex} className="editable-meal-card">
                <button
                  className={`meal-header ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                  onClick={() => toggleMeal(mealIndex)}
                  type="button"
                >
                  <div className="meal-header-content">
                    <h3 className="meal-name">{refeicao.nome}</h3>
                    <span className="meal-total">{refeicao.totalRefeicaoKcal} kcal</span>
                  </div>
                  <svg
                    className={`meal-expand-icon ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {expandedMeals.has(mealIndex) && (
                  <div className="meal-items-editable">
                    {refeicao.itens.map((item, itemIndex) => (
                      <div key={itemIndex} className="editable-food-item">
                        <div className="item-fields">
                          <input
                            type="text"
                            value={item.alimento}
                            onChange={(e) => updateItem(mealIndex, itemIndex, 'alimento', e.target.value)}
                            className="item-input alimento"
                            placeholder="Nome do alimento"
                          />
                          <input
                            type="text"
                            value={item.porcao}
                            onChange={(e) => updateItem(mealIndex, itemIndex, 'porcao', e.target.value)}
                            className="item-input porcao"
                            placeholder="Porção (ex: 100 g)"
                          />
                          <input
                            type="number"
                            value={item.kcal}
                            onChange={(e) => updateItem(mealIndex, itemIndex, 'kcal', e.target.value)}
                            className="item-input kcal"
                            placeholder="kcal"
                            min="0"
                            step="1"
                          />
                          <button
                            onClick={() => removeItem(mealIndex, itemIndex)}
                            className="remove-item-btn"
                            type="button"
                            title="Remover item"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addItem(mealIndex)}
                      className="add-item-btn"
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Adicionar alimento
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn" disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSave} className="save-btn" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditDietModal

