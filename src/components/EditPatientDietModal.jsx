import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { API_URL } from '../config/api'
import './EditPatientDietModal.css'

function EditPatientDietModal({ isOpen, onClose, dieta, pacienteId, onSave }) {
  const [editedDieta, setEditedDieta] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [loadingAI, setLoadingAI] = useState(null) // { mealIndex: X } ou { mealIndex: X, itemIndex: Y }
  const [alimentos, setAlimentos] = useState([])
  const [loadingAlimentos, setLoadingAlimentos] = useState(false)
  const [searchAlimento, setSearchAlimento] = useState({ mealIndex: null, itemIndex: null, query: '', show: false })
  const { theme } = useTheme()

  useEffect(() => {
    if (isOpen && dieta) {
      console.log('EditPatientDietModal: Carregando dieta para edição', dieta)
      // Deep copy da dieta para edição
      setEditedDieta(JSON.parse(JSON.stringify(dieta)))
      // Expandir todas as refeições
      if (dieta.refeicoes) {
        setExpandedMeals(new Set(dieta.refeicoes.map((_, index) => index)))
      }
    } else if (!isOpen) {
      // Limpar quando fechar
      setEditedDieta(null)
      setError('')
      setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
    }
  }, [isOpen, dieta])

  useEffect(() => {
    if (isOpen) {
      loadAlimentos()
    }
  }, [isOpen])

  const loadAlimentos = async () => {
    setLoadingAlimentos(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlimentos(data.alimentos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar alimentos:', error)
    } finally {
      setLoadingAlimentos(false)
    }
  }

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
      
      // Se a porção contém peso em gramas, tentar calcular kcal
      const pesoMatch = value.match(/(\d+(?:[.,]\d+)?)\s*g/i)
      if (pesoMatch && item._alimentoData) {
        const pesoGramas = parseFloat(pesoMatch[1].replace(',', '.'))
        if (!isNaN(pesoGramas) && item._alimentoData) {
          const fator = pesoGramas / 100
          item.kcal = Math.round(item._alimentoData.energiaKcal * fator * 10) / 10
          
          // Recalcular total da refeição
          const totalRefeicao = newDieta.refeicoes[mealIndex].itens.reduce((sum, i) => sum + (i.kcal || 0), 0)
          newDieta.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicao
          
          // Recalcular total do dia
          const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
          newDieta.totalDiaKcal = totalDia
        }
      }
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

  const handleSelectAlimento = async (alimento, mealIndex, itemIndex, pesoGramas = 100) => {
    if (!editedDieta) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/alimentos/calcular`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alimentoId: alimento.id,
          pesoGramas: pesoGramas
        })
      })

      const data = await response.json()
      if (response.ok && data.calculado) {
        const newDieta = { ...editedDieta }
        const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
        
        item.alimento = alimento.descricao
        item.porcao = `${pesoGramas} g`
        item.kcal = data.calculado.energiaKcal
        item._alimentoData = alimento // Guardar dados do alimento para recálculo
        
        // Recalcular total da refeição
        const totalRefeicao = newDieta.refeicoes[mealIndex].itens.reduce((sum, i) => sum + (i.kcal || 0), 0)
        newDieta.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicao
        
        // Recalcular total do dia
        const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
        newDieta.totalDiaKcal = totalDia
        
        setEditedDieta(newDieta)
        setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
      }
    } catch (error) {
      console.error('Erro ao calcular valores do alimento:', error)
      setError('Erro ao calcular valores do alimento')
    }
  }

  const filteredAlimentos = alimentos.filter(a => 
    a.descricao.toLowerCase().includes(searchAlimento.query.toLowerCase())
  ).slice(0, 10) // Limitar a 10 resultados

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

  const handleAISuggestion = async (mealIndex, itemIndex = null) => {
    if (!editedDieta) return

    setLoadingAI(itemIndex !== null ? { mealIndex, itemIndex } : { mealIndex })
    setError('')

    try {
      const token = localStorage.getItem('token')
      const refeicao = editedDieta.refeicoes[mealIndex]
      
      const response = await fetch(`${API_URL}/nutricionista/ai-suggestion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pacienteId,
          mealIndex,
          itemIndex,
          mealData: refeicao,
          currentDiet: editedDieta
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao obter sugestão da IA')
      }

      // Atualizar com sugestão
      if (itemIndex !== null) {
        // Sugestão para item específico
        const newDieta = { ...editedDieta }
        if (data.suggestion) {
          Object.assign(newDieta.refeicoes[mealIndex].itens[itemIndex], data.suggestion)
          // Recalcular totais
          const totalRefeicao = newDieta.refeicoes[mealIndex].itens.reduce((sum, i) => sum + (i.kcal || 0), 0)
          newDieta.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicao
          const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
          newDieta.totalDiaKcal = totalDia
          setEditedDieta(newDieta)
        }
      } else {
        // Sugestão para refeição inteira
        if (data.suggestion && data.suggestion.itens) {
          const newDieta = { ...editedDieta }
          newDieta.refeicoes[mealIndex].itens = data.suggestion.itens
          newDieta.refeicoes[mealIndex].totalRefeicaoKcal = data.suggestion.totalRefeicaoKcal || 0
          // Recalcular total do dia
          const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
          newDieta.totalDiaKcal = totalDia
          setEditedDieta(newDieta)
        }
      }

    } catch (error) {
      console.error('Erro ao obter sugestão da IA:', error)
      setError(error.message || 'Erro ao obter sugestão da IA')
    } finally {
      setLoadingAI(null)
    }
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

  const isLoadingAI = (mealIndex, itemIndex = null) => {
    if (!loadingAI) return false
    if (itemIndex !== null) {
      return loadingAI.mealIndex === mealIndex && loadingAI.itemIndex === itemIndex
    }
    return loadingAI.mealIndex === mealIndex && loadingAI.itemIndex === undefined
  }

  return (
    <div 
      className={`edit-patient-diet-modal-overlay ${theme}`} 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
          onClose()
        }
      }}
    >
      <div className="edit-patient-diet-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Editar Dieta do Paciente</h2>
            <p className="modal-subtitle">Modifique os alimentos, quantidades e calorias</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="modal-content-wrapper">
          {/* Resumo */}
          <div className="summary-section">
            <div className="summary-card total">
              <div className="summary-label">Total do Dia</div>
              <div className="summary-value">{editedDieta.totalDiaKcal}</div>
              <div className="summary-unit">kcal</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Proteína</div>
              <div className="summary-value">{editedDieta.macrosDia?.proteina_g || 0}</div>
              <div className="summary-unit">g</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Carboidrato</div>
              <div className="summary-value">{editedDieta.macrosDia?.carbo_g || 0}</div>
              <div className="summary-unit">g</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Gordura</div>
              <div className="summary-value">{editedDieta.macrosDia?.gordura_g || 0}</div>
              <div className="summary-unit">g</div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Refeições */}
          <div className="meals-section">
            {editedDieta.refeicoes && editedDieta.refeicoes.map((refeicao, mealIndex) => (
              <div key={mealIndex} className="meal-card">
                <div className="meal-header">
                  <div className="meal-header-left">
                    <h3 className="meal-name">{refeicao.nome}</h3>
                    <span className="meal-total">{refeicao.totalRefeicaoKcal} kcal</span>
                  </div>
                  <div className="meal-header-right">
                    <button
                      onClick={() => handleAISuggestion(mealIndex)}
                      className="ai-suggestion-btn meal"
                      disabled={isLoadingAI(mealIndex)}
                      title="Sugestão de IA para toda a refeição"
                    >
                      {isLoadingAI(mealIndex) ? (
                        <div className="loading-spinner-small"></div>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          IA - Refeição
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleMeal(mealIndex)}
                      className="toggle-meal-btn"
                      type="button"
                    >
                      <svg
                        className={`toggle-icon ${expandedMeals.has(mealIndex) ? 'expanded' : ''}`}
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {expandedMeals.has(mealIndex) && (
                  <div className="meal-items">
                    {refeicao.itens.map((item, itemIndex) => (
                      <div key={itemIndex} className="food-item">
                        <div className="food-item-content">
                          <div className="alimento-input-wrapper">
                            <input
                              type="text"
                              value={item.alimento}
                              onChange={(e) => updateItem(mealIndex, itemIndex, 'alimento', e.target.value)}
                              onFocus={() => setSearchAlimento({ mealIndex, itemIndex, query: item.alimento || '', show: true })}
                              className="food-input alimento"
                              placeholder="Nome do alimento"
                            />
                            {searchAlimento.show && searchAlimento.mealIndex === mealIndex && searchAlimento.itemIndex === itemIndex && (
                              <div className="alimento-search-dropdown">
                                <input
                                  type="text"
                                  value={searchAlimento.query}
                                  onChange={(e) => setSearchAlimento({ ...searchAlimento, query: e.target.value })}
                                  className="alimento-search-input"
                                  placeholder="Buscar alimento..."
                                  autoFocus
                                />
                                {loadingAlimentos ? (
                                  <div className="alimento-search-loading">Carregando...</div>
                                ) : filteredAlimentos.length > 0 ? (
                                  <div className="alimento-search-list">
                                    {filteredAlimentos.map((alim) => (
                                      <div
                                        key={alim.id}
                                        className="alimento-search-item"
                                        onClick={() => {
                                          const peso = prompt(`Quantos gramas de "${alim.descricao}"? (padrão: 100g)`, '100')
                                          if (peso) {
                                            handleSelectAlimento(alim, mealIndex, itemIndex, parseFloat(peso) || 100)
                                          }
                                        }}
                                      >
                                        <div className="alimento-search-name">{alim.descricao}</div>
                                        <div className="alimento-search-info">
                                          {alim.energiaKcal} kcal/100g • {alim.proteina}g prot • {alim.carboidrato}g carb
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="alimento-search-empty">Nenhum alimento encontrado</div>
                                )}
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={item.porcao}
                            onChange={(e) => updateItem(mealIndex, itemIndex, 'porcao', e.target.value)}
                            className="food-input porcao"
                            placeholder="Porção (ex: 100 g)"
                          />
                          <input
                            type="number"
                            value={item.kcal}
                            onChange={(e) => updateItem(mealIndex, itemIndex, 'kcal', e.target.value)}
                            className="food-input kcal"
                            placeholder="kcal"
                            min="0"
                            step="1"
                          />
                          <button
                            onClick={() => handleAISuggestion(mealIndex, itemIndex)}
                            className="ai-suggestion-btn item"
                            disabled={isLoadingAI(mealIndex, itemIndex)}
                            title="Sugestão de IA para este alimento"
                          >
                            {isLoadingAI(mealIndex, itemIndex) ? (
                              <div className="loading-spinner-small"></div>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
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
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn" disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSave} className="save-btn" disabled={saving}>
            {saving ? (
              <>
                <div className="loading-spinner-small"></div>
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditPatientDietModal

