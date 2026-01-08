import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { Modal, EmptyState, SectionHeader } from './ui'
import './DietTemplatesManager.css'

/**
 * DietTemplatesManager - Gerenciador de templates de dieta.
 */
function DietTemplatesManager({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [filter, setFilter] = useState('all') // all, mine, public

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId) => {
    if (!confirm('Deseja realmente excluir este template?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/diet-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error)
    }
  }

  const handlePreview = (template) => {
    setSelectedTemplate(template)
    setShowPreview(true)
  }

  const handleSelect = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
    }
    setShowPreview(false)
  }

  const getObjetivoColor = (objetivo) => {
    switch (objetivo?.toLowerCase()) {
      case 'emagrecer': return 'objetivo-emagrecer'
      case 'manter': return 'objetivo-manter'
      case 'ganhar massa muscular': return 'objetivo-massa'
      case 'ganhar peso': return 'objetivo-peso'
      default: return 'objetivo-default'
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (filter === 'mine') return !t.isPublic
    if (filter === 'public') return t.isPublic
    return true
  })

  if (loading) {
    return (
      <div className="templates-loading">
        <div className="loading-spinner" />
        <p>Carregando templates...</p>
      </div>
    )
  }

  return (
    <div className="diet-templates-manager">
      <SectionHeader 
        title="Templates de Dieta"
        subtitle={`${templates.length} templates disponíveis`}
        actions={
          <div className="templates-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              Meus
            </button>
            <button 
              className={`filter-btn ${filter === 'public' ? 'active' : ''}`}
              onClick={() => setFilter('public')}
            >
              Públicos
            </button>
          </div>
        }
      />

      {filteredTemplates.length === 0 ? (
        <EmptyState
          title="Nenhum template encontrado"
          description="Crie templates a partir de dietas existentes para reutilizá-los."
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          }
        />
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3 className="template-name">{template.name}</h3>
                {template.isPublic && (
                  <span className="public-badge">Público</span>
                )}
              </div>

              {template.description && (
                <p className="template-description">{template.description}</p>
              )}

              <div className="template-meta">
                {template.objetivo && (
                  <span className={`objetivo-badge ${getObjetivoColor(template.objetivo)}`}>
                    {template.objetivo}
                  </span>
                )}
                {template.kcalRange && (
                  <span className="kcal-badge">
                    {template.kcalRange} kcal
                  </span>
                )}
              </div>

              <div className="template-stats">
                <span className="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                  </svg>
                  {template.templateData?.refeicoes?.length || 0} refeições
                </span>
                <span className="stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {template.usageCount || 0}x usado
                </span>
              </div>

              <div className="template-actions">
                <button 
                  className="btn-preview"
                  onClick={() => handlePreview(template)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Ver
                </button>
                
                {onSelectTemplate && (
                  <button 
                    className="btn-apply btn-primary"
                    onClick={() => handleSelect(template)}
                  >
                    Usar Template
                  </button>
                )}
                
                {!template.isPublic && (
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(template.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Preview */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={selectedTemplate?.name || 'Template'}
        subtitle="Pré-visualização do template"
        size="lg"
        footer={
          <>
            <button 
              className="btn-secondary"
              onClick={() => setShowPreview(false)}
            >
              Fechar
            </button>
            {onSelectTemplate && (
              <button 
                className="btn-primary"
                onClick={() => handleSelect(selectedTemplate)}
              >
                Usar Template
              </button>
            )}
          </>
        }
      >
        {selectedTemplate?.templateData && (
          <div className="template-preview">
            <div className="preview-summary">
              <div className="summary-item">
                <span className="label">Meta Calórica</span>
                <span className="value">{selectedTemplate.templateData.totalDiaKcal || 0} kcal</span>
              </div>
              {selectedTemplate.templateData.macrosDia && (
                <>
                  <div className="summary-item">
                    <span className="label">Proteínas</span>
                    <span className="value">{selectedTemplate.templateData.macrosDia.proteina_g || 0}g</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Carboidratos</span>
                    <span className="value">{selectedTemplate.templateData.macrosDia.carbo_g || 0}g</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Gorduras</span>
                    <span className="value">{selectedTemplate.templateData.macrosDia.gordura_g || 0}g</span>
                  </div>
                </>
              )}
            </div>

            <div className="preview-meals">
              <h4>Refeições</h4>
              {selectedTemplate.templateData.refeicoes?.map((refeicao, idx) => (
                <div key={idx} className="preview-meal">
                  <div className="meal-header">
                    <span className="meal-name">{refeicao.nome}</span>
                    <span className="meal-kcal">{refeicao.totalRefeicaoKcal || 0} kcal</span>
                  </div>
                  <ul className="meal-items">
                    {refeicao.itens?.map((item, i) => (
                      <li key={i}>
                        <span className="item-name">{item.alimento}</span>
                        <span className="item-portion">{item.porcao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DietTemplatesManager


