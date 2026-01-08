import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { API_URL } from '../config/api'
import './EditPatientDietModal.css'

function EditPatientDietModal({ isOpen, onClose, dieta, pacienteId, onSave }) {
  const [editedDieta, setEditedDieta] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [alimentos, setAlimentos] = useState([])
  const [loadingAlimentos, setLoadingAlimentos] = useState(false)
  const [searchAlimento, setSearchAlimento] = useState({ mealIndex: null, itemIndex: null, query: '', show: false })
  const [showCreateAlimento, setShowCreateAlimento] = useState(false)
  const [newAlimento, setNewAlimento] = useState({
    descricao: '',
    categoria: '',
    porcaoBase: '100',
    energiaKcal: '',
    proteina: '',
    lipideos: '',
    carboidrato: ''
  })
  const [creatingAlimento, setCreatingAlimento] = useState(false)
  const { theme } = useTheme()

  // Função para calcular macros a partir dos itens da dieta
  const calcularMacros = (dieta) => {
    if (!dieta || !dieta.refeicoes) return { proteina_g: 0, carbo_g: 0, gordura_g: 0 }

    let totalProteina = 0
    let totalCarbo = 0
    let totalGordura = 0

    dieta.refeicoes.forEach(refeicao => {
      if (refeicao.itens) {
        refeicao.itens.forEach(item => {
          // Tentar usar macros diretos do item
          if (item.macros) {
            totalProteina += item.macros.proteina_g || 0
            totalCarbo += item.macros.carbo_g || 0
            totalGordura += item.macros.gordura_g || 0
          }
        })
      }
    })

    return {
      proteina_g: Math.round(totalProteina * 10) / 10,
      carbo_g: Math.round(totalCarbo * 10) / 10,
      gordura_g: Math.round(totalGordura * 10) / 10
    }
  }

  // Função para recalcular totais da dieta
  const recalcularTotais = (dieta) => {
    if (!dieta || !dieta.refeicoes) return dieta

    const newDieta = { ...dieta }

    // Recalcular totais de cada refeição
    newDieta.refeicoes = newDieta.refeicoes.map(refeicao => {
      const totalRefeicao = (refeicao.itens || []).reduce((sum, i) => sum + (i.kcal || 0), 0)
      return {
        ...refeicao,
        totalRefeicaoKcal: Math.round(totalRefeicao * 10) / 10
      }
    })

    // Recalcular total do dia
    const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
    newDieta.totalDiaKcal = Math.round(totalDia * 10) / 10

    // Recalcular macros
    newDieta.macrosDia = calcularMacros(newDieta)

    return newDieta
  }

  useEffect(() => {
    if (isOpen && dieta) {
      console.log('EditPatientDietModal: Carregando dieta para edição', dieta)
      // Deep copy da dieta para edição
      const dietaCopy = JSON.parse(JSON.stringify(dieta))
      // Garantir que macrosDia existe, calculando se necessário
      if (!dietaCopy.macrosDia) {
        dietaCopy.macrosDia = calcularMacros(dietaCopy)
      }
      // Garantir que totalDiaKcal existe
      if (!dietaCopy.totalDiaKcal) {
        dietaCopy.totalDiaKcal = dietaCopy.refeicoes?.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0) || 0
      }
      // Recalcular totais para garantir consistência
      const dietaRecalculada = recalcularTotais(dietaCopy)
      setEditedDieta(dietaRecalculada)
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

  // Função auxiliar para converter diferentes unidades para gramas
  const converterParaGramas = (valor, unidade) => {
    const unidadeLower = unidade.toLowerCase().trim()
    switch (unidadeLower) {
      case 'ml':
      case 'mililitros':
      case 'mililitro':
        // Para líquidos, assumir densidade aproximada de 1g/ml (água)
        return valor
      case 'l':
      case 'litros':
      case 'litro':
        return valor * 1000 // 1 litro = 1000ml = 1000g (aproximado)
      case 'kg':
      case 'quilogramas':
      case 'quilograma':
        return valor * 1000
      case 'g':
      case 'gramas':
      case 'grama':
      default:
        return valor
    }
  }

  // Função auxiliar para extrair valor e unidade de uma string de porção
  const extrairQuantidadeEUnidade = (texto) => {
    // Regex para capturar número (com vírgula ou ponto decimal) e unidade
    const match = texto.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?/i)
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'))
      const unidade = match[2] || 'g' // Padrão: gramas
      return { valor, unidade }
    }
    return null
  }

  const updateItem = async (mealIndex, itemIndex, field, value) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    
    if (field === 'alimento') {
      item.alimento = value
    } else if (field === 'porcao') {
      item.porcao = value
      
      // Extrair quantidade e unidade da porção
      const quantidadeInfo = extrairQuantidadeEUnidade(value)
      if (quantidadeInfo && quantidadeInfo.valor > 0 && item.alimento) {
        // Converter para gramas
        const pesoGramas = converterParaGramas(quantidadeInfo.valor, quantidadeInfo.unidade)
        if (!isNaN(pesoGramas) && pesoGramas > 0) {
          // Buscar alimento se não tiver _alimentoData
          let alimentoData = item._alimentoData
          
          // Se não tiver _alimentoData, buscar pelo nome na lista de alimentos
          if (!alimentoData || !alimentoData.id) {
            const alimentoEncontrado = alimentos.find(a => 
              a.descricao.toLowerCase() === item.alimento.toLowerCase()
            )
            if (alimentoEncontrado) {
              alimentoData = alimentoEncontrado
              item._alimentoData = alimentoEncontrado // Salvar para próximas alterações
            }
          }
          
          // Se encontrou o alimento (com ou sem ID), calcular valores
          if (alimentoData) {
            if (alimentoData.id) {
              // Chamar API para recalcular valores automaticamente
              try {
                const token = localStorage.getItem('token')
                const response = await fetch(`${API_URL}/nutricionista/alimentos/calcular`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    alimentoId: alimentoData.id,
                    pesoGramas: pesoGramas
                  })
                })

                const data = await response.json()
                if (response.ok && data.calculado) {
                  // Atualizar valores calculados automaticamente
                  item.kcal = data.calculado.energiaKcal
                  item.macros = {
                    proteina_g: data.calculado.proteina || 0,
                    carbo_g: data.calculado.carboidrato || 0,
                    gordura_g: data.calculado.lipideos || 0
                  }
                } else {
                  // Fallback: calcular localmente se a API falhar
                  const fator = pesoGramas / 100
                  item.kcal = Math.round((alimentoData.energiaKcal || 0) * fator * 10) / 10
                  item.macros = {
                    proteina_g: Math.round((alimentoData.proteina || 0) * fator * 10) / 10,
                    carbo_g: Math.round((alimentoData.carboidrato || 0) * fator * 10) / 10,
                    gordura_g: Math.round((alimentoData.lipideos || 0) * fator * 10) / 10
                  }
                }
              } catch (error) {
                console.error('Erro ao recalcular valores:', error)
                // Fallback: calcular localmente
                const fator = pesoGramas / 100
                item.kcal = Math.round((alimentoData.energiaKcal || 0) * fator * 10) / 10
                item.macros = {
                  proteina_g: Math.round((alimentoData.proteina || 0) * fator * 10) / 10,
                  carbo_g: Math.round((alimentoData.carboidrato || 0) * fator * 10) / 10,
                  gordura_g: Math.round((alimentoData.lipideos || 0) * fator * 10) / 10
                }
              }
            } else {
              // Calcular localmente se não tiver ID
              const fator = pesoGramas / 100
              item.kcal = Math.round((alimentoData.energiaKcal || 0) * fator * 10) / 10
              if (item.macros || alimentoData.proteina) {
                item.macros = {
                  proteina_g: Math.round((alimentoData.proteina || 0) * fator * 10) / 10,
                  carbo_g: Math.round((alimentoData.carboidrato || 0) * fator * 10) / 10,
                  gordura_g: Math.round((alimentoData.lipideos || 0) * fator * 10) / 10
                }
              }
            }
          }
        }
      }
    }
    // Removido: não permitir edição manual de kcal (campo será somente leitura)

    // Recalcular todos os totais
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
  }

  // Função para calcular quantidade equivalente baseada nas calorias do item atual
  const calcularQuantidadeEquivalente = (alimentoNovo, itemAtual) => {
    if (!itemAtual || !itemAtual.kcal || itemAtual.kcal <= 0) {
      return null // Não há item atual ou não tem kcal
    }

    const kcalAtual = itemAtual.kcal
    const kcalPor100g = alimentoNovo.energiaKcal || 0
    
    if (kcalPor100g <= 0) {
      return null // Não há informação de kcal por 100g
    }

    // Calcular quantos gramas do novo alimento equivalem às kcal do atual
    const quantidadeGramas = (kcalAtual / kcalPor100g) * 100
    
    // Determinar unidade apropriada (ML para líquidos, G para sólidos)
    // Assumir que se o alimento contém palavras comuns de líquidos, usar ML
    const descricaoLower = alimentoNovo.descricao.toLowerCase()
    const isLiquido = descricaoLower.includes('leite') || 
                      descricaoLower.includes('suco') || 
                      descricaoLower.includes('água') || 
                      descricaoLower.includes('agua') ||
                      descricaoLower.includes('bebida') ||
                      descricaoLower.includes('líquido') ||
                      descricaoLower.includes('liquido')
    
    const unidade = isLiquido ? 'ml' : 'g'
    const quantidade = Math.round(quantidadeGramas)
    
    return { quantidade, unidade, kcal: kcalAtual }
  }

  const handleSelectAlimento = async (alimento, mealIndex, itemIndex, quantidadeSugerida = null) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    
    // Calcular quantidade equivalente se não for fornecida
    let quantidadeFinal = quantidadeSugerida
    if (!quantidadeFinal) {
      const equivalente = calcularQuantidadeEquivalente(alimento, item)
      if (equivalente) {
        // Mostrar sugestão e perguntar ao usuário
        const confirmacao = confirm(
          `Para manter as mesmas calorias (${equivalente.kcal.toFixed(1)} kcal), ` +
          `a quantidade sugerida é: ${equivalente.quantidade}${equivalente.unidade}. ` +
          `\n\nDeseja usar esta quantidade? (OK = usar sugestão, Cancelar = escolher manualmente)`
        )
        if (confirmacao) {
          quantidadeFinal = equivalente
        } else {
          // Perguntar quantidade manualmente
          const quantidadeInput = prompt(
            `Quantidade de "${alimento.descricao}"?\n` +
            `(Sugestão para ${equivalente.kcal.toFixed(1)} kcal: ${equivalente.quantidade}${equivalente.unidade})\n\n` +
            `Digite a quantidade (ex: 200g, 250ml, etc.):`,
            `${equivalente.quantidade}${equivalente.unidade}`
          )
          if (quantidadeInput) {
            const quantidadeInfo = extrairQuantidadeEUnidade(quantidadeInput)
            if (quantidadeInfo) {
              quantidadeFinal = {
                quantidade: converterParaGramas(quantidadeInfo.valor, quantidadeInfo.unidade),
                unidade: quantidadeInfo.unidade
              }
            }
          }
        }
      } else {
        // Sem item atual, perguntar quantidade padrão
        const quantidadeInput = prompt(
          `Quantidade de "${alimento.descricao}"? (ex: 100g, 200ml, etc.):`,
          '100g'
        )
        if (quantidadeInput) {
          const quantidadeInfo = extrairQuantidadeEUnidade(quantidadeInput)
          if (quantidadeInfo) {
            quantidadeFinal = {
              quantidade: converterParaGramas(quantidadeInfo.valor, quantidadeInfo.unidade),
              unidade: quantidadeInfo.unidade
            }
          }
        }
      }
    }

    // Converter para objeto se for número simples
    if (typeof quantidadeFinal === 'number') {
      quantidadeFinal = { quantidade: quantidadeFinal, unidade: 'g' }
    }

    if (!quantidadeFinal || !quantidadeFinal.quantidade) {
      return // Usuário cancelou
    }

    const pesoGramas = quantidadeFinal.quantidade
    const unidade = quantidadeFinal.unidade || 'g'

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
        item.alimento = alimento.descricao
        item.porcao = `${Math.round(pesoGramas)} ${unidade}`
        item.kcal = data.calculado.energiaKcal
        item._alimentoData = alimento // Guardar dados do alimento para recálculo
        // Adicionar macros se disponíveis
        if (data.calculado) {
          item.macros = {
            proteina_g: data.calculado.proteina || 0,
            carbo_g: data.calculado.carboidrato || 0,
            gordura_g: data.calculado.lipideos || 0
          }
        }
        
        // Recalcular todos os totais
        const dietaRecalculada = recalcularTotais(newDieta)
        setEditedDieta(dietaRecalculada)
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
    
    // Recalcular todos os totais
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
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
    // Recalcular todos os totais
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
  }

  const handleCreateAlimento = async (e) => {
    e.preventDefault()
    setCreatingAlimento(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      // Converter valores da porção base para valores por 100g
      const porcaoBase = parseFloat(newAlimento.porcaoBase) || 100
      const fator = porcaoBase > 0 ? 100 / porcaoBase : 1

      const energiaKcal = parseFloat(newAlimento.energiaKcal) || 0
      const proteina = parseFloat(newAlimento.proteina) || 0
      const lipideos = parseFloat(newAlimento.lipideos) || 0
      const carboidrato = parseFloat(newAlimento.carboidrato) || 0

      const response = await fetch(`${API_URL}/nutricionista/alimentos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          descricao: newAlimento.descricao,
          categoria: newAlimento.categoria || null,
          energiaKcal: Math.round(energiaKcal * fator * 10) / 10,
          proteina: Math.round(proteina * fator * 10) / 10,
          lipideos: Math.round(lipideos * fator * 10) / 10,
          carboidrato: Math.round(carboidrato * fator * 10) / 10,
          porcaoBase: porcaoBase
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar alimento')
      }

      // Limpar formulário e fechar modal
      setNewAlimento({
        descricao: '',
        categoria: '',
        porcaoBase: '100',
        energiaKcal: '',
        proteina: '',
        lipideos: '',
        carboidrato: ''
      })
      setShowCreateAlimento(false)
      
      // Recarregar lista de alimentos
      loadAlimentos()
      
      // Mostrar mensagem de sucesso
      alert('Alimento criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar alimento:', error)
      setError(error.message || 'Erro ao criar alimento')
    } finally {
      setCreatingAlimento(false)
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
        onSave(data.dieta || editedDieta)
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
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowCreateAlimento(true)}
              className="btn-add-food-modal"
              title="Criar novo alimento"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Novo Alimento
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
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
                                    {filteredAlimentos.map((alim) => {
                                      const itemAtual = editedDieta?.refeicoes[mealIndex]?.itens[itemIndex]
                                      const equivalente = calcularQuantidadeEquivalente(alim, itemAtual)
                                      
                                      return (
                                        <div
                                          key={alim.id}
                                          className="alimento-search-item"
                                          onClick={() => {
                                            handleSelectAlimento(alim, mealIndex, itemIndex, null)
                                          }}
                                        >
                                          <div className="alimento-search-name">{alim.descricao}</div>
                                          <div className="alimento-search-info">
                                            {alim.energiaKcal} kcal/100g • {alim.proteina}g prot • {alim.carboidrato}g carb
                                          </div>
                                          {equivalente && (
                                            <div className="alimento-search-equivalente">
                                              💡 Sugestão: ~{equivalente.quantidade}{equivalente.unidade} ({equivalente.kcal.toFixed(1)} kcal)
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
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
                            placeholder="Peso (ex: 50 g)"
                            title="Digite o peso em gramas (ex: 50 g). Os valores nutricionais serão calculados automaticamente."
                          />
                          <div className="food-input kcal readonly" title="Valor calculado automaticamente baseado no peso">
                            {item.kcal || 0} kcal
                          </div>
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

      {/* Modal de Criar Alimento */}
      {showCreateAlimento && (
        <div className="modal-overlay-nested" onClick={() => setShowCreateAlimento(false)}>
          <div className="modal-content-nested alimento-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cadastrar Novo Alimento</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateAlimento(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAlimento} className="alimento-form">
              <div className="form-group">
                <label>Descrição *</label>
                <input
                  type="text"
                  value={newAlimento.descricao}
                  onChange={(e) => setNewAlimento({ ...newAlimento, descricao: e.target.value })}
                  required
                  placeholder="Ex: Arroz, integral, cozido"
                />
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <input
                  type="text"
                  value={newAlimento.categoria}
                  onChange={(e) => setNewAlimento({ ...newAlimento, categoria: e.target.value })}
                  placeholder="Ex: Cereais e derivados"
                />
              </div>

              <div className="form-group">
                <label>Porção Base (g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.porcaoBase}
                  onChange={(e) => setNewAlimento({ ...newAlimento, porcaoBase: e.target.value })}
                  required
                  min="0.1"
                  placeholder="Ex: 100 (padrão), 32 (whey protein)"
                />
                <small>Valores serão convertidos para 100g automaticamente</small>
              </div>

              <div className="form-group">
                <label>Energia (kcal por {newAlimento.porcaoBase || '100'}g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.energiaKcal}
                  onChange={(e) => setNewAlimento({ ...newAlimento, energiaKcal: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Proteína (g por {newAlimento.porcaoBase || '100'}g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.proteina}
                  onChange={(e) => setNewAlimento({ ...newAlimento, proteina: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Lipídios (g por {newAlimento.porcaoBase || '100'}g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.lipideos}
                  onChange={(e) => setNewAlimento({ ...newAlimento, lipideos: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Carboidrato (g por {newAlimento.porcaoBase || '100'}g) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newAlimento.carboidrato}
                  onChange={(e) => setNewAlimento({ ...newAlimento, carboidrato: e.target.value })}
                  required
                  min="0"
                />
              </div>

              {error && (
                <div className="error-alert" style={{ marginTop: '1rem' }}>
                  {error}
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateAlimento(false)}
                  className="cancel-btn"
                  disabled={creatingAlimento}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={creatingAlimento}
                >
                  {creatingAlimento ? 'Criando...' : 'Criar Alimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditPatientDietModal

