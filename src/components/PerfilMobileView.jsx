import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import ImageCropModal from './ImageCropModal'
import { Modal } from './ui'
import './PerfilMobileView.css'

function PerfilMobileView() {
  const [user, setUser] = useState(null)
  const [questionnaireData, setQuestionnaireData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const photoInputRef = useRef(null)
  const [pendingPhotoSrc, setPendingPhotoSrc] = useState('')
  const [showPhotoCrop, setShowPhotoCrop] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setProfileForm({
          name: userData.name || '',
          email: userData.email || ''
        })
      }

      // Carregar questionário
      const questionnaireResponse = await fetch(`${API_URL}/questionnaire/check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (questionnaireResponse.ok) {
        const data = await questionnaireResponse.json()
        if (data.hasCompleted && data.data) {
          setQuestionnaireData(data.data)
          if (data.data.alimentosDoDiaADia && typeof data.data.alimentosDoDiaADia === 'string') {
            try {
              data.data.alimentosDoDiaADia = JSON.parse(data.data.alimentosDoDiaADia)
            } catch {
              data.data.alimentosDoDiaADia = { carboidratos: [], proteinas: [], gorduras: [], frutas: [] }
            }
          }
        }
      }

      // Verificar se tem dieta
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (dietResponse.ok) {
        const dietData = await dietResponse.json()
        setHasDiet(!!dietData.dieta)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return '?'
    const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const openPhotoPicker = () => photoInputRef.current?.click()

  const saveProfilePhoto = async (profilePhoto) => {
    setSavingPhoto(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profilePhoto })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar foto de perfil')

      const updatedUser = { ...user, profilePhoto: data.user?.profilePhoto || profilePhoto }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (error) {
      console.error('Erro ao salvar foto de perfil:', error)
      alert(error.message || 'Erro ao salvar foto de perfil')
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: profileForm.name })
      })

      if (response.ok) {
        const data = await response.json()
        const updatedUser = { ...user, name: data.user?.name || profileForm.name }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setEditingProfile(false)
        alert('Perfil atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar perfil')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDietAndQuestionnaire = async () => {
    if (!confirm('Tem certeza que deseja resetar sua dieta e questionário? Esta ação não pode ser desfeita.')) {
      return
    }

    setResetting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('Dieta e questionário resetados com sucesso!')
        setQuestionnaireData(null)
        setHasDiet(false)
        window.location.href = '/paciente/dashboard'
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao resetar')
      }
    } catch (error) {
      console.error('Erro ao resetar:', error)
      alert('Erro ao resetar dieta e questionário')
    } finally {
      setResetting(false)
    }
  }

  const formatAlimentos = (alimentos) => {
    if (!alimentos || (Array.isArray(alimentos) && alimentos.length === 0)) {
      return 'Nenhum selecionado'
    }
    if (Array.isArray(alimentos)) {
      return alimentos.join(', ')
    }
    return 'Nenhum selecionado'
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="giba-perfil-page">
        <div className="giba-perfil-loading">
          <div className="giba-perfil-loading-spinner"></div>
          <p>Carregando seu perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="giba-perfil-page">
      {/* Hero */}
      <div className="giba-perfil-hero">
        <div className="giba-perfil-hero-badge">
          <span>👤</span>
          <span>GIBA</span>
        </div>
        <h1 className="giba-perfil-hero-title">Meu Perfil</h1>
        <p className="giba-perfil-hero-subtitle">Gerencie suas informações e preferências</p>
      </div>

      {/* Foto e Dados do Usuário */}
      <section className="giba-perfil-section">
        <div className="giba-perfil-user-card">
          <div className="giba-perfil-avatar-wrapper" onClick={openPhotoPicker}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user?.name || 'Foto'} className="giba-perfil-avatar-img" />
            ) : (
              <div className="giba-perfil-avatar-fallback">
                {getInitials(user?.name || user?.email)}
              </div>
            )}
            <div className="giba-perfil-avatar-overlay">
              <span>📷</span>
            </div>
            {savingPhoto && (
              <div className="giba-perfil-avatar-loading">
                <div className="giba-perfil-avatar-spinner"></div>
              </div>
            )}
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              if (!file.type.startsWith('image/')) {
                alert('Selecione uma imagem válida')
                return
              }
              if (file.size > 2 * 1024 * 1024) {
                alert('A imagem deve ter no máximo 2MB')
                return
              }
              const reader = new FileReader()
              reader.onloadend = () => {
                setPendingPhotoSrc(reader.result)
                setShowPhotoCrop(true)
              }
              reader.readAsDataURL(file)
            }}
          />

          <div className="giba-perfil-user-info">
            <h2 className="giba-perfil-user-name">{user?.name || 'Seu Nome'}</h2>
            <p className="giba-perfil-user-email">{user?.email}</p>
          </div>

          <button className="giba-perfil-edit-btn" onClick={() => setEditingProfile(true)}>
            Editar
          </button>
        </div>
      </section>

      {/* Estatísticas Rápidas */}
      <section className="giba-perfil-section">
        <div className="giba-perfil-section-header">
          <h3 className="giba-perfil-section-title">Seus Dados</h3>
        </div>

        {questionnaireData ? (
          <div className="giba-perfil-stats-grid">
            <div className="giba-perfil-stat-card">
              <span className="giba-perfil-stat-icon">📅</span>
              <div className="giba-perfil-stat-info">
                <span className="giba-perfil-stat-label">Idade</span>
                <span className="giba-perfil-stat-value">{questionnaireData.idade} anos</span>
              </div>
            </div>
            <div className="giba-perfil-stat-card">
              <span className="giba-perfil-stat-icon">📏</span>
              <div className="giba-perfil-stat-info">
                <span className="giba-perfil-stat-label">Altura</span>
                <span className="giba-perfil-stat-value">{questionnaireData.altura} cm</span>
              </div>
            </div>
            <div className="giba-perfil-stat-card">
              <span className="giba-perfil-stat-icon">⚖️</span>
              <div className="giba-perfil-stat-info">
                <span className="giba-perfil-stat-label">Peso</span>
                <span className="giba-perfil-stat-value">{questionnaireData.pesoAtual} kg</span>
              </div>
            </div>
            <div className="giba-perfil-stat-card">
              <span className="giba-perfil-stat-icon">🎯</span>
              <div className="giba-perfil-stat-info">
                <span className="giba-perfil-stat-label">Objetivo</span>
                <span className="giba-perfil-stat-value">{questionnaireData.objetivo}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="giba-perfil-empty-stats">
            <p>Complete o questionário para ver seus dados aqui.</p>
          </div>
        )}
      </section>

      {/* Questionário */}
      <section className="giba-perfil-section">
        <div className="giba-perfil-section-header">
          <h3 className="giba-perfil-section-title">Questionário de Saúde</h3>
          {questionnaireData && <span className="giba-perfil-badge-done">✓ Completo</span>}
        </div>

        {questionnaireData ? (
          <div className="giba-perfil-questionnaire-summary">
            <p>Você já preencheu seu questionário. Clique no botão abaixo para ver todas as suas respostas.</p>
            <button
              className="giba-perfil-action-btn giba-perfil-action-btn--primary"
              onClick={() => setShowQuestionnaireModal(true)}
            >
              Ver questionário completo
            </button>
          </div>
        ) : (
          <div className="giba-perfil-questionnaire-empty">
            <span className="giba-perfil-questionnaire-icon">📝</span>
            <p>Preencha o questionário para que possamos personalizar sua experiência.</p>
          </div>
        )}
      </section>

      {/* Ações Rápidas */}
      <section className="giba-perfil-section">
        <div className="giba-perfil-section-header">
          <h3 className="giba-perfil-section-title">Ações Rápidas</h3>
        </div>

        <div className="giba-perfil-actions-list">
          <button className="giba-perfil-action-item" onClick={() => navigate('/paciente/dieta')}>
            <span className="giba-perfil-action-icon">🥗</span>
            <div className="giba-perfil-action-text">
              <strong>Ver minha dieta</strong>
              <span>Acesse seu plano alimentar</span>
            </div>
            <span className="giba-perfil-action-arrow">→</span>
          </button>

          <button className="giba-perfil-action-item" onClick={() => navigate('/paciente/treino')}>
            <span className="giba-perfil-action-icon">💪</span>
            <div className="giba-perfil-action-text">
              <strong>Ver meu treino</strong>
              <span>Acesse seu plano de exercícios</span>
            </div>
            <span className="giba-perfil-action-arrow">→</span>
          </button>

          <button className="giba-perfil-action-item" onClick={() => navigate('/paciente/projetos')}>
            <span className="giba-perfil-action-icon">🏆</span>
            <div className="giba-perfil-action-text">
              <strong>Meus projetos</strong>
              <span>Participe de desafios em grupo</span>
            </div>
            <span className="giba-perfil-action-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Zona de Perigo */}
      <section className="giba-perfil-section giba-perfil-section--danger">
        <div className="giba-perfil-section-header">
          <h3 className="giba-perfil-section-title giba-perfil-section-title--danger">Zona de Reset</h3>
        </div>

        <div className="giba-perfil-danger-content">
          <p>Se você mudou de objetivo ou deseja recomeçar do zero, pode resetar todos os seus dados:</p>
          <ul className="giba-perfil-danger-list">
            <li>Sua dieta será apagada</li>
            <li>Seu questionário será resetado</li>
            <li>Seus check-ins serão perdidos</li>
          </ul>
          <p className="giba-perfil-danger-warning">
            ⚠️ Esta ação não pode ser desfeita!
          </p>
          <button
            className="giba-perfil-danger-btn"
            onClick={handleResetDietAndQuestionnaire}
            disabled={resetting || (!hasDiet && !questionnaireData)}
          >
            {resetting ? 'Resetando...' : 'Começar do zero'}
          </button>
        </div>
      </section>

      {/* Logout */}
      <section className="giba-perfil-section">
        <button className="giba-perfil-logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          Sair da conta
        </button>
      </section>

      {/* Modal de Edição */}
      <Modal
        isOpen={editingProfile}
        onClose={() => setEditingProfile(false)}
        title="Editar Perfil"
        subtitle="Atualize suas informações pessoais"
        footer={(
          <>
            <button className="giba-perfil-modal-btn giba-perfil-modal-btn--secondary" onClick={() => setEditingProfile(false)}>
              Cancelar
            </button>
            <button
              className="giba-perfil-modal-btn giba-perfil-modal-btn--primary"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        )}
      >
        <div className="giba-perfil-edit-form">
          <div className="giba-perfil-form-group">
            <label>Nome</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              placeholder="Seu nome completo"
            />
          </div>
          <div className="giba-perfil-form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="disabled"
            />
            <span className="giba-perfil-form-hint">O e-mail não pode ser alterado</span>
          </div>
        </div>
      </Modal>

      {/* Modal do Questionário */}
      <Modal
        isOpen={showQuestionnaireModal}
        onClose={() => setShowQuestionnaireModal(false)}
        title="Seu Questionário"
        subtitle="Todas as suas respostas"
        size="lg"
        className="giba-perfil-questionnaire-modal"
      >
        {questionnaireData && (
          <div className="giba-perfil-questionnaire-content">
            {/* Dados Básicos */}
            <div className="giba-perfil-q-block">
              <h4 className="giba-perfil-q-block-title">📋 Dados Básicos</h4>
              <div className="giba-perfil-q-grid">
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Idade</span>
                  <span className="giba-perfil-q-value">{questionnaireData.idade} anos</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Sexo</span>
                  <span className="giba-perfil-q-value">{questionnaireData.sexo || 'Não informado'}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Altura</span>
                  <span className="giba-perfil-q-value">{questionnaireData.altura} cm</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Peso</span>
                  <span className="giba-perfil-q-value">{questionnaireData.pesoAtual} kg</span>
                </div>
                <div className="giba-perfil-q-item giba-perfil-q-item--full">
                  <span className="giba-perfil-q-label">Objetivo</span>
                  <span className="giba-perfil-q-value">{questionnaireData.objetivo}</span>
                </div>
              </div>
            </div>

            {/* Rotina e Atividade */}
            <div className="giba-perfil-q-block">
              <h4 className="giba-perfil-q-block-title">🏃 Rotina e Atividade</h4>
              <div className="giba-perfil-q-grid">
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Rotina</span>
                  <span className="giba-perfil-q-value">{questionnaireData.rotinaDiaria}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Sono</span>
                  <span className="giba-perfil-q-value">{questionnaireData.sono}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Frequência</span>
                  <span className="giba-perfil-q-value">{questionnaireData.frequenciaAtividade}</span>
                </div>
                {questionnaireData.tipoAtividade && (
                  <div className="giba-perfil-q-item">
                    <span className="giba-perfil-q-label">Tipo</span>
                    <span className="giba-perfil-q-value">{questionnaireData.tipoAtividade}</span>
                  </div>
                )}
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Horário de Treino</span>
                  <span className="giba-perfil-q-value">{questionnaireData.horarioTreino}</span>
                </div>
              </div>
            </div>

            {/* Alimentação */}
            <div className="giba-perfil-q-block">
              <h4 className="giba-perfil-q-block-title">🍽️ Alimentação</h4>
              <div className="giba-perfil-q-grid">
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Refeições por dia</span>
                  <span className="giba-perfil-q-value">{questionnaireData.quantidadeRefeicoes}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Preferência</span>
                  <span className="giba-perfil-q-value">{questionnaireData.preferenciaRefeicoes}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Tempo de preparo</span>
                  <span className="giba-perfil-q-value">{questionnaireData.tempoPreparacao}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Variação</span>
                  <span className="giba-perfil-q-value">{questionnaireData.preferenciaVariacao}</span>
                </div>
              </div>
            </div>

            {/* Alimentos do Dia a Dia */}
            {questionnaireData.alimentosDoDiaADia && (
              <div className="giba-perfil-q-block">
                <h4 className="giba-perfil-q-block-title">🥗 Alimentos do Dia a Dia</h4>
                <div className="giba-perfil-q-alimentos">
                  {questionnaireData.alimentosDoDiaADia.carboidratos?.length > 0 && (
                    <div className="giba-perfil-q-alimento-cat">
                      <span className="giba-perfil-q-cat-label">Carboidratos:</span>
                      <span className="giba-perfil-q-cat-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.carboidratos)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.proteinas?.length > 0 && (
                    <div className="giba-perfil-q-alimento-cat">
                      <span className="giba-perfil-q-cat-label">Proteínas:</span>
                      <span className="giba-perfil-q-cat-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.proteinas)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.gorduras?.length > 0 && (
                    <div className="giba-perfil-q-alimento-cat">
                      <span className="giba-perfil-q-cat-label">Gorduras:</span>
                      <span className="giba-perfil-q-cat-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.gorduras)}</span>
                    </div>
                  )}
                  {questionnaireData.alimentosDoDiaADia.frutas?.length > 0 && (
                    <div className="giba-perfil-q-alimento-cat">
                      <span className="giba-perfil-q-cat-label">Frutas:</span>
                      <span className="giba-perfil-q-cat-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.frutas)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Restrições */}
            <div className="giba-perfil-q-block">
              <h4 className="giba-perfil-q-block-title">🚫 Restrições</h4>
              <div className="giba-perfil-q-grid">
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Restrição Alimentar</span>
                  <span className="giba-perfil-q-value">{questionnaireData.restricaoAlimentar}</span>
                </div>
                {questionnaireData.alimentosEvita && (
                  <div className="giba-perfil-q-item giba-perfil-q-item--full">
                    <span className="giba-perfil-q-label">Alimentos que Evita</span>
                    <span className="giba-perfil-q-value">{questionnaireData.alimentosEvita}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Saúde */}
            <div className="giba-perfil-q-block">
              <h4 className="giba-perfil-q-block-title">🏥 Saúde</h4>
              <div className="giba-perfil-q-grid">
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Problemas de saúde</span>
                  <span className="giba-perfil-q-value">{questionnaireData.problemasSaude}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Uso de medicação</span>
                  <span className="giba-perfil-q-value">{questionnaireData.usoMedicacao}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Limitações físicas</span>
                  <span className="giba-perfil-q-value">{questionnaireData.limitacoesFisicas}</span>
                </div>
                <div className="giba-perfil-q-item">
                  <span className="giba-perfil-q-label">Restrições médicas</span>
                  <span className="giba-perfil-q-value">{questionnaireData.restricoesMedicasExercicio}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={showPhotoCrop}
        onClose={() => {
          setShowPhotoCrop(false)
          setPendingPhotoSrc('')
        }}
        imageSrc={pendingPhotoSrc}
        title="Ajustar foto de perfil"
        subtitle="Centralize o rosto e ajuste o zoom."
        aspect={1}
        onConfirm={async (dataUrl) => {
          await saveProfilePhoto(dataUrl)
          setShowPhotoCrop(false)
          setPendingPhotoSrc('')
        }}
      />
    </div>
  )
}

export default PerfilMobileView
