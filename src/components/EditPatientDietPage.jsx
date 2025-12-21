import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { API_URL } from '../config/api'
// import FoodSwapModal from './FoodSwapModal' // Desativado temporariamente
import './EditPatientDietPage.css'

function EditPatientDietPage() {
  const { pacienteId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  
  const [dieta, setDieta] = useState(null)
  const [editedDieta, setEditedDieta] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [nutritionalNeeds, setNutritionalNeeds] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedMeals, setExpandedMeals] = useState(new Set())
  const [alimentos, setAlimentos] = useState([])
  const [searchAlimento, setSearchAlimento] = useState({ mealIndex: null, itemIndex: null, query: '', show: false })
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [selectedFoodItem, setSelectedFoodItem] = useState(null)
  const [selectedMealIndex, setSelectedMealIndex] = useState(null)
  const [selectedItemIndex, setSelectedItemIndex] = useState(null)
  const [showEditNeeds, setShowEditNeeds] = useState(false)
  const [editedNeeds, setEditedNeeds] = useState(null)

  useEffect(() => {
    if (pacienteId) {
      loadDieta()
      loadAlimentos()
    }
  }, [pacienteId])

  const loadDieta = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${pacienteId}/dieta`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.paciente) {
          setPaciente(data.paciente)
        }
        
        let dietaRaw = data.dieta?.dieta || data.dieta
        const needs = data.dieta?.nutritionalNeeds || data.nutritionalNeeds
        
        if (needs) {
          setNutritionalNeeds(needs)
          setEditedNeeds({ ...needs })
        }
        
        if (dietaRaw) {
          let dietaProcessada = { ...dietaRaw }
          
          if (!dietaProcessada.totalDiaKcal || dietaProcessada.totalDiaKcal === 0) {
            const total = dietaProcessada.refeicoes?.reduce((sum, r) => {
              return sum + (r.totalRefeicaoKcal || 0)
            }, 0) || 0
            dietaProcessada.totalDiaKcal = total
          }
          
          if (!dietaProcessada.macrosDia) {
            let totalProteina = 0
            let totalCarbo = 0
            let totalGordura = 0

            dietaProcessada.refeicoes?.forEach(refeicao => {
              refeicao.itens?.forEach(item => {
                if (item.macros) {
                  totalProteina += item.macros.proteina_g || 0
                  totalCarbo += item.macros.carbo_g || 0
                  totalGordura += item.macros.gordura_g || 0
                }
              })
            })

            dietaProcessada.macrosDia = {
              proteina_g: Math.round(totalProteina * 10) / 10,
              carbo_g: Math.round(totalCarbo * 10) / 10,
              gordura_g: Math.round(totalGordura * 10) / 10
            }
          }
          
          dietaProcessada.refeicoes?.forEach(refeicao => {
            refeicao.itens?.forEach(item => {
              if (item.porcaoValor === undefined) {
                const match = item.porcao?.match(/(\d+(?:[.,]\d+)?)/)
                if (match) {
                  item.porcaoValor = parseFloat(match[1].replace(',', '.'))
                } else {
                  item.porcaoValor = 100
                }
              }
              
              if (!item.unidadeExibicao) {
                const matchUnidade = item.porcao?.match(/(ml|g|gramas?|mililitros?)/i)
                if (matchUnidade) {
                  item.unidadeExibicao = matchUnidade[0].toLowerCase().includes('ml') ? 'ml' : 'g'
                } else {
                  item.unidadeExibicao = 'g'
                }
              }
              
              if (item.porcaoValor !== undefined) {
                item.porcao = `${item.porcaoValor} ${item.unidadeExibicao}`
              }
            })
          })
          
          setDieta(dietaProcessada)
          setEditedDieta(JSON.parse(JSON.stringify(dietaProcessada)))
          
          if (dietaProcessada.refeicoes) {
            setExpandedMeals(new Set(dietaProcessada.refeicoes.map((_, index) => index)))
          }
        } else {
          setDieta(null)
          setEditedDieta(null)
        }
      } else {
        throw new Error('Erro ao carregar dieta')
      }
    } catch (error) {
      console.error('Erro ao carregar dieta:', error)
      setError(error.message || 'Erro ao carregar dieta')
    } finally {
      setLoading(false)
    }
  }

  const loadAlimentos = async () => {
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
    }
  }

  // Função para normalizar texto (remover acentos)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  const recalcularTotais = (dieta) => {
    if (!dieta || !dieta.refeicoes) return dieta

    const newDieta = { ...dieta }

    newDieta.refeicoes = newDieta.refeicoes.map(refeicao => {
      const totalRefeicao = (refeicao.itens || []).reduce((sum, i) => sum + (i.kcal || 0), 0)
      return {
        ...refeicao,
        totalRefeicaoKcal: Math.round(totalRefeicao * 10) / 10
      }
    })

    const totalDia = newDieta.refeicoes.reduce((sum, r) => sum + (r.totalRefeicaoKcal || 0), 0)
    newDieta.totalDiaKcal = Math.round(totalDia * 10) / 10

    let totalProteina = 0
    let totalCarbo = 0
    let totalGordura = 0

    newDieta.refeicoes.forEach(refeicao => {
      if (refeicao.itens) {
        refeicao.itens.forEach(item => {
          if (item.macros) {
            totalProteina += item.macros.proteina_g || 0
            totalCarbo += item.macros.carbo_g || 0
            totalGordura += item.macros.gordura_g || 0
          }
        })
      }
    })

    newDieta.macrosDia = {
      proteina_g: Math.round(totalProteina * 10) / 10,
      carbo_g: Math.round(totalCarbo * 10) / 10,
      gordura_g: Math.round(totalGordura * 10) / 10
    }

    return newDieta
  }

  const updateItem = async (mealIndex, itemIndex, field, value) => {
    if (!editedDieta) return

    const newDieta = JSON.parse(JSON.stringify(editedDieta))
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    
    if (field === 'alimento') {
      item.alimento = value
    } else if (field === 'porcao') {
      const valorNumerico = parseFloat(value) || 0
      if (!isNaN(valorNumerico)) {
        item.porcaoValor = valorNumerico
        item.porcao = `${valorNumerico} ${item.unidadeExibicao || 'g'}`
        
        // Recalcular valores nutricionais quando a porção muda
        if (valorNumerico > 0 && item.alimento && item.alimento !== 'Novo alimento') {
          await recalcularValoresNutricionais(newDieta, mealIndex, itemIndex, valorNumerico, item.unidadeExibicao || 'g')
          const dietaRecalculada = recalcularTotais(newDieta)
          setEditedDieta(dietaRecalculada)
          return
        }
      }
    } else if (field === 'unidadeExibicao') {
      item.unidadeExibicao = value
      if (item.porcaoValor !== undefined) {
        item.porcao = `${item.porcaoValor} ${value}`
        
        // Recalcular valores nutricionais quando a unidade muda (se houver alimento)
        if (item.porcaoValor > 0 && item.alimento && item.alimento !== 'Novo alimento') {
          await recalcularValoresNutricionais(newDieta, mealIndex, itemIndex, item.porcaoValor, value)
          const dietaRecalculada = recalcularTotais(newDieta)
          setEditedDieta(dietaRecalculada)
          return
        }
      }
    }

    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
  }

  const recalcularValoresNutricionais = async (dieta, mealIndex, itemIndex, valorNumerico, unidade) => {
    const item = dieta.refeicoes[mealIndex].itens[itemIndex]
    
    // Buscar dados do alimento se não estiverem disponíveis
    let alimentoData = item._alimentoData
    
    if (!alimentoData || !alimentoData.id) {
      // Buscar alimento na lista
      const itemAlimentoLower = item.alimento.toLowerCase().trim()
      const itemAlimentoWords = itemAlimentoLower.split(/\s+/).filter(w => w.length > 0)
      
      const alimentoEncontrado = alimentos.find(a => {
        const descricaoLower = normalizeText(a.descricao)
        
        // Busca exata primeiro
        if (descricaoLower === normalizeText(itemAlimentoLower)) return true
        
        // Busca por contém
        if (descricaoLower.includes(normalizeText(itemAlimentoLower)) || 
            normalizeText(itemAlimentoLower).includes(descricaoLower)) return true
        
        // Busca por palavras
        if (itemAlimentoWords.length > 0) {
          const palavrasPrincipais = itemAlimentoWords.filter(w => w.length > 2)
          if (palavrasPrincipais.length > 0) {
            return palavrasPrincipais.every(palavra => descricaoLower.includes(normalizeText(palavra)))
          }
        }
        
        return false
      })
      
      if (alimentoEncontrado) {
        alimentoData = alimentoEncontrado
        item._alimentoData = alimentoEncontrado
      } else {
        console.warn('Alimento não encontrado para recalcular:', item.alimento)
        return
      }
    }
    
    if (!alimentoData || !alimentoData.id) {
      return
    }

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
          pesoGramas: valorNumerico
        })
      })

      const data = await response.json()
      if (response.ok && data.calculado) {
        item.kcal = data.calculado.energiaKcal
        item.macros = {
          proteina_g: data.calculado.proteina || 0,
          carbo_g: data.calculado.carboidrato || 0,
          gordura_g: data.calculado.lipideos || 0
        }
      } else {
        // Fallback: calcular localmente
        if (!alimentoData.energiaKcal || alimentoData.energiaKcal === 0) {
          console.warn('Alimento com valores nutricionais zerados:', alimentoData.descricao)
          return
        }
        
        const fator = valorNumerico / 100
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
      if (alimentoData && alimentoData.energiaKcal && alimentoData.energiaKcal > 0) {
        const fator = valorNumerico / 100
        item.kcal = Math.round((alimentoData.energiaKcal || 0) * fator * 10) / 10
        item.macros = {
          proteina_g: Math.round((alimentoData.proteina || 0) * fator * 10) / 10,
          carbo_g: Math.round((alimentoData.carboidrato || 0) * fator * 10) / 10,
          gordura_g: Math.round((alimentoData.lipideos || 0) * fator * 10) / 10
        }
      }
    }
  }

  const handleSelectAlimento = async (alimento, mealIndex, itemIndex) => {
    if (!editedDieta) return

    const newDieta = { ...editedDieta }
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    
    const valorNumerico = item.porcaoValor || 100
    const unidade = item.unidadeExibicao || 'g'

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
          pesoGramas: valorNumerico
        })
      })

      const data = await response.json()
      if (response.ok && data.calculado) {
        item.alimento = alimento.descricao
        item.porcaoValor = valorNumerico
        item.unidadeExibicao = unidade
        item.porcao = `${Math.round(valorNumerico)} ${unidade}`
        item.kcal = data.calculado.energiaKcal
        item._alimentoData = alimento
        if (data.calculado) {
          item.macros = {
            proteina_g: data.calculado.proteina || 0,
            carbo_g: data.calculado.carboidrato || 0,
            gordura_g: data.calculado.lipideos || 0
          }
        }
        
        const dietaRecalculada = recalcularTotais(newDieta)
        setEditedDieta(dietaRecalculada)
        setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
      } else {
        const fator = valorNumerico / 100
        item.alimento = alimento.descricao
        item.porcaoValor = valorNumerico
        item.unidadeExibicao = unidade
        item.porcao = `${Math.round(valorNumerico)} ${unidade}`
        item.kcal = Math.round((alimento.energiaKcal || 0) * fator * 10) / 10
        item._alimentoData = alimento
        item.macros = {
          proteina_g: Math.round((alimento.proteina || 0) * fator * 10) / 10,
          carbo_g: Math.round((alimento.carboidrato || 0) * fator * 10) / 10,
          gordura_g: Math.round((alimento.lipideos || 0) * fator * 10) / 10
        }
        
        const dietaRecalculada = recalcularTotais(newDieta)
        setEditedDieta(dietaRecalculada)
        setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
      }
    } catch (error) {
      console.error('Erro ao calcular valores do alimento:', error)
      const fator = valorNumerico / 100
      item.alimento = alimento.descricao
      item.porcaoValor = valorNumerico
      item.unidadeExibicao = unidade
      item.porcao = `${Math.round(valorNumerico)} ${unidade}`
      item.kcal = Math.round((alimento.energiaKcal || 0) * fator * 10) / 10
      item._alimentoData = alimento
      item.macros = {
        proteina_g: Math.round((alimento.proteina || 0) * fator * 10) / 10,
        carbo_g: Math.round((alimento.carboidrato || 0) * fator * 10) / 10,
        gordura_g: Math.round((alimento.lipideos || 0) * fator * 10) / 10
      }
      
      const dietaRecalculada = recalcularTotais(newDieta)
      setEditedDieta(dietaRecalculada)
      setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
    }
  }

  const removeItem = (mealIndex, itemIndex) => {
    if (!editedDieta) return
    const newDieta = { ...editedDieta }
    newDieta.refeicoes[mealIndex].itens.splice(itemIndex, 1)
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
  }

  const addItem = (mealIndex) => {
    if (!editedDieta) return
    const newDieta = { ...editedDieta }
    const newItem = {
      alimento: 'Novo alimento',
      porcao: '100 g',
      porcaoValor: 100,
      unidadeExibicao: 'g',
      kcal: 0,
      macros: { proteina_g: 0, carbo_g: 0, gordura_g: 0 }
    }
    newDieta.refeicoes[mealIndex].itens.push(newItem)
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
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

      navigate(`/nutricionista`)
    } catch (error) {
      console.error('Erro ao salvar dieta:', error)
      setError(error.message || 'Erro ao salvar dieta')
    } finally {
      setSaving(false)
    }
  }

  const handleFoodItemClick = (mealIndex, itemIndex, foodItem) => {
    setSelectedFoodItem(foodItem)
    setSelectedMealIndex(mealIndex)
    setSelectedItemIndex(itemIndex)
    setSwapModalOpen(true)
  }

  const handleSwapConfirm = async (mealIndex, itemIndex, newItem) => {
    if (!editedDieta) return
    const newDieta = { ...editedDieta }
    const item = newDieta.refeicoes[mealIndex].itens[itemIndex]
    item.alimento = newItem.alimento
    item.porcao = newItem.porcao || newItem.porcaoEquivalente || ''
    item.kcal = newItem.kcal || newItem.kcalAproximada || 0
    if (newItem.macros) {
      item.macros = newItem.macros
    }
    const dietaRecalculada = recalcularTotais(newDieta)
    setEditedDieta(dietaRecalculada)
    setSwapModalOpen(false)
  }

  const calcularComparativo = () => {
    if (!nutritionalNeeds || !editedDieta) return null

    const needs = {
      kcal: nutritionalNeeds.calorias || 0,
      proteina: nutritionalNeeds.macros?.proteina || 0,
      carbo: nutritionalNeeds.macros?.carboidrato || 0,
      gordura: nutritionalNeeds.macros?.gordura || 0
    }

    const atual = {
      kcal: editedDieta.totalDiaKcal || 0,
      proteina: editedDieta.macrosDia?.proteina_g || 0,
      carbo: editedDieta.macrosDia?.carbo_g || 0,
      gordura: editedDieta.macrosDia?.gordura_g || 0
    }

    const diferenca = {
      kcal: atual.kcal - needs.kcal,
      proteina: atual.proteina - needs.proteina,
      carbo: atual.carbo - needs.carbo,
      gordura: atual.gordura - needs.gordura
    }

    const percentual = {
      kcal: needs.kcal > 0 ? ((diferenca.kcal / needs.kcal) * 100) : 0,
      proteina: needs.proteina > 0 ? ((diferenca.proteina / needs.proteina) * 100) : 0,
      carbo: needs.carbo > 0 ? ((diferenca.carbo / needs.carbo) * 100) : 0,
      gordura: needs.gordura > 0 ? ((diferenca.gordura / needs.gordura) * 100) : 0
    }

    const isEquilibrado = {
      kcal: Math.abs(percentual.kcal) <= 5,
      proteina: Math.abs(percentual.proteina) <= 10,
      carbo: Math.abs(percentual.carbo) <= 10,
      gordura: Math.abs(percentual.gordura) <= 10
    }

    const statusGeral = isEquilibrado.kcal && isEquilibrado.proteina && 
                        isEquilibrado.carbo && isEquilibrado.gordura

    return {
      needs,
      atual,
      diferenca,
      percentual,
      isEquilibrado,
      statusGeral
    }
  }

  const handleSaveNeeds = async () => {
    if (!editedNeeds) return

    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/nutricionista/pacientes/${pacienteId}/necessidades`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nutritionalNeeds: editedNeeds
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar necessidades nutricionais')
      }

      setNutritionalNeeds({ ...editedNeeds })
      setShowEditNeeds(false)
      setError('')
    } catch (error) {
      console.error('Erro ao salvar necessidades:', error)
      setError(error.message || 'Erro ao salvar necessidades nutricionais')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`edit-diet-page ${theme}`}>
        <div className="edit-diet-loading">Carregando...</div>
      </div>
    )
  }

  if (!editedDieta) {
    return (
      <div className={`edit-diet-page ${theme}`}>
        <div className="edit-diet-empty">
          <p>Nenhuma dieta encontrada para este paciente.</p>
          <button onClick={() => navigate('/nutricionista')} className="btn-back">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // Função para calcular relevância do match
  const calculateRelevance = (alimento, query) => {
    const descricaoNormalized = normalizeText(alimento.descricao)
    const queryNormalized = normalizeText(query)
    const queryWords = queryNormalized.split(/\s+/).filter(w => w.length > 0)
    
    // Match exato no início = maior relevância
    if (descricaoNormalized.startsWith(queryNormalized)) {
      return 1000
    }
    
    // Match exato em qualquer lugar
    if (descricaoNormalized.includes(queryNormalized)) {
      return 500
    }
    
    // Contar quantas palavras da query estão na descrição
    let matches = 0
    queryWords.forEach(word => {
      if (descricaoNormalized.includes(word)) {
        matches++
      }
    })
    
    // Relevância baseada em quantas palavras correspondem
    return matches * 100
  }

  const filteredAlimentos = alimentos
    .filter(a => {
      if (!searchAlimento.query || searchAlimento.query.trim() === '') {
        return false
      }
      
      const descricaoNormalized = normalizeText(a.descricao)
      const queryNormalized = normalizeText(searchAlimento.query)
      const queryWords = queryNormalized.split(/\s+/).filter(w => w.length > 0)
      
      // Verifica se todas as palavras da query estão na descrição
      return queryWords.every(word => descricaoNormalized.includes(word))
    })
    .map(a => ({
      ...a,
      relevance: calculateRelevance(a, searchAlimento.query)
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20)

  return (
    <div className={`edit-diet-page ${theme}`}>
      <div className="edit-diet-container">
        <div className="edit-diet-header">
          <div className="edit-diet-header-left">
            <button onClick={() => navigate('/nutricionista')} className="btn-back-header">
              ← Voltar
            </button>
            <div>
              <h1>Editar Dieta do Paciente</h1>
              {paciente && (
                <p className="edit-diet-subtitle">
                  {paciente.name || paciente.email}
                </p>
              )}
            </div>
          </div>
          <div className="edit-diet-header-actions">
            <button onClick={handleSave} className="btn-save" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="edit-diet-content">
          <div className="nutrition-summary">
            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Total Calórico</div>
                <div className="macro-amount">{editedDieta.totalDiaKcal || 0} <span style={{ fontSize: '1rem', fontWeight: '500' }}>kcal</span></div>
              </div>
            </div>

            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Proteína</div>
                <div className="macro-amount">{editedDieta.macrosDia?.proteina_g || 0}g</div>
              </div>
            </div>

            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H5C4.46957 6 3.96086 6.21071 3.58579 6.58579C3.21071 6.96086 3 7.46957 3 8V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H19C19.5304 18 20.0391 17.7893 20.4142 17.4142C20.7893 17.0391 21 16.5304 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Carboidrato</div>
                <div className="macro-amount">{editedDieta.macrosDia?.carbo_g || 0}g</div>
              </div>
            </div>

            <div className="macro-item">
              <div className="macro-icon" style={{ backgroundColor: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="macro-info">
                <div className="macro-name">Gordura</div>
                <div className="macro-amount">{editedDieta.macrosDia?.gordura_g || 0}g</div>
              </div>
            </div>
          </div>

          {(() => {
            const comparativo = calcularComparativo()
            return comparativo && nutritionalNeeds && (
              <div className="comparative-section">
                <div className="comparative-header">
                  <h3>Comparativo com Necessidades do Paciente</h3>
                  <div className="comparative-actions">
                    <div className={`status-badge ${comparativo.statusGeral ? 'balanced' : 'unbalanced'}`}>
                      {comparativo.statusGeral ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Dieta Equilibrada
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Ajustes Necessários
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setShowEditNeeds(true)}
                      className="btn-edit-needs"
                    >
                      Editar Necessidades
                    </button>
                  </div>
                </div>
                
                <div className="comparative-grid">
                  <div className={`comparative-card ${comparativo.isEquilibrado.kcal ? 'balanced' : comparativo.diferenca.kcal > 0 ? 'over' : 'under'}`}>
                    <div className="comparative-card-header">
                      <div className="comparative-card-icon" style={{ backgroundColor: comparativo.isEquilibrado.kcal ? 'rgba(76, 175, 80, 0.1)' : comparativo.diferenca.kcal > 0 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={comparativo.isEquilibrado.kcal ? '#4CAF50' : comparativo.diferenca.kcal > 0 ? '#FF9800' : '#F44336'}/>
                        </svg>
                      </div>
                      <div className="comparative-card-title">
                        <h4>Calorias</h4>
                        <span className="comparative-card-unit">kcal</span>
                      </div>
                    </div>
                    <div className="comparative-card-body">
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Meta</div>
                        <div className="comparative-card-value primary">{Math.round(comparativo.needs.kcal)}</div>
                      </div>
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Atual</div>
                        <div className="comparative-card-value secondary">{Math.round(comparativo.atual.kcal)}</div>
                      </div>
                      <div className={`comparative-card-row diff ${comparativo.diferenca.kcal > 0 ? 'over' : comparativo.diferenca.kcal < 0 ? 'under' : 'exact'}`}>
                        <div className="comparative-card-label">Diferença</div>
                        <div className="comparative-card-value diff-value">
                          {comparativo.diferenca.kcal > 0 ? '+' : ''}{comparativo.diferenca.kcal.toFixed(1)} kcal
                          {comparativo.percentual.kcal !== 0 && (
                            <span className="diff-percent"> ({comparativo.percentual.kcal > 0 ? '+' : ''}{comparativo.percentual.kcal.toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`comparative-card-footer ${comparativo.isEquilibrado.kcal ? 'balanced' : 'unbalanced'}`}>
                      {comparativo.isEquilibrado.kcal ? (
                        <span>✓ Dentro da meta</span>
                      ) : (
                        <span>{comparativo.diferenca.kcal > 0 ? '⚠ Acima da meta' : '⚠ Abaixo da meta'}</span>
                      )}
                    </div>
                  </div>

                  <div className={`comparative-card ${comparativo.isEquilibrado.proteina ? 'balanced' : comparativo.diferenca.proteina > 0 ? 'over' : 'under'}`}>
                    <div className="comparative-card-header">
                      <div className="comparative-card-icon" style={{ backgroundColor: comparativo.isEquilibrado.proteina ? 'rgba(76, 175, 80, 0.1)' : comparativo.diferenca.proteina > 0 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={comparativo.isEquilibrado.proteina ? '#4CAF50' : comparativo.diferenca.proteina > 0 ? '#FF9800' : '#F44336'}/>
                        </svg>
                      </div>
                      <div className="comparative-card-title">
                        <h4>Proteína</h4>
                        <span className="comparative-card-unit">g</span>
                      </div>
                    </div>
                    <div className="comparative-card-body">
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Meta</div>
                        <div className="comparative-card-value primary">{comparativo.needs.proteina.toFixed(1)}</div>
                      </div>
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Atual</div>
                        <div className="comparative-card-value secondary">{comparativo.atual.proteina.toFixed(1)}</div>
                      </div>
                      <div className={`comparative-card-row diff ${comparativo.diferenca.proteina > 0 ? 'over' : comparativo.diferenca.proteina < 0 ? 'under' : 'exact'}`}>
                        <div className="comparative-card-label">Diferença</div>
                        <div className="comparative-card-value diff-value">
                          {comparativo.diferenca.proteina > 0 ? '+' : ''}{comparativo.diferenca.proteina.toFixed(1)} g
                          {comparativo.percentual.proteina !== 0 && (
                            <span className="diff-percent"> ({comparativo.percentual.proteina > 0 ? '+' : ''}{comparativo.percentual.proteina.toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`comparative-card-footer ${comparativo.isEquilibrado.proteina ? 'balanced' : 'unbalanced'}`}>
                      {comparativo.isEquilibrado.proteina ? (
                        <span>✓ Dentro da meta</span>
                      ) : (
                        <span>{comparativo.diferenca.proteina > 0 ? '⚠ Acima da meta' : '⚠ Abaixo da meta'}</span>
                      )}
                    </div>
                  </div>

                  <div className={`comparative-card ${comparativo.isEquilibrado.carbo ? 'balanced' : comparativo.diferenca.carbo > 0 ? 'over' : 'under'}`}>
                    <div className="comparative-card-header">
                      <div className="comparative-card-icon" style={{ backgroundColor: comparativo.isEquilibrado.carbo ? 'rgba(76, 175, 80, 0.1)' : comparativo.diferenca.carbo > 0 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={comparativo.isEquilibrado.carbo ? '#4CAF50' : comparativo.diferenca.carbo > 0 ? '#FF9800' : '#F44336'}/>
                        </svg>
                      </div>
                      <div className="comparative-card-title">
                        <h4>Carboidrato</h4>
                        <span className="comparative-card-unit">g</span>
                      </div>
                    </div>
                    <div className="comparative-card-body">
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Meta</div>
                        <div className="comparative-card-value primary">{comparativo.needs.carbo.toFixed(1)}</div>
                      </div>
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Atual</div>
                        <div className="comparative-card-value secondary">{comparativo.atual.carbo.toFixed(1)}</div>
                      </div>
                      <div className={`comparative-card-row diff ${comparativo.diferenca.carbo > 0 ? 'over' : comparativo.diferenca.carbo < 0 ? 'under' : 'exact'}`}>
                        <div className="comparative-card-label">Diferença</div>
                        <div className="comparative-card-value diff-value">
                          {comparativo.diferenca.carbo > 0 ? '+' : ''}{comparativo.diferenca.carbo.toFixed(1)} g
                          {comparativo.percentual.carbo !== 0 && (
                            <span className="diff-percent"> ({comparativo.percentual.carbo > 0 ? '+' : ''}{comparativo.percentual.carbo.toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`comparative-card-footer ${comparativo.isEquilibrado.carbo ? 'balanced' : 'unbalanced'}`}>
                      {comparativo.isEquilibrado.carbo ? (
                        <span>✓ Dentro da meta</span>
                      ) : (
                        <span>{comparativo.diferenca.carbo > 0 ? '⚠ Acima da meta' : '⚠ Abaixo da meta'}</span>
                      )}
                    </div>
                  </div>

                  <div className={`comparative-card ${comparativo.isEquilibrado.gordura ? 'balanced' : comparativo.diferenca.gordura > 0 ? 'over' : 'under'}`}>
                    <div className="comparative-card-header">
                      <div className="comparative-card-icon" style={{ backgroundColor: comparativo.isEquilibrado.gordura ? 'rgba(76, 175, 80, 0.1)' : comparativo.diferenca.gordura > 0 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={comparativo.isEquilibrado.gordura ? '#4CAF50' : comparativo.diferenca.gordura > 0 ? '#FF9800' : '#F44336'}/>
                        </svg>
                      </div>
                      <div className="comparative-card-title">
                        <h4>Gordura</h4>
                        <span className="comparative-card-unit">g</span>
                      </div>
                    </div>
                    <div className="comparative-card-body">
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Meta</div>
                        <div className="comparative-card-value primary">{comparativo.needs.gordura.toFixed(1)}</div>
                      </div>
                      <div className="comparative-card-row">
                        <div className="comparative-card-label">Atual</div>
                        <div className="comparative-card-value secondary">{comparativo.atual.gordura.toFixed(1)}</div>
                      </div>
                      <div className={`comparative-card-row diff ${comparativo.diferenca.gordura > 0 ? 'over' : comparativo.diferenca.gordura < 0 ? 'under' : 'exact'}`}>
                        <div className="comparative-card-label">Diferença</div>
                        <div className="comparative-card-value diff-value">
                          {comparativo.diferenca.gordura > 0 ? '+' : ''}{comparativo.diferenca.gordura.toFixed(1)} g
                          {comparativo.percentual.gordura !== 0 && (
                            <span className="diff-percent"> ({comparativo.percentual.gordura > 0 ? '+' : ''}{comparativo.percentual.gordura.toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`comparative-card-footer ${comparativo.isEquilibrado.gordura ? 'balanced' : 'unbalanced'}`}>
                      {comparativo.isEquilibrado.gordura ? (
                        <span>✓ Dentro da meta</span>
                      ) : (
                        <span>{comparativo.diferenca.gordura > 0 ? '⚠ Acima da meta' : '⚠ Abaixo da meta'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
                          </div>
                          <div className="porcao-input-wrapper" style={{ display: 'flex', gap: '0.25rem' }}>
                            <input
                              type="number"
                              value={item.porcaoValor !== undefined ? item.porcaoValor : ''}
                              onChange={(e) => {
                                const valor = parseFloat(e.target.value) || 0
                                updateItem(mealIndex, itemIndex, 'porcao', valor)
                              }}
                              className="food-input porcao"
                              placeholder="50"
                              step="0.1"
                              min="0"
                              style={{ flex: 1 }}
                            />
                            <select
                              value={item.unidadeExibicao || 'g'}
                              onChange={(e) => updateItem(mealIndex, itemIndex, 'unidadeExibicao', e.target.value)}
                              className="food-input unidade-select"
                              style={{ width: '60px', padding: '0.5rem 0.25rem' }}
                            >
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>
                          <div className="food-input kcal readonly">
                            {item.kcal || 0} kcal
                          </div>
                          <div className="food-item-actions">
                            {/* Botão de troca desativado temporariamente */}
                            {/* <button
                              onClick={() => handleFoodItemClick(mealIndex, itemIndex, item)}
                              className="swap-food-btn"
                              type="button"
                              title="Trocar alimento por IA"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 4V1M12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8M12 4C13.1046 4 14 4.89543 14 6C14 7.10457 13.1046 8 12 8M12 20V23M12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16M12 20C13.1046 20 14 19.1046 14 18C14 16.8954 13.1046 16 12 16M6 12H3M21 12H18M6 12C6 10.8954 6.89543 10 8 10M6 12C6 13.1046 6.89543 14 8 14M18 12C18 10.8954 17.1046 10 16 10M18 12C18 13.1046 17.1046 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Trocar por IA
                            </button> */}
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

      {/* Modal de troca de alimento - Desativado temporariamente */}
      {/* <FoodSwapModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        foodItem={selectedFoodItem}
        mealName={editedDieta?.refeicoes?.[selectedMealIndex]?.nome || ''}
        mealIndex={selectedMealIndex}
        itemIndex={selectedItemIndex}
        onConfirm={handleSwapConfirm}
        dieta={editedDieta}
      /> */}

      {searchAlimento.show && (
        <div 
          className="alimento-search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
            }
          }}
        >
          <div className="alimento-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alimento-search-modal-header">
              <h3>Buscar Alimento</h3>
              <button
                className="alimento-search-close-btn"
                onClick={() => setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })}
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="alimento-search-modal-body">
              <input
                type="text"
                value={searchAlimento.query}
                onChange={(e) => setSearchAlimento({ ...searchAlimento, query: e.target.value })}
                className="alimento-search-modal-input"
                placeholder="Digite o nome do alimento..."
                autoFocus
              />
              
              {filteredAlimentos.length > 0 ? (
                <div className="alimento-search-modal-list">
                  {filteredAlimentos.map((alim) => (
                    <div
                      key={alim.id}
                      className="alimento-search-modal-item"
                      onClick={() => {
                        handleSelectAlimento(alim, searchAlimento.mealIndex, searchAlimento.itemIndex)
                        setSearchAlimento({ mealIndex: null, itemIndex: null, query: '', show: false })
                      }}
                    >
                      <div className="alimento-search-modal-item-content">
                        <div className="alimento-search-modal-name">{alim.descricao}</div>
                        <div className="alimento-search-modal-info">
                          {alim.energiaKcal} kcal/100g • {alim.proteina}g prot • {alim.carboidrato}g carb
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alimento-search-empty">Nenhum alimento encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditNeeds && editedNeeds && (
        <div 
          className="alimento-search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditNeeds(false)
            }
          }}
        >
          <div className="alimento-search-modal needs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alimento-search-modal-header">
              <h3>Editar Necessidades Nutricionais</h3>
              <button
                className="alimento-search-close-btn"
                onClick={() => setShowEditNeeds(false)}
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="alimento-search-modal-body">
              <div className="needs-form">
                <div className="needs-field">
                  <label className="needs-label">
                    Calorias (kcal)
                  </label>
                  <input
                    type="number"
                    value={editedNeeds.calorias || 0}
                    onChange={(e) => setEditedNeeds({
                      ...editedNeeds,
                      calorias: parseFloat(e.target.value) || 0
                    })}
                    className="needs-input"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="needs-field">
                  <label className="needs-label">
                    Proteína (g)
                  </label>
                  <input
                    type="number"
                    value={editedNeeds.macros?.proteina || 0}
                    onChange={(e) => setEditedNeeds({
                      ...editedNeeds,
                      macros: {
                        ...editedNeeds.macros,
                        proteina: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="needs-input"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="needs-field">
                  <label className="needs-label">
                    Carboidrato (g)
                  </label>
                  <input
                    type="number"
                    value={editedNeeds.macros?.carboidrato || 0}
                    onChange={(e) => setEditedNeeds({
                      ...editedNeeds,
                      macros: {
                        ...editedNeeds.macros,
                        carboidrato: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="needs-input"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="needs-field">
                  <label className="needs-label">
                    Gordura (g)
                  </label>
                  <input
                    type="number"
                    value={editedNeeds.macros?.gordura || 0}
                    onChange={(e) => setEditedNeeds({
                      ...editedNeeds,
                      macros: {
                        ...editedNeeds.macros,
                        gordura: parseFloat(e.target.value) || 0
                      }
                    })}
                    className="needs-input"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="needs-actions">
                  <button
                    onClick={() => setShowEditNeeds(false)}
                    className="needs-btn needs-btn-cancel"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNeeds}
                    disabled={saving}
                    className="needs-btn needs-btn-save"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditPatientDietPage


