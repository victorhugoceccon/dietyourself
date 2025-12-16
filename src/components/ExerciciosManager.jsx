import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { API_URL } from '../config/api'
import './ExerciciosManager.css'

const CATEGORIAS = [
  'Peito',
  'Costas',
  'Ombro',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Cardio',
  'Outros'
]

function ExerciciosManager() {
  const [exercicios, setExercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExercicio, setEditingExercicio] = useState(null)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [newExercicio, setNewExercicio] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    videoUrl: '',
    observacoes: ''
  })
  const [saving, setSaving] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    loadExercicios()
  }, [])

  const loadExercicios = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExercicios(data.exercicios || [])
      } else {
        setError('Erro ao carregar exercícios')
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error)
      setError('Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido')
      return
    }

    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('O vídeo deve ter no máximo 50MB')
      return
    }

    // Ler arquivo como base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setNewExercicio(prev => ({ ...prev, videoUrl: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleOpenModal = (exercicio = null) => {
    if (exercicio) {
      setEditingExercicio(exercicio.id)
      setNewExercicio({
        nome: exercicio.nome,
        descricao: exercicio.descricao || '',
        categoria: exercicio.categoria || '',
        videoUrl: exercicio.videoUrl || '',
        observacoes: exercicio.observacoes || ''
      })
    } else {
      setEditingExercicio(null)
      setNewExercicio({
        nome: '',
        descricao: '',
        categoria: '',
        videoUrl: '',
        observacoes: ''
      })
    }
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExercicio(null)
    setNewExercicio({
      nome: '',
      descricao: '',
      categoria: '',
      videoUrl: '',
      observacoes: ''
    })
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = editingExercicio
        ? `${API_URL}/exercicios/${editingExercicio}`
        : `${API_URL}/exercicios`
      
      const method = editingExercicio ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: newExercicio.nome,
          descricao: newExercicio.descricao || null,
          categoria: newExercicio.categoria || null,
          videoUrl: newExercicio.videoUrl || null,
          observacoes: newExercicio.observacoes || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        handleCloseModal()
        loadExercicios()
      } else {
        setError(data.error || 'Erro ao salvar exercício')
      }
    } catch (error) {
      console.error('Erro ao salvar exercício:', error)
      setError('Erro ao salvar exercício')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este exercício?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadExercicios()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao deletar exercício')
      }
    } catch (error) {
      console.error('Erro ao deletar exercício:', error)
      alert('Erro ao deletar exercício')
    }
  }

  const filteredExercicios = exercicios.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ex.descricao && ex.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategoria = !selectedCategoria || ex.categoria === selectedCategoria
    return matchesSearch && matchesCategoria
  })

  if (loading) {
    return (
      <div className="exercicios-manager">
        <div className="loading">Carregando exercícios...</div>
      </div>
    )
  }

  return (
    <div className="exercicios-manager">
      <div className="exercicios-header">
        <h2>Meus Exercícios</h2>
        <button
          className="btn-primary"
          onClick={() => handleOpenModal()}
        >
          + Novo Exercício
        </button>
      </div>

      <div className="exercicios-filters">
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategoria}
          onChange={(e) => setSelectedCategoria(e.target.value)}
          className="filter-select"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="exercicios-grid">
        {filteredExercicios.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum exercício encontrado.</p>
            <p>Comece criando seu primeiro exercício!</p>
          </div>
        ) : (
          filteredExercicios.map(exercicio => (
            <div key={exercicio.id} className="exercicio-card">
              {exercicio.videoUrl && (
                <div className="exercicio-video">
                  <video
                    src={exercicio.videoUrl}
                    controls
                    className="video-player"
                  />
                </div>
              )}
              <div className="exercicio-content">
                <div className="exercicio-header-card">
                  <h3>{exercicio.nome}</h3>
                  {exercicio.categoria && (
                    <span className="categoria-badge">{exercicio.categoria}</span>
                  )}
                </div>
                {exercicio.descricao && (
                  <p className="exercicio-descricao">{exercicio.descricao}</p>
                )}
                {exercicio.observacoes && (
                  <p className="exercicio-observacoes">
                    <strong>Observações:</strong> {exercicio.observacoes}
                  </p>
                )}
                <div className="exercicio-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenModal(exercicio)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(exercicio.id)}
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExercicio ? 'Editar Exercício' : 'Novo Exercício'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nome do Exercício *</label>
                <input
                  type="text"
                  value={newExercicio.nome}
                  onChange={(e) => setNewExercicio(prev => ({ ...prev, nome: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={newExercicio.categoria}
                  onChange={(e) => setNewExercicio(prev => ({ ...prev, categoria: e.target.value }))}
                >
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Descrição / Instruções</label>
                <textarea
                  value={newExercicio.descricao}
                  onChange={(e) => setNewExercicio(prev => ({ ...prev, descricao: e.target.value }))}
                  rows="4"
                  placeholder="Descreva como executar o exercício..."
                />
              </div>

              <div className="form-group">
                <label>Vídeo do Exercício</label>
                <div style={{ 
                  padding: '0.75rem',
                  border: '1px solid var(--border-color, #e0e0e0)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    style={{ 
                      width: '100%',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      fontSize: '0.9375rem'
                    }}
                  />
                </div>
                {newExercicio.videoUrl && (
                  <div className="video-preview" style={{ marginTop: '1rem' }}>
                    <video 
                      src={newExercicio.videoUrl} 
                      controls 
                      style={{ 
                        maxWidth: '100%', 
                        borderRadius: '8px',
                        backgroundColor: '#000',
                        display: 'block'
                      }} 
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={newExercicio.observacoes}
                  onChange={(e) => setNewExercicio(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows="3"
                  placeholder="Observações adicionais sobre o exercício..."
                />
              </div>

              {error && (
                <div className="alert alert-error">{error}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciciosManager


