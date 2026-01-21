import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import PhotoMealCapture from './PhotoMealCapture'
import { ChartBar, Fire, Barbell, Bread, Camera, Drop } from '@phosphor-icons/react'
import './NutritionDashboard.css'

function NutritionDashboard({ refreshTrigger }) {
  const [nutritionData, setNutritionData] = useState(null)
  const [consumedData, setConsumedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)

  useEffect(() => {
    loadNutritionData()
    loadConsumedMeals()
  }, [refreshTrigger])
  
  const loadConsumedMeals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/consumed-meals/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConsumedData(data.totals || null)
      }
    } catch (error) {
      console.error('Erro ao carregar refeições consumidas:', error)
      setConsumedData(null)
    }
  }

  const loadNutritionData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dietResponse.ok) {
        const dietData = await dietResponse.json()
        
        if (dietData.dieta && dietData.nutritionalNeeds) {
          setNutritionData(dietData.nutritionalNeeds)
          localStorage.setItem('nutritionalNeeds', JSON.stringify(dietData.nutritionalNeeds))
          setLoading(false)
          return
        }
      }
      
      localStorage.removeItem('nutritionalNeeds')
      setNutritionData(null)
    } catch (error) {
      console.error('Erro ao carregar dados nutricionais:', error)
      localStorage.removeItem('nutritionalNeeds')
      setNutritionData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="nutrition-dashboard">
        <div className="loading">Carregando dados nutricionais...</div>
      </div>
    )
  }

  if (!nutritionData || !nutritionData.macros) {
    return (
      <div className="nutrition-dashboard">
        <div className="no-data">
          <div className="empty-icon">
            <ChartBar size={48} weight="duotone" />
          </div>
          <h3 className="empty-title">Nutrição</h3>
          <p>Gere sua dieta para ver suas necessidades nutricionais personalizadas</p>
        </div>
      </div>
    )
  }

  const consumedNutrition = consumedData || { 
    consumedKcal: 0, 
    consumedProtein: 0, 
    consumedCarbs: 0, 
    consumedFat: 0 
  }

  const totalCalories = nutritionData.calorias || 0
  const totalProtein = nutritionData.macros?.proteina || 0
  const totalCarbs = nutritionData.macros?.carboidrato || 0
  const totalFat = nutritionData.macros?.gordura || 0

  const consumedKcal = consumedNutrition.consumedKcal || 0
  const consumedProtein = consumedNutrition.consumedProtein || 0
  const consumedCarbs = consumedNutrition.consumedCarbs || 0
  const consumedFat = consumedNutrition.consumedFat || 0

  const caloriesPercentage = totalCalories > 0 ? Math.round((consumedKcal / totalCalories) * 100) : 0
  const proteinPercentage = totalProtein > 0 ? Math.round((consumedProtein / totalProtein) * 100) : 0
  const carbsPercentage = totalCarbs > 0 ? Math.round((consumedCarbs / totalCarbs) * 100) : 0
  const fatPercentage = totalFat > 0 ? Math.round((consumedFat / totalFat) * 100) : 0

  const getStatusMessage = (percentage) => {
    if (percentage >= 100) return { message: 'Meta atingida!', color: '#4A6B4D' }
    if (percentage >= 80) return { message: 'Dentro do planejado', color: '#4A6B4D' }
    if (percentage >= 50) return { message: 'Boa ingestão hoje', color: '#6B8B6D' }
    if (percentage > 0) return { message: 'Ajustes leves hoje', color: '#C99A5A' }
    return { message: 'Começando', color: '#9FAF7D' }
  }

  const getMacroConfig = (type) => {
    const configs = {
      calories: {
        icon: <Fire size={24} weight="fill" />,
        label: 'Calorias diárias',
        color: '#4A6B4D',
        bgColor: '#4A6B4D15',
        borderColor: '#4A6B4D40',
        unit: 'kcal'
      },
      protein: {
        icon: <Barbell size={24} weight="fill" />,
        label: 'Proteína diária',
        color: '#5B7A9B',
        bgColor: '#5B7A9B15',
        borderColor: '#5B7A9B40',
        unit: 'g'
      },
      carbs: {
        icon: <Bread size={24} weight="fill" />,
        label: 'Carboidratos diários',
        color: '#C99A5A',
        bgColor: '#C99A5A15',
        borderColor: '#C99A5A40',
        unit: 'g'
      },
      fat: {
        icon: <Drop size={24} weight="fill" />,
        label: 'Gorduras diárias',
        color: '#8B7A9B',
        bgColor: '#8B7A9B15',
        borderColor: '#8B7A9B40',
        unit: 'g'
      }
    }
    return configs[type]
  }

  const formatValue = (value, unit) => {
    if (unit === 'kcal') {
      return Math.round(value).toString()
    }
    return Math.round(value).toString()
  }

  const handlePhotoSuccess = () => {
    // Recarregar dados após adicionar refeição por foto
    loadNutritionData()
    loadConsumedMeals()
  }

  return (
    <div className="nutrition-dashboard">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <h2>Nutrição</h2>
          <p className="subtitle">Seu progresso de hoje</p>
        </div>
        <button
          className="photo-meal-add-btn"
          onClick={() => setShowPhotoCapture(true)}
          title="Adicionar refeição por foto"
          style={{
            display: 'flex',
            visibility: 'visible',
            opacity: 1,
            padding: '10px 16px',
            background: '#4A6B4D',
            color: 'white',
            border: '1px solid #4A6B4D',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          <Camera size={18} weight="regular" /> Adicionar por Foto
        </button>
      </div>

      {showPhotoCapture && (
        <PhotoMealCapture
          onClose={() => setShowPhotoCapture(false)}
          onSuccess={handlePhotoSuccess}
        />
      )}

      <div className="nutrition-cards-row">
        {/* Card de Calorias */}
        <div className="nutrition-card">
          <div className="card-icon-wrapper" style={{ backgroundColor: getMacroConfig('calories').bgColor, borderColor: getMacroConfig('calories').borderColor }}>
            {getMacroConfig('calories').icon}
          </div>
          <div className="card-content">
            <div className="card-value">{formatValue(consumedKcal, 'kcal')}</div>
            <div className="card-label">{getMacroConfig('calories').label}</div>
            <div className="card-progress-wrapper">
              <div className="card-progress-bar">
                <div 
                  className="card-progress-fill" 
                  style={{ 
                    width: `${Math.min(caloriesPercentage, 100)}%`,
                    backgroundColor: getMacroConfig('calories').color
                  }}
                ></div>
              </div>
              <div className="card-status" style={{ color: getStatusMessage(caloriesPercentage).color }}>
                {getStatusMessage(caloriesPercentage).message}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Proteína */}
        <div className="nutrition-card">
          <div className="card-icon-wrapper" style={{ backgroundColor: getMacroConfig('protein').bgColor, borderColor: getMacroConfig('protein').borderColor }}>
            {getMacroConfig('protein').icon}
          </div>
          <div className="card-content">
            <div className="card-value">{formatValue(consumedProtein, 'g')}</div>
            <div className="card-label">{getMacroConfig('protein').label}</div>
            <div className="card-progress-wrapper">
              <div className="card-progress-bar">
                <div 
                  className="card-progress-fill" 
                  style={{ 
                    width: `${Math.min(proteinPercentage, 100)}%`,
                    backgroundColor: getMacroConfig('protein').color
                  }}
                ></div>
              </div>
              <div className="card-status" style={{ color: getStatusMessage(proteinPercentage).color }}>
                {getStatusMessage(proteinPercentage).message}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Carboidratos */}
        <div className="nutrition-card">
          <div className="card-icon-wrapper" style={{ backgroundColor: getMacroConfig('carbs').bgColor, borderColor: getMacroConfig('carbs').borderColor }}>
            {getMacroConfig('carbs').icon}
          </div>
          <div className="card-content">
            <div className="card-value">{formatValue(consumedCarbs, 'g')}</div>
            <div className="card-label">{getMacroConfig('carbs').label}</div>
            <div className="card-progress-wrapper">
              <div className="card-progress-bar">
                <div 
                  className="card-progress-fill" 
                  style={{ 
                    width: `${Math.min(carbsPercentage, 100)}%`,
                    backgroundColor: getMacroConfig('carbs').color
                  }}
                ></div>
              </div>
              <div className="card-status" style={{ color: getStatusMessage(carbsPercentage).color }}>
                {getStatusMessage(carbsPercentage).message}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Gorduras */}
        <div className="nutrition-card">
          <div className="card-icon-wrapper" style={{ backgroundColor: getMacroConfig('fat').bgColor, borderColor: getMacroConfig('fat').borderColor }}>
            {getMacroConfig('fat').icon}
          </div>
          <div className="card-content">
            <div className="card-value">{formatValue(consumedFat, 'g')}</div>
            <div className="card-label">{getMacroConfig('fat').label}</div>
            <div className="card-progress-wrapper">
              <div className="card-progress-bar">
                <div 
                  className="card-progress-fill" 
                  style={{ 
                    width: `${Math.min(fatPercentage, 100)}%`,
                    backgroundColor: getMacroConfig('fat').color
                  }}
                ></div>
              </div>
              <div className="card-status" style={{ color: getStatusMessage(fatPercentage).color }}>
                {getStatusMessage(fatPercentage).message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NutritionDashboard
