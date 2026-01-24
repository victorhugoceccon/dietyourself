import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { API_URL } from '../config/api'
import { 
  Barbell, 
  Heart, 
  Circle, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  MagnifyingGlass,
  Play,
  Pencil,
  Trash,
  X
} from '@phosphor-icons/react'
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

// Função para obter ícone baseado na categoria
const getCategoryIcon = (categoria) => {
  const iconProps = { size: 24, weight: "regular" }
  const icons = {
    'Peito': <Barbell {...iconProps} />,
    'Costas': <Barbell {...iconProps} />,
    'Ombro': <Circle {...iconProps} />,
    'Bíceps': <ArrowUp {...iconProps} />,
    'Tríceps': <ArrowDown {...iconProps} />,
    'Pernas': <Barbell {...iconProps} />,
    'Glúteos': <Circle {...iconProps} />,
    'Abdômen': <Circle {...iconProps} />,
    'Cardio': <Heart {...iconProps} weight="fill" />,
    'Outros': <Barbell {...iconProps} />
  }
  return icons[categoria] || icons['Outros']
}

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
  
  // Estados para exercícios da Ascend API
  const [ascendExercises, setAscendExercises] = useState([])
  const [loadingAscend, setLoadingAscend] = useState(false)
  const [showAscendModal, setShowAscendModal] = useState(false)
  const [viewingAscendExercise, setViewingAscendExercise] = useState(null)
  const [ascendFilters, setAscendFilters] = useState({
    muscle: '',
    equipment: '',
    difficulty: '',
    name: ''
  })
  const [muscleGroups, setMuscleGroups] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [userRole, setUserRole] = useState(null)
  
  const { theme } = useTheme()

  const handleViewVideo = (videoUrl) => {
    setViewingVideo(videoUrl)
  }

  useEffect(() => {
    // Carregar role do usuário
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUserRole(userData.role)
      } catch (e) {
        console.error('Erro ao parsear user:', e)
      }
    }
    
    loadExercicios()
    // Carregar exercícios da Ascend API automaticamente para personais
    loadAscendExercises()
    loadAscendFilters()
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

  // Carregar exercícios do banco local (já sincronizados da API)
  const loadAscendExercises = async () => {
    setLoadingAscend(true)
    try {
      const token = localStorage.getItem('token')
      
      // Buscar exercícios sincronizados da API do banco local
      const response = await fetch(`${API_URL}/exercicios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas exercícios da API e aplicar filtros
        let filtered = (data.exercicios || []).filter(ex => ex.source === 'ASCEND_API')
        
        // Aplicar filtros locais
        if (ascendFilters.name) {
          const nameLower = ascendFilters.name.toLowerCase()
          filtered = filtered.filter(ex => ex.nome.toLowerCase().includes(nameLower))
        }
        
        if (ascendFilters.muscle) {
          // Verificar se o exercício tem o músculo nos dados traduzidos
          filtered = filtered.filter(ex => {
            if (ex.ascendDataParsed) {
              const bodyParts = ex.ascendDataParsed.bodyParts_translated || []
              return bodyParts.some(bp => bp.toLowerCase().includes(ascendFilters.muscle.toLowerCase()))
            }
            return ex.categoria?.toLowerCase().includes(ascendFilters.muscle.toLowerCase())
          })
        }
        
        if (ascendFilters.equipment) {
          filtered = filtered.filter(ex => {
            if (ex.ascendDataParsed) {
              const equipments = ex.ascendDataParsed.equipments_translated || []
              return equipments.some(eq => eq.toLowerCase().includes(ascendFilters.equipment.toLowerCase()))
            }
            return ex.observacoes?.toLowerCase().includes(ascendFilters.equipment.toLowerCase())
          })
        }
        
        // Converter para formato esperado pelo componente
        const formatted = filtered.map(ex => ({
          id: ex.id,
          exerciseId: ex.ascendExerciseId || ex.id,
          name: ex.nome,
          description: ex.descricao,
          muscle_translated: ex.ascendDataParsed?.bodyParts_translated?.[0] || ex.categoria,
          bodyParts_translated: ex.ascendDataParsed?.bodyParts_translated || [],
          equipment_translated: ex.ascendDataParsed?.equipments_translated?.[0],
          equipments_translated: ex.ascendDataParsed?.equipments_translated || [],
          difficulty_translated: ex.ascendDataParsed?.difficulty_translated,
          targetMuscles_translated: ex.ascendDataParsed?.targetMuscles_translated || [],
          secondaryMuscles_translated: ex.ascendDataParsed?.secondaryMuscles_translated || [],
          instructions: ex.ascendDataParsed?.instructions || (ex.descricao ? ex.descricao.split('\n') : []),
          tips: ex.ascendDataParsed?.tips || [],
          gifUrl: ex.videoUrl || ex.ascendDataParsed?.gifUrl,
          video_url: ex.videoUrl || ex.ascendDataParsed?.gifUrl,
          image_url: ex.ascendDataParsed?.imageUrl || ex.videoUrl
        }))
        
        setAscendExercises(formatted)
      } else {
        console.warn('⚠️ Não foi possível carregar exercícios')
      }
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error)
    } finally {
      setLoadingAscend(false)
    }
  }
  
  // Sincronizar exercícios da API (apenas admin)
  const syncAscendExercises = async () => {
    if (!confirm('Isso irá sincronizar todos os exercícios da Ascend API. Pode levar alguns minutos. Continuar?')) {
      return
    }
    
    setLoadingAscend(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios/sync/ascend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        showToast(`Sincronização concluída! ${data.stats.imported} novos, ${data.stats.updated} atualizados.`, 'success')
        // Recarregar exercícios
        await loadExercicios()
        await loadAscendExercises()
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Erro ao sincronizar exercícios', 'error')
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      showToast('Erro ao sincronizar exercícios', 'error')
    } finally {
      setLoadingAscend(false)
    }
  }

  // Carregar filtros disponíveis
  const loadAscendFilters = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Carregar grupos musculares
      const musclesResponse = await fetch(`${API_URL}/exercicios/ascend/muscles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (musclesResponse.ok) {
        const musclesData = await musclesResponse.json()
        setMuscleGroups(musclesData.muscles || [])
      }
      
      // Carregar equipamentos
      const equipmentResponse = await fetch(`${API_URL}/exercicios/ascend/equipment`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        setEquipmentList(equipmentData.equipment || [])
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error)
    }
  }

  // Ver detalhes de um exercício da Ascend API
  const viewAscendExerciseDetails = async (exerciseId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios/ascend/${exerciseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setViewingAscendExercise(data.exercise)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      showToast('Erro ao buscar detalhes do exercício', 'error')
    }
  }

  // Importar exercício da Ascend API
  const importAscendExercise = async (exercise) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/exercicios/import/ascend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exerciseData: exercise })
      })
      
      if (response.ok) {
        showToast('Exercício importado com sucesso!', 'success')
        await loadExercicios() // Recarregar lista local
        setViewingAscendExercise(null)
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Erro ao importar exercício', 'error')
      }
    } catch (error) {
      console.error('Erro ao importar exercício:', error)
      showToast('Erro ao importar exercício', 'error')
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
        <div className="exercicios-header-actions">
          {userRole === 'ADMIN' && (
            <button
              className="btn-secondary"
              onClick={syncAscendExercises}
              disabled={loadingAscend}
            >
              <MagnifyingGlass size={16} weight="regular" />
              {loadingAscend ? 'Sincronizando...' : 'Sincronizar API'}
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => {
              setShowAscendModal(true)
              loadAscendExercises()
            }}
          >
            <MagnifyingGlass size={16} weight="regular" />
            Buscar Exercícios
          </button>
          <button
            className="btn-primary"
            onClick={() => handleOpenModal()}
          >
            Novo Exercício
          </button>
        </div>
      </div>

      <div className="exercicios-filters">
        <div className="search-input-container">
          <MagnifyingGlass size={20} weight="regular" className="search-icon" />
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
              <FileText size={80} weight="duotone" />
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
              <MagnifyingGlass size={60} weight="duotone" />
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
                  <div className="exercicio-title-with-icon">
                    {exercicio.categoria && (
                      <span className="exercicio-icon">
                        {getCategoryIcon(exercicio.categoria)}
                      </span>
                    )}
                    <h3>{exercicio.nome}</h3>
                  </div>
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
                      <Play size={16} weight="fill" />
                      Ver Vídeo
                    </button>
                  )}
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenModal(exercicio)}
                  >
                    <Pencil size={16} weight="regular" />
                    Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(exercicio.id)}
                  >
                    <Trash size={16} weight="regular" />
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
              <button className="modal-close" onClick={() => setViewingVideo(null)}>
                <X size={20} weight="bold" />
              </button>
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
            <X size={16} weight="bold" />
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
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} weight="bold" />
              </button>
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

      {/* Modal de Busca Ascend API */}
      {showAscendModal && (
        <div className="modal-overlay" onClick={() => setShowAscendModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Exercícios Sincronizados</h3>
              <button className="modal-close" onClick={() => setShowAscendModal(false)}>
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <div className="ascend-filters">
              <div className="form-group">
                <label>Nome do Exercício</label>
                <input
                  type="text"
                  value={ascendFilters.name}
                  onChange={(e) => setAscendFilters(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Bench Press"
                />
              </div>
              
              <div className="form-group">
                <label>Grupo Muscular</label>
                <select
                  value={ascendFilters.muscle}
                  onChange={(e) => setAscendFilters(prev => ({ ...prev, muscle: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {muscleGroups.map(mg => (
                    <option key={mg} value={mg}>{mg}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Equipamento</label>
                <select
                  value={ascendFilters.equipment}
                  onChange={(e) => setAscendFilters(prev => ({ ...prev, equipment: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {equipmentList.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
              
              <button
                className="btn-primary"
                onClick={loadAscendExercises}
                disabled={loadingAscend}
              >
                {loadingAscend ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            
            {loadingAscend ? (
              <div className="loading">Carregando exercícios...</div>
            ) : ascendExercises.length > 0 ? (
              <div className="ascend-results">
                <h4>Resultados ({ascendExercises.length})</h4>
                <div className="ascend-grid">
                  {ascendExercises.map(exercise => (
                    <div key={exercise.id || exercise.exerciseId} className="ascend-card">
                      {(exercise.gifUrl || exercise.video_url || exercise.image_url) && (
                        <img 
                          src={exercise.gifUrl || exercise.video_url || exercise.image_url}
                          alt={exercise.name}
                          className="ascend-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <h4>{exercise.name}</h4>
                      <div className="ascend-info">
                        {(exercise.bodyParts_translated && Array.isArray(exercise.bodyParts_translated) && exercise.bodyParts_translated.length > 0) ? (
                          <span><strong>Grupo Muscular:</strong> {exercise.bodyParts_translated.join(', ')}</span>
                        ) : exercise.muscle_translated ? (
                          <span><strong>Músculo:</strong> {exercise.muscle_translated}</span>
                        ) : null}
                        {(exercise.equipments_translated && Array.isArray(exercise.equipments_translated) && exercise.equipments_translated.length > 0) ? (
                          <span><strong>Equipamento:</strong> {exercise.equipments_translated.join(', ')}</span>
                        ) : exercise.equipment_translated ? (
                          <span><strong>Equipamento:</strong> {exercise.equipment_translated}</span>
                        ) : null}
                        {exercise.difficulty_translated && (
                          <span><strong>Dificuldade:</strong> {exercise.difficulty_translated}</span>
                        )}
                      </div>
                      <div className="ascend-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => viewAscendExerciseDetails(exercise.id || exercise.exerciseId)}
                        >
                          Ver Detalhes
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => importAscendExercise(exercise)}
                        >
                          Importar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Nenhum exercício encontrado. Tente ajustar os filtros.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Exercício Ascend */}
      {viewingAscendExercise && (
        <div className="modal-overlay" onClick={() => setViewingAscendExercise(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewingAscendExercise.name}</h3>
              <button className="modal-close" onClick={() => setViewingAscendExercise(null)}>
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <div className="ascend-details">
              {/* Exibir GIF como imagem animada (a API retorna GIF, não vídeo) */}
              {(viewingAscendExercise.gifUrl || viewingAscendExercise.video_url) && (
                <div className="ascend-video">
                  <img 
                    src={viewingAscendExercise.gifUrl || viewingAscendExercise.video_url}
                    alt={viewingAscendExercise.name}
                    className="ascend-video-player"
                    style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '12px' }}
                  />
                </div>
              )}
              
              {!viewingAscendExercise.gifUrl && !viewingAscendExercise.video_url && viewingAscendExercise.image_url && (
                <img 
                  src={viewingAscendExercise.image_url}
                  alt={viewingAscendExercise.name}
                  className="ascend-detail-image"
                />
              )}
              
              <div className="ascend-detail-info">
                <div className="detail-section">
                  <h4>Informações</h4>
                  {(viewingAscendExercise.bodyParts_translated && Array.isArray(viewingAscendExercise.bodyParts_translated) && viewingAscendExercise.bodyParts_translated.length > 0) ? (
                    <p><strong>Grupo Muscular:</strong> {viewingAscendExercise.bodyParts_translated.join(', ')}</p>
                  ) : viewingAscendExercise.muscle_translated ? (
                    <p><strong>Grupo Muscular:</strong> {viewingAscendExercise.muscle_translated}</p>
                  ) : null}
                  {(viewingAscendExercise.equipments_translated && Array.isArray(viewingAscendExercise.equipments_translated) && viewingAscendExercise.equipments_translated.length > 0) ? (
                    <p><strong>Equipamento:</strong> {viewingAscendExercise.equipments_translated.join(', ')}</p>
                  ) : viewingAscendExercise.equipment_translated ? (
                    <p><strong>Equipamento:</strong> {viewingAscendExercise.equipment_translated}</p>
                  ) : null}
                  {viewingAscendExercise.difficulty_translated && (
                    <p><strong>Dificuldade:</strong> {viewingAscendExercise.difficulty_translated}</p>
                  )}
                  {viewingAscendExercise.type_translated && (
                    <p><strong>Tipo:</strong> {viewingAscendExercise.type_translated}</p>
                  )}
                  {(viewingAscendExercise.targetMuscles_translated && Array.isArray(viewingAscendExercise.targetMuscles_translated) && viewingAscendExercise.targetMuscles_translated.length > 0) ? (
                    <p><strong>Músculos Alvo:</strong> {viewingAscendExercise.targetMuscles_translated.join(', ')}</p>
                  ) : (viewingAscendExercise.primary_muscles_translated && Array.isArray(viewingAscendExercise.primary_muscles_translated) && viewingAscendExercise.primary_muscles_translated.length > 0) ? (
                    <p><strong>Músculos Primários:</strong> {viewingAscendExercise.primary_muscles_translated.join(', ')}</p>
                  ) : null}
                  {(viewingAscendExercise.secondaryMuscles_translated && Array.isArray(viewingAscendExercise.secondaryMuscles_translated) && viewingAscendExercise.secondaryMuscles_translated.length > 0) ? (
                    <p><strong>Músculos Secundários:</strong> {viewingAscendExercise.secondaryMuscles_translated.join(', ')}</p>
                  ) : (viewingAscendExercise.secondary_muscles_translated && Array.isArray(viewingAscendExercise.secondary_muscles_translated) && viewingAscendExercise.secondary_muscles_translated.length > 0) ? (
                    <p><strong>Músculos Secundários:</strong> {viewingAscendExercise.secondary_muscles_translated.join(', ')}</p>
                  ) : null}
                </div>
                
                {viewingAscendExercise.description && (
                  <div className="detail-section">
                    <h4>Descrição</h4>
                    <p>{viewingAscendExercise.description}</p>
                  </div>
                )}
                
                {viewingAscendExercise.instructions && viewingAscendExercise.instructions.length > 0 && (
                  <div className="detail-section">
                    <h4>Instruções</h4>
                    <ol>
                      {viewingAscendExercise.instructions.map((inst, idx) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {viewingAscendExercise.tips && viewingAscendExercise.tips.length > 0 && (
                  <div className="detail-section">
                    <h4>Dicas</h4>
                    <ul>
                      {viewingAscendExercise.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setViewingAscendExercise(null)}
                >
                  Fechar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    importAscendExercise(viewingAscendExercise)
                  }}
                >
                  Importar Exercício
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciciosManager


