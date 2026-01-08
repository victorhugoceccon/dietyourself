import { useRef, useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import ImageCropModal from './ImageCropModal'
import './PacientePerfil.css'

function PacientePerfil() {
  const [user, setUser] = useState(null)
  const [questionnaireData, setQuestionnaireData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [questionnaireForm, setQuestionnaireForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const photoInputRef = useRef(null)
  const [pendingPhotoSrc, setPendingPhotoSrc] = useState('')
  const [showPhotoCrop, setShowPhotoCrop] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)

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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (questionnaireResponse.ok) {
        const data = await questionnaireResponse.json()
        if (data.hasCompleted && data.data) {
          setQuestionnaireData(data.data)
          // Parse alimentosDoDiaADia se for string
          if (data.data.alimentosDoDiaADia && typeof data.data.alimentosDoDiaADia === 'string') {
            try {
              data.data.alimentosDoDiaADia = JSON.parse(data.data.alimentosDoDiaADia)
            } catch (e) {
              data.data.alimentosDoDiaADia = { carboidratos: [], proteinas: [], gorduras: [], frutas: [] }
            }
          }
        }
      }

      // Verificar se tem dieta
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
        body: JSON.stringify({
          name: profileForm.name
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar localStorage
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
    if (!confirm('Tem certeza que deseja resetar sua dieta e questionário? Esta ação não pode ser desfeita e você precisará preencher o questionário novamente.')) {
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
        alert('Dieta e questionário resetados com sucesso! Você será redirecionado para preencher o questionário novamente.')
        // Limpar dados locais
        setQuestionnaireData(null)
        setHasDiet(false)
        // Recarregar página para forçar preenchimento do questionário
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

  if (loading) {
    return (
      <div className="paciente-perfil">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="paciente-perfil">
      <div className="perfil-container">
        {/* Foto de perfil */}
        <section className="perfil-section perfil-photo-section">
          <div className="perfil-photo-row">
            <div className="perfil-photo-avatar" onClick={openPhotoPicker} role="button" tabIndex={0}>
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user?.name || user?.email || 'Foto de perfil'} />
              ) : (
                <div className="perfil-photo-fallback">{getInitials(user?.name || user?.email)}</div>
              )}
            </div>
            <div className="perfil-photo-text">
              <div className="perfil-photo-title">Foto de perfil</div>
              <div className="perfil-photo-subtitle">
                Toque para tirar/enviar uma foto. Você poderá recortar antes de salvar.
              </div>
              <button className="btn-secondary perfil-photo-btn" onClick={openPhotoPicker} disabled={savingPhoto}>
                {savingPhoto ? 'Salvando...' : 'Alterar foto'}
              </button>
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="perfil-photo-file"
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
        </section>

        {/* Seção de Informações Básicas */}
        <section className="perfil-section">
          <div className="section-header">
            <h2>Informações Básicas</h2>
            <button
              className="edit-btn"
              onClick={() => setEditingProfile(!editingProfile)}
            >
              {editingProfile ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editingProfile ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="disabled-input"
                />
                <small>O email não pode ser alterado</small>
              </div>
              <div className="form-actions">
                <button
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                  {!saving && (
                    <span className="cta-hero__arrow">
                      <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                        <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                        <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <div className="info-item">
                <span className="info-label">Nome:</span>
                <span className="info-value">{user?.name || 'Não informado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>
          )}
        </section>

        {/* Seção de Questionário */}
        <section className="perfil-section">
          <div className="section-header">
            <h2>Questionário de Perfil</h2>
            {questionnaireData && (
              <span className="status-badge completed">Completo</span>
            )}
          </div>

          {questionnaireData ? (
            <div className="questionnaire-summary">
              <p className="summary-text">
                Seu questionário foi preenchido com sucesso. Clique no botão abaixo para visualizar todas as suas respostas.
              </p>
              <button
                className="view-questionnaire-btn"
                onClick={() => setShowQuestionnaireModal(true)}
              >
                <span>Ver Questionário Completo</span>
                <span className="cta-hero__arrow">
                  <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                    <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                    <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  </svg>
                </span>
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhum questionário preenchido ainda.</p>
              <p className="hint">Preencha o questionário para começar a usar o sistema.</p>
            </div>
          )}
        </section>

        {/* Modal do Questionário */}
        {showQuestionnaireModal && questionnaireData && (
          <div className="questionnaire-modal-overlay" onClick={() => setShowQuestionnaireModal(false)}>
            <div className="questionnaire-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="questionnaire-modal-header">
                <h2>Seu Questionário</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowQuestionnaireModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="questionnaire-modal-body">
                {/* Bloco 1: Dados Básicos */}
                <div className="questionnaire-block">
                  <h3 className="block-title">📋 Dados Básicos</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Idade:</span>
                      <span className="question-value">{questionnaireData.idade} anos</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Sexo:</span>
                      <span className="question-value">{questionnaireData.sexo}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Altura:</span>
                      <span className="question-value">{questionnaireData.altura} cm</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Peso Atual:</span>
                      <span className="question-value">{questionnaireData.pesoAtual} kg</span>
                    </div>
                    <div className="questionnaire-item full-width">
                      <span className="question-label">Objetivo:</span>
                      <span className="question-value">{questionnaireData.objetivo}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Rotina e Atividade */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🏃 Rotina e Atividade</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Frequência de Atividade:</span>
                      <span className="question-value">{questionnaireData.frequenciaAtividade}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Tipo de Atividade:</span>
                      <span className="question-value">{questionnaireData.tipoAtividade}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Horário de Treino:</span>
                      <span className="question-value">{questionnaireData.horarioTreino}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Rotina Diária:</span>
                      <span className="question-value">{questionnaireData.rotinaDiaria}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Estrutura da Dieta */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🍽️ Estrutura da Dieta</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Quantidade de Refeições:</span>
                      <span className="question-value">{questionnaireData.quantidadeRefeicoes}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Preferência de Refeições:</span>
                      <span className="question-value">{questionnaireData.preferenciaRefeicoes}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 4: Complexidade e Adesão */}
                <div className="questionnaire-block">
                  <h3 className="block-title">⚖️ Complexidade e Adesão</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Conforto em Pesar:</span>
                      <span className="question-value">{questionnaireData.confortoPesar}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Tempo de Preparação:</span>
                      <span className="question-value">{questionnaireData.tempoPreparacao}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Preferência de Variação:</span>
                      <span className="question-value">{questionnaireData.preferenciaVariacao}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 5: Alimentos do Dia a Dia */}
                {questionnaireData.alimentosDoDiaADia && (
                  <div className="questionnaire-block">
                    <h3 className="block-title">🥗 Alimentos do Dia a Dia</h3>
                    <div className="alimentos-categories">
                      {questionnaireData.alimentosDoDiaADia.carboidratos?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Carboidratos:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.carboidratos)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.proteinas?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Proteínas:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.proteinas)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.gorduras?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Gorduras:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.gorduras)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.frutas?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Frutas:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.frutas)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bloco 6: Restrições */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🚫 Restrições</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Restrição Alimentar:</span>
                      <span className="question-value">{questionnaireData.restricaoAlimentar}</span>
                    </div>
                    {questionnaireData.restricaoAlimentar === 'Outra' && questionnaireData.outraRestricao && (
                      <div className="questionnaire-item">
                        <span className="question-label">Especifique:</span>
                        <span className="question-value">{questionnaireData.outraRestricao}</span>
                      </div>
                    )}
                    {questionnaireData.alimentosEvita && (
                      <div className="questionnaire-item full-width">
                        <span className="question-label">Alimentos que Evita:</span>
                        <span className="question-value">{questionnaireData.alimentosEvita}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco 7: Flexibilidade */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🔄 Flexibilidade</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Opções de Substituição:</span>
                      <span className="question-value">{questionnaireData.opcoesSubstituicao}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Refeições Livres:</span>
                      <span className="question-value">{questionnaireData.refeicoesLivres}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Reset */}
        <section className="perfil-section danger-section">
          <div className="section-header">
            <h2>Começar do zero</h2>
          </div>
          <div className="reset-content">
            <p className="reset-description">
              Se você mudou de objetivo ou deseja recomeçar, você pode resetar sua dieta e questionário.
              Esta ação irá:
            </p>
            <ul className="reset-list">
              <li>Limpar sua dieta atual</li>
              <li>Limpar seu questionário</li>
              <li>Limpar todos os check-ins e histórico</li>
            </ul>
            <p className="reset-warning">
              Esta ação não pode ser desfeita. Você precisará preencher o questionário novamente.
            </p>
            <button
              className="reset-btn"
              onClick={handleResetDietAndQuestionnaire}
              disabled={resetting || (!hasDiet && !questionnaireData)}
            >
              {resetting ? 'Resetando...' : 'Começar do zero'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PacientePerfil





