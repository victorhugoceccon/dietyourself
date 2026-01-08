import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { Modal, SectionHeader, EmptyState } from './ui'
import './RecipesLibrary.css'

/**
 * RecipesLibrary - Biblioteca de receitas com filtros e modo passo-a-passo.
 */
function RecipesLibrary() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    favorites: false,
    search: ''
  })

  const categories = ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Sobremesa']
  const difficulties = ['Fácil', 'Médio', 'Difícil']

  useEffect(() => {
    loadRecipes()
  }, [filters])

  const loadRecipes = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.difficulty) params.append('difficulty', filters.difficulty)
      if (filters.favorites) params.append('favorites', 'true')
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`${API_URL}/recipes?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async (recipeId, e) => {
    e.stopPropagation()
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/recipes/${recipeId}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(prev => prev.map(r => 
          r.id === recipeId ? { ...r, isFavorite: data.isFavorite } : r
        ))
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error)
    }
  }

  const openRecipe = (recipe) => {
    setSelectedRecipe(recipe)
    setCurrentStep(0)
    setShowRecipeModal(true)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil': return 'difficulty-easy'
      case 'médio': return 'difficulty-medium'
      case 'difícil': return 'difficulty-hard'
      default: return ''
    }
  }

  const formatTime = (minutes) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="recipes-loading">
        <div className="loading-spinner" />
        <p>Carregando receitas...</p>
      </div>
    )
  }

  return (
    <div className="recipes-library">
      <SectionHeader
        title="Biblioteca de Receitas"
        subtitle={`${recipes.length} receitas disponíveis`}
      />

      {/* Filtros */}
      <div className="recipes-filters">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar receitas..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${filters.favorites ? 'active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, favorites: !prev.favorites }))}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={filters.favorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Favoritos
          </button>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
            className="filter-select"
          >
            <option value="">Qualquer Dificuldade</option>
            {difficulties.map(dif => (
              <option key={dif} value={dif}>{dif}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Receitas */}
      {recipes.length === 0 ? (
        <EmptyState
          title="Nenhuma receita encontrada"
          description="Tente ajustar os filtros de busca."
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
            </svg>
          }
        />
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="recipe-card"
              onClick={() => openRecipe(recipe)}
            >
              {recipe.imageUrl ? (
                <div 
                  className="recipe-image"
                  style={{ backgroundImage: `url(${recipe.imageUrl})` }}
                />
              ) : (
                <div className="recipe-image recipe-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                  </svg>
                </div>
              )}

              <button 
                className={`favorite-btn ${recipe.isFavorite ? 'favorited' : ''}`}
                onClick={(e) => handleFavorite(recipe.id, e)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={recipe.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              <div className="recipe-content">
                <div className="recipe-meta">
                  <span className="recipe-category">{recipe.category}</span>
                  <span className={`recipe-difficulty ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>

                <h3 className="recipe-name">{recipe.name}</h3>
                
                {recipe.description && (
                  <p className="recipe-description">{recipe.description}</p>
                )}

                <div className="recipe-info">
                  {(recipe.prepTime || recipe.cookTime) && (
                    <span className="info-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {formatTime((recipe.prepTime || 0) + (recipe.cookTime || 0))}
                    </span>
                  )}
                  {recipe.kcal && (
                    <span className="info-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8 2 4 6 4 10c0 2.5 1 4.5 2.5 6l5.5 6 5.5-6c1.5-1.5 2.5-3.5 2.5-6 0-4-4-8-8-8z" />
                      </svg>
                      {recipe.kcal} kcal
                    </span>
                  )}
                  <span className="info-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {recipe.servings || 1} porção
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Receita com Modo Passo-a-Passo */}
      <Modal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={selectedRecipe?.name}
        subtitle={selectedRecipe?.category}
        size="lg"
      >
        {selectedRecipe && (
          <div className="recipe-detail">
            {/* Resumo Nutricional */}
            {selectedRecipe.kcal && (
              <div className="nutrition-summary">
                <div className="nutrition-item">
                  <span className="value">{selectedRecipe.kcal}</span>
                  <span className="label">kcal</span>
                </div>
                {selectedRecipe.proteina_g && (
                  <div className="nutrition-item">
                    <span className="value">{selectedRecipe.proteina_g}g</span>
                    <span className="label">Proteína</span>
                  </div>
                )}
                {selectedRecipe.carbo_g && (
                  <div className="nutrition-item">
                    <span className="value">{selectedRecipe.carbo_g}g</span>
                    <span className="label">Carbos</span>
                  </div>
                )}
                {selectedRecipe.gordura_g && (
                  <div className="nutrition-item">
                    <span className="value">{selectedRecipe.gordura_g}g</span>
                    <span className="label">Gordura</span>
                  </div>
                )}
              </div>
            )}

            {/* Ingredientes */}
            <div className="recipe-section">
              <h4>Ingredientes</h4>
              <ul className="ingredients-list">
                {selectedRecipe.ingredients?.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </div>

            {/* Modo de Preparo - Passo a Passo */}
            <div className="recipe-section">
              <h4>Modo de Preparo</h4>
              
              {/* Progress */}
              <div className="steps-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${((currentStep + 1) / (selectedRecipe.steps?.length || 1)) * 100}%` }}
                  />
                </div>
                <span className="progress-text">
                  Passo {currentStep + 1} de {selectedRecipe.steps?.length || 0}
                </span>
              </div>

              {/* Step atual */}
              <div className="current-step">
                <span className="step-number">{currentStep + 1}</span>
                <p className="step-text">{selectedRecipe.steps?.[currentStep]}</p>
              </div>

              {/* Navegação de steps */}
              <div className="steps-navigation">
                <button
                  className="step-btn btn-secondary"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Anterior
                </button>

                <button
                  className="step-btn btn-primary"
                  onClick={() => setCurrentStep(prev => Math.min((selectedRecipe.steps?.length || 1) - 1, prev + 1))}
                  disabled={currentStep >= (selectedRecipe.steps?.length || 1) - 1}
                >
                  Próximo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Lista de todos os passos (collapsed) */}
              <details className="all-steps">
                <summary>Ver todos os passos</summary>
                <ol className="steps-list">
                  {selectedRecipe.steps?.map((step, idx) => (
                    <li 
                      key={idx} 
                      className={idx === currentStep ? 'current' : idx < currentStep ? 'completed' : ''}
                      onClick={() => setCurrentStep(idx)}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </details>
            </div>

            {/* Dicas */}
            {selectedRecipe.tips && (
              <div className="recipe-section">
                <h4>💡 Dicas</h4>
                <p className="tips-text">{selectedRecipe.tips}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RecipesLibrary


