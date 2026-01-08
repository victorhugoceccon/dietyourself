import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { Modal, SectionHeader, EmptyState, StatCard } from './ui'
import './BodyMeasurementsTracker.css'

/**
 * BodyMeasurementsTracker - Histórico de medidas corporais.
 */
function BodyMeasurementsTracker({ pacienteId, readonly = false }) {
  const [measurements, setMeasurements] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMeasurements()
    loadStats()
  }, [pacienteId])

  const loadMeasurements = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = pacienteId 
        ? `${API_URL}/body-measurements/${pacienteId}`
        : `${API_URL}/body-measurements`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMeasurements(data.measurements || [])
      }
    } catch (error) {
      console.error('Erro ao carregar medidas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const targetId = pacienteId || 'self'
      const response = await fetch(`${API_URL}/body-measurements/${targetId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? parseFloat(value) : null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const url = pacienteId 
        ? `${API_URL}/body-measurements/${pacienteId}`
        : `${API_URL}/body-measurements`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadMeasurements()
        await loadStats()
        setShowAddModal(false)
        setFormData({})
      }
    } catch (error) {
      console.error('Erro ao salvar medida:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (measurementId) => {
    if (!confirm('Deseja excluir esta medida?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/body-measurements/${measurementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setMeasurements(prev => prev.filter(m => m.id !== measurementId))
        await loadStats()
      }
    } catch (error) {
      console.error('Erro ao deletar medida:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatVariation = (value) => {
    if (!value) return null
    const signal = value > 0 ? '+' : ''
    return `${signal}${value}`
  }

  if (loading) {
    return (
      <div className="measurements-loading">
        <div className="loading-spinner" />
        <p>Carregando medidas...</p>
      </div>
    )
  }

  return (
    <div className="body-measurements-tracker">
      <SectionHeader
        title="Medidas Corporais"
        subtitle={`${measurements.length} registros`}
        actions={
          !readonly && (
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nova Medida
            </button>
          )
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="measurements-stats lifefit-stats-grid">
          <StatCard
            label="Peso Atual"
            value={`${stats.pesoAtual || '-'} kg`}
            change={stats.pesoVariacao ? `${formatVariation(stats.pesoVariacao)} kg` : null}
            positive={stats.pesoVariacao < 0}
          />
          <StatCard
            label="% Gordura"
            value={`${stats.gorduraAtual || '-'}%`}
            change={stats.gorduraVariacao ? `${formatVariation(stats.gorduraVariacao)}%` : null}
            positive={stats.gorduraVariacao < 0}
          />
          <StatCard
            label="Cintura"
            value={`${stats.cinturaAtual || '-'} cm`}
            change={stats.cinturaVariacao ? `${formatVariation(stats.cinturaVariacao)} cm` : null}
            positive={stats.cinturaVariacao < 0}
          />
          <StatCard
            label="IMC"
            value={stats.imcAtual || '-'}
            change={stats.imcVariacao ? formatVariation(stats.imcVariacao) : null}
            positive={stats.imcVariacao < 0}
          />
        </div>
      )}

      {/* Lista de Medidas */}
      {measurements.length === 0 ? (
        <EmptyState
          title="Nenhuma medida registrada"
          description="Adicione medidas corporais para acompanhar a evolução."
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          }
          action={
            !readonly && (
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                Adicionar Primeira Medida
              </button>
            )
          }
        />
      ) : (
        <div className="measurements-timeline">
          {measurements.map((measurement, idx) => (
            <div key={measurement.id} className="measurement-card">
              <div className="measurement-date">
                <span className="date-day">{formatDate(measurement.dataRegistro)}</span>
                {idx === 0 && <span className="badge-recent">Mais recente</span>}
              </div>

              <div className="measurement-data">
                <div className="data-grid">
                  {measurement.peso && (
                    <div className="data-item">
                      <span className="label">Peso</span>
                      <span className="value">{measurement.peso} kg</span>
                    </div>
                  )}
                  {measurement.percentualGordura && (
                    <div className="data-item">
                      <span className="label">Gordura</span>
                      <span className="value">{measurement.percentualGordura}%</span>
                    </div>
                  )}
                  {measurement.imc && (
                    <div className="data-item">
                      <span className="label">IMC</span>
                      <span className="value">{measurement.imc}</span>
                    </div>
                  )}
                  {measurement.cintura && (
                    <div className="data-item">
                      <span className="label">Cintura</span>
                      <span className="value">{measurement.cintura} cm</span>
                    </div>
                  )}
                  {measurement.quadril && (
                    <div className="data-item">
                      <span className="label">Quadril</span>
                      <span className="value">{measurement.quadril} cm</span>
                    </div>
                  )}
                  {measurement.peitoral && (
                    <div className="data-item">
                      <span className="label">Peitoral</span>
                      <span className="value">{measurement.peitoral} cm</span>
                    </div>
                  )}
                </div>

                {measurement.notas && (
                  <p className="measurement-notes">{measurement.notas}</p>
                )}
              </div>

              {!readonly && (
                <button 
                  className="btn-delete-measurement"
                  onClick={() => handleDelete(measurement.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Adicionar Medida */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nova Medida"
        subtitle="Registre as medidas corporais"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Medida'}
            </button>
          </>
        }
      >
        <form className="measurement-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Composição Corporal</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="lifefit-input"
                  value={formData.peso || ''}
                  onChange={(e) => handleInputChange('peso', e.target.value)}
                  placeholder="Ex: 75.5"
                />
              </div>
              <div className="form-group">
                <label>% Gordura</label>
                <input
                  type="number"
                  step="0.1"
                  className="lifefit-input"
                  value={formData.percentualGordura || ''}
                  onChange={(e) => handleInputChange('percentualGordura', e.target.value)}
                  placeholder="Ex: 18.5"
                />
              </div>
              <div className="form-group">
                <label>Massa Magra (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="lifefit-input"
                  value={formData.massaMagra || ''}
                  onChange={(e) => handleInputChange('massaMagra', e.target.value)}
                  placeholder="Ex: 60.0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Circunferências (cm)</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Cintura</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.cintura || ''}
                  onChange={(e) => handleInputChange('cintura', e.target.value)}
                  placeholder="Ex: 80"
                />
              </div>
              <div className="form-group">
                <label>Quadril</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.quadril || ''}
                  onChange={(e) => handleInputChange('quadril', e.target.value)}
                  placeholder="Ex: 100"
                />
              </div>
              <div className="form-group">
                <label>Peitoral</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.peitoral || ''}
                  onChange={(e) => handleInputChange('peitoral', e.target.value)}
                  placeholder="Ex: 95"
                />
              </div>
              <div className="form-group">
                <label>Braço Direito</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.bracoDireito || ''}
                  onChange={(e) => handleInputChange('bracoDireito', e.target.value)}
                  placeholder="Ex: 32"
                />
              </div>
              <div className="form-group">
                <label>Braço Esquerdo</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.bracoEsquerdo || ''}
                  onChange={(e) => handleInputChange('bracoEsquerdo', e.target.value)}
                  placeholder="Ex: 32"
                />
              </div>
              <div className="form-group">
                <label>Coxa Direita</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.coxaDireita || ''}
                  onChange={(e) => handleInputChange('coxaDireita', e.target.value)}
                  placeholder="Ex: 55"
                />
              </div>
              <div className="form-group">
                <label>Coxa Esquerda</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.coxaEsquerda || ''}
                  onChange={(e) => handleInputChange('coxaEsquerda', e.target.value)}
                  placeholder="Ex: 55"
                />
              </div>
              <div className="form-group">
                <label>Panturrilha Dir.</label>
                <input
                  type="number"
                  step="0.5"
                  className="lifefit-input"
                  value={formData.panturrilhaDir || ''}
                  onChange={(e) => handleInputChange('panturrilhaDir', e.target.value)}
                  placeholder="Ex: 38"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Observações</h4>
            <textarea
              className="lifefit-textarea"
              rows="3"
              value={formData.notas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Anotações sobre esta avaliação..."
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default BodyMeasurementsTracker


