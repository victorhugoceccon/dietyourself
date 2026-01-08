import { useState, useEffect, useRef, useMemo } from 'react'
import { API_URL } from '../config/api'
import './UserProfile.css'

// Mensagens motivacionais pré-definidas
const MOTIVATIONAL_MESSAGES = [
  "Você está no caminho certo! Continue firme! 💪",
  "Cada pequena escolha saudável faz uma grande diferença! 🌱",
  "Você é mais forte do que pensa! Mantenha o foco! ⭐",
  "Hoje é um novo dia para cuidar de você! ☀️",
  "Suas metas estão mais próximas a cada dia! 🎯",
  "Alimentação saudável é autocuidado! Você merece! ❤️",
  "Cada refeição é uma oportunidade de nutrir seu corpo! 🥗",
  "Você está transformando sua vida, um passo de cada vez! 🚀",
  "Consistência é mais importante que perfeição! ✨",
  "Você tem o poder de criar hábitos incríveis! 💎"
]

// Mapeamento de objetivos para descrições
const OBJETIVO_DESCRIPTIONS = {
  'Emagrecer': 'Seu plano alimentar está personalizado para criar um déficit calórico saudável, priorizando nutrientes essenciais enquanto você alcança seu peso ideal.',
  'Manter peso': 'Seu plano alimentar está equilibrado para manter seu peso atual, garantindo todos os nutrientes necessários para seu bem-estar e saúde.',
  'Ganhar massa muscular': 'Seu plano alimentar está otimizado para apoiar o ganho de massa muscular, com proteínas adequadas e calorias suficientes para o desenvolvimento.'
}

function UserProfile({ userId, userName, userEmail, onWeightUpdate, refreshTrigger }) {
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [motivationalMessage, setMotivationalMessage] = useState('')
  const [questionnaireData, setQuestionnaireData] = useState(null)
  const [lastCheckIn, setLastCheckIn] = useState(null)
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingData, setIsEditingData] = useState(false)
  const [editingFormData, setEditingFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadUserProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshTrigger])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Carregar perfil, questionário e check-ins em paralelo
      const [profileResponse, questionnaireResponse, checkInResponse, todayCheckInResponse] = await Promise.all([
        fetch(`${API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/questionnaire/check`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/checkin?limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${API_URL}/checkin/today`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfilePhoto(profileData.profilePhoto || null)
        
        // Se não tiver mensagem personalizada, usar uma mensagem aleatória do dia
        if (profileData.motivationalMessage) {
          setMotivationalMessage(profileData.motivationalMessage)
        } else {
          // Usar índice baseado no dia para ter consistência (mesma mensagem durante o dia)
          const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
          const messageIndex = dayOfYear % MOTIVATIONAL_MESSAGES.length
          setMotivationalMessage(MOTIVATIONAL_MESSAGES[messageIndex])
        }
      }

      // Carregar dados do questionário se existir
      if (questionnaireResponse.ok) {
        const questionnaireCheck = await questionnaireResponse.json()
        if (questionnaireCheck.hasCompleted && questionnaireCheck.data) {
          setQuestionnaireData(questionnaireCheck.data)
          setEditingFormData({
            idade: questionnaireCheck.data.idade || '',
            altura: questionnaireCheck.data.altura || '',
            pesoAtual: questionnaireCheck.data.pesoAtual || '',
            objetivo: questionnaireCheck.data.objetivo || ''
          })
        }
      }

      // Carregar último check-in
      if (checkInResponse.ok) {
        const checkInData = await checkInResponse.json()
        if (checkInData.checkIns && checkInData.checkIns.length > 0) {
          setLastCheckIn(checkInData.checkIns[0])
        }
      }

      // Carregar check-in de hoje
      if (todayCheckInResponse.ok) {
        const todayData = await todayCheckInResponse.json()
        if (todayData.checkIn) {
          setTodayCheckIn(todayData.checkIn)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      // Em caso de erro, usar mensagem padrão
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
      const messageIndex = dayOfYear % MOTIVATIONAL_MESSAGES.length
      setMotivationalMessage(MOTIVATIONAL_MESSAGES[messageIndex])
    } finally {
      setLoading(false)
    }
  }

  // Obter peso atual (priorizar check-in de hoje, senão último check-in, senão questionário)
  const currentWeight = useMemo(() => {
    try {
      if (todayCheckIn && todayCheckIn.pesoAtual) {
        return { weight: todayCheckIn.pesoAtual, source: 'today', date: todayCheckIn.checkInDate }
      }
      if (lastCheckIn && lastCheckIn.pesoAtual) {
        const checkInDate = new Date(lastCheckIn.checkInDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        checkInDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24))
        return { weight: lastCheckIn.pesoAtual, source: 'recent', date: lastCheckIn.checkInDate, daysAgo: daysDiff }
      }
      if (questionnaireData && questionnaireData.pesoAtual) {
        return { weight: questionnaireData.pesoAtual, source: 'questionnaire' }
      }
      return null
    } catch (error) {
      console.error('Erro ao calcular currentWeight:', error)
      return null
    }
  }, [todayCheckIn, lastCheckIn, questionnaireData])

  const handleEditData = () => {
    setIsEditingData(true)
  }

  const handleCancelDataEdit = () => {
    setIsEditingData(false)
    // Restaurar valores originais
    if (questionnaireData) {
      setEditingFormData({
        idade: questionnaireData.idade || '',
        altura: questionnaireData.altura || '',
        pesoAtual: questionnaireData.pesoAtual || '',
        objetivo: questionnaireData.objetivo || ''
      })
    } else {
      setEditingFormData({})
    }
  }

  const handleSaveData = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!questionnaireData) {
        throw new Error('Dados do questionário não encontrados')
      }
      const response = await fetch(`${API_URL}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...questionnaireData,
          idade: parseInt(editingFormData.idade || questionnaireData.idade || 0),
          altura: parseFloat(editingFormData.altura || questionnaireData.altura || 0),
          pesoAtual: parseFloat(editingFormData.pesoAtual || questionnaireData.pesoAtual || 0),
          objetivo: editingFormData.objetivo || questionnaireData.objetivo || ''
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar dados')
      }

      setIsEditingData(false)
      loadUserProfile()
      if (onWeightUpdate) {
        onWeightUpdate()
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      alert(error.message || 'Erro ao salvar dados. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateWeight = () => {
    // Abrir modal de check-in ou navegar para atualizar peso
    if (onWeightUpdate) {
      onWeightUpdate()
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB')
      return
    }

    // Ler arquivo como base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePhoto(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
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
          profilePhoto: profilePhoto || null,
          motivationalMessage: motivationalMessage ? motivationalMessage.trim() : null
        })
      })

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Resposta não é JSON:', text.substring(0, 200))
        throw new Error('O servidor retornou uma resposta inválida. Verifique se o servidor está rodando.')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao salvar perfil')
      }

      setIsEditing(false)
      // Atualizar localStorage se necessário
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      if (profilePhoto) {
        userData.profilePhoto = profilePhoto
      }
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert(error.message || 'Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    loadUserProfile()
    setIsEditing(false)
  }

  const getInitials = () => {
    if (userName) {
      const names = userName.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return userName.substring(0, 2).toUpperCase()
    }
    return userEmail?.substring(0, 2).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="user-profile-card">
        <div className="profile-loading">Carregando perfil...</div>
      </div>
    )
  }

  // Log para debug
  if (process.env.NODE_ENV === 'development') {
    console.log('UserProfile render:', {
      hasQuestionnaireData: !!questionnaireData,
      hasLastCheckIn: !!lastCheckIn,
      hasTodayCheckIn: !!todayCheckIn,
      currentWeight: currentWeight
    })
  }

  return (
    <div className="user-profile-card">
      <div className="profile-header">
        <h3 className="profile-title">Meu Perfil</h3>
        <div className="profile-header-actions">
          {!isEditing && (
            <button
              className="profile-edit-btn"
              onClick={() => setIsEditing(true)}
              aria-label="Editar perfil"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <button
            className="profile-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expandir perfil" : "Colapsar perfil"}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="profile-content">
          {/* Photo Section */}
          <div className="profile-photo-section">
          <div className="profile-photo-container">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Foto de perfil"
                className="profile-photo"
              />
            ) : (
              <div className="profile-photo-placeholder">
                {getInitials()}
              </div>
            )}
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="profile-photo-input"
                  id="profile-photo-input"
                />
                <label htmlFor="profile-photo-input" className="profile-photo-upload-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Alterar foto
                </label>
              </>
            )}
          </div>
          <div className="profile-name-section">
            <h4 className="profile-name">{userName || userEmail}</h4>
            <p className="profile-email">{userEmail}</p>
          </div>
        </div>

        {/* Questionnaire Info Section */}
        {questionnaireData && (
          <div className="profile-info-section">
            <div className="info-section-header">
              <h4 className="info-section-title">Meus Dados</h4>
              {!isEditingData && (
                <button
                  className="info-edit-btn"
                  onClick={handleEditData}
                  aria-label="Editar dados"
                  title="Editar dados pessoais"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            
            <div className="info-grid">
              {questionnaireData.idade && (
                <div className="info-item">
                  <span className="info-label">Idade</span>
                  {isEditingData ? (
                    <input
                      type="number"
                      className="info-input"
                      value={editingFormData.idade || ''}
                      onChange={(e) => setEditingFormData({ ...editingFormData, idade: e.target.value })}
                      min="1"
                      max="150"
                    />
                  ) : (
                    <span className="info-value">{questionnaireData.idade} anos</span>
                  )}
                </div>
              )}
              {questionnaireData.altura && (
                <div className="info-item">
                  <span className="info-label">Altura</span>
                  {isEditingData ? (
                    <input
                      type="number"
                      className="info-input"
                      value={editingFormData.altura || ''}
                      onChange={(e) => setEditingFormData({ ...editingFormData, altura: e.target.value })}
                      min="50"
                      max="300"
                      step="0.1"
                    />
                  ) : (
                    <span className="info-value">{questionnaireData.altura} cm</span>
                  )}
                </div>
              )}
              
              {/* Peso dinâmico com indicador */}
              <div className="info-item info-item-weight">
                <span className="info-label">Peso</span>
                {isEditingData ? (
                  <input
                    type="number"
                    className="info-input"
                    value={editingFormData.pesoAtual || ''}
                    onChange={(e) => setEditingFormData({ ...editingFormData, pesoAtual: e.target.value })}
                    min="1"
                    max="500"
                    step="0.1"
                  />
                ) : (
                  <div className="weight-container">
                    <span className={`info-value ${currentWeight?.source === 'today' ? 'weight-updated' : ''}`}>
                      {currentWeight?.weight || questionnaireData?.pesoAtual || '---'} kg
                    </span>
                    {currentWeight?.source === 'today' && (
                      <span className="weight-badge weight-badge-today" title="Peso atualizado hoje">
                        Hoje
                      </span>
                    )}
                    {currentWeight?.source === 'recent' && currentWeight?.daysAgo !== undefined && (
                      <span className="weight-badge" title={`Atualizado há ${currentWeight.daysAgo} ${currentWeight.daysAgo === 1 ? 'dia' : 'dias'}`}>
                        Há {currentWeight.daysAgo} {currentWeight.daysAgo === 1 ? 'dia' : 'dias'}
                      </span>
                    )}
                    {(!currentWeight || (currentWeight?.source === 'questionnaire')) && (
                      <button
                        className="weight-update-cta"
                        onClick={handleUpdateWeight}
                        title="Atualizar peso no check-in diário"
                      >
                        Atualizar
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {questionnaireData.objetivo && (
                <div className="info-item info-item-objective">
                  <span className="info-label">Objetivo</span>
                  {isEditingData ? (
                    <select
                      className="info-select"
                      value={editingFormData.objetivo || ''}
                      onChange={(e) => setEditingFormData({ ...editingFormData, objetivo: e.target.value })}
                    >
                      <option value="Emagrecer">Emagrecer</option>
                      <option value="Manter peso">Manter peso</option>
                      <option value="Ganhar massa muscular">Ganhar massa muscular</option>
                    </select>
                  ) : (
                    <span className="info-value info-objective">{questionnaireData.objetivo}</span>
                  )}
                </div>
              )}
            </div>

            {/* Microcopy contextual abaixo do objetivo */}
            {questionnaireData?.objetivo && !isEditingData && OBJETIVO_DESCRIPTIONS[questionnaireData.objetivo] && (
              <div className="objective-description">
                <p className="objective-description-text">
                  {OBJETIVO_DESCRIPTIONS[questionnaireData.objetivo]}
                </p>
              </div>
            )}

            {/* Botões de ação para edição de dados */}
            {isEditingData && (
              <div className="info-edit-actions">
                <button
                  onClick={handleCancelDataEdit}
                  className="info-cancel-btn"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveData}
                  className="info-save-btn"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Motivational Message Section */}
        <div className="profile-message-section">
          <div className="message-header">
            <span className="message-icon">💬</span>
            <span className="message-label">Mensagem do dia</span>
          </div>
          {isEditing ? (
            <div className="message-edit-container">
              <textarea
                value={motivationalMessage}
                onChange={(e) => setMotivationalMessage(e.target.value)}
                placeholder="Escreva uma mensagem motivacional personalizada ou deixe em branco para usar mensagens automáticas"
                className="message-textarea"
                rows="3"
                maxLength={200}
              />
              <div className="message-actions">
                <button
                  onClick={() => {
                    const randomMessage = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
                    setMotivationalMessage(randomMessage)
                  }}
                  className="message-random-btn"
                  type="button"
                >
                  Mensagem aleatória
                </button>
                <span className="message-counter">{motivationalMessage.length}/200</span>
              </div>
            </div>
          ) : (
            <div className="message-display">
              <p className="message-text">{motivationalMessage}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="profile-actions">
            <button
              onClick={handleCancel}
              className="profile-cancel-btn"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  )
}

export default UserProfile

