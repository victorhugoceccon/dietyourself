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

<<<<<<< HEAD
// Função para obter ícone baseado na categoria
const getCategoryIcon = (categoria) => {
  const icons = {
    'Peito': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    'Costas': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        <path d="M12 2v20"/>
      </svg>
    ),
    'Ombro': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    ),
    'Bíceps': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4"/>
      </svg>
    ),
    'Tríceps': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M6 6l6-4 6 4M6 18l6 4 6-4"/>
      </svg>
    ),
    'Pernas': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M8 8h8M8 12h8M8 16h8"/>
      </svg>
    ),
    'Glúteos': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 12h8M12 8v8"/>
      </svg>
    ),
    'Abdômen': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 9h6M9 15h6"/>
      </svg>
    ),
    'Cardio': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20M12 2l8 10-8 10-8-10 8-10z"/>
      </svg>
    ),
    'Outros': (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    )
  }
  return icons[categoria] || icons['Outros']
}

=======
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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
  const [toast, setToast] = useState(null)
  const [highlightedCard, setHighlightedCard] = useState(null)
  const [viewingVideo, setViewingVideo] = useState(null)
  const { theme } = useTheme()

  const handleViewVideo = (videoUrl) => {
    setViewingVideo(videoUrl)
  }

  useEffect(() => {
    loadExercicios()
  }, [])

  useEffect(() => {
    // Quando o modal abrir, garantir que apareça no topo
    if (showModal || viewingVideo) {
      // Forçar scroll da janela para o topo - múltiplas tentativas
      const scrollToTop = () => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        if (document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
        }
      }
      
      scrollToTop()
      setTimeout(scrollToTop, 0)
      setTimeout(scrollToTop, 10)
      setTimeout(scrollToTop, 50)
    }
  }, [showModal, viewingVideo])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const highlightCard = (id) => {
    setHighlightedCard(id)
    setTimeout(() => {
      setHighlightedCard(null)
    }, 2000)
  }

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
        const action = editingExercicio ? 'editado' : 'criado'
        showToast(`Exercício ${action} com sucesso!`, 'success')
        if (editingExercicio) {
          highlightCard(editingExercicio)
        }
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
        showToast('Exercício deletado com sucesso!', 'success')
        loadExercicios()
      } else {
        const data = await response.json()
        showToast(data.error || 'Erro ao deletar exercício', 'error')
      }
    } catch (error) {
      console.error('Erro ao deletar exercício:', error)
      showToast('Erro ao deletar exercício', 'error')
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
          Novo Exercício
        </button>
      </div>

      <div className="exercicios-filters">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
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
        {exercicios.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h3>Nenhum exercício cadastrado ainda</h3>
            <p>Comece criando seu primeiro exercício para organizar seus treinos.</p>
            <button
              className="btn-primary"
              onClick={() => handleOpenModal()}
            >
              Criar primeiro exercício
            </button>
          </div>
        ) : filteredExercicios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3>Nenhum exercício encontrado</h3>
            <p>Tente ajustar os filtros de busca ou criar um novo exercício.</p>
          </div>
        ) : (
          filteredExercicios.map(exercicio => (
            <div 
              key={exercicio.id} 
              className={`exercicio-card ${highlightedCard === exercicio.id ? 'card-highlighted' : ''}`}
            >
              <div className="exercicio-content">
                <div className="exercicio-header-card">
<<<<<<< HEAD
                  <div className="exercicio-title-with-icon">
                    {exercicio.categoria && (
                      <span className="exercicio-icon">
                        {getCategoryIcon(exercicio.categoria)}
                      </span>
                    )}
                  <h3>{exercicio.nome}</h3>
                  </div>
=======
                  <h3>{exercicio.nome}</h3>
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
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
                  {exercicio.videoUrl && (
                    <button
                      className="btn-view-video"
                      onClick={() => handleViewVideo(exercicio.videoUrl)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      Ver Vídeo
                    </button>
                  )}
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

      {/* Modal de Vídeo */}
      {viewingVideo && (
        <div className="modal-overlay video-modal-overlay" onClick={() => setViewingVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>Vídeo do Exercício</h3>
              <button className="modal-close" onClick={() => setViewingVideo(null)}>×</button>
            </div>
            <div className="video-modal-body">
              <video
                src={viewingVideo}
                controls
                autoPlay
                className="video-modal-player"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button 
            className="toast-close" 
            onClick={() => setToast(null)}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={handleCloseModal}
        >
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
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="file-input"
                />
                {newExercicio.videoUrl && (
                  <div className="video-preview">
                    <video 
                      src={newExercicio.videoUrl} 
                      controls 
                      className="video-preview-player"
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


