import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { API_URL } from '../config/api'
import './CheckInDetailModal.css'

const REACTION_EMOJIS = ['🔥', '💪', '👏', '🎯', '⚡', '❤️']

function CheckInDetailModal({ checkIn, grupoId, onClose, currentUserId }) {
  const [reactions, setReactions] = useState({})
  const [comments, setComments] = useState([])
  const [loadingReactions, setLoadingReactions] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  useEffect(() => {
    if (checkIn && checkIn.type !== 'dieta') {
      loadReactions()
      loadComments()
    }
  }, [checkIn?.id])

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (checkIn) {
      // #region agent log
      const pacienteHeader = document.querySelector('.paciente-header')
      const modalOverlay = document.querySelector('.checkin-detail-modal-overlay')
      const modal = document.querySelector('.checkin-detail-modal')
      const modalHeader = document.querySelector('.checkin-detail-header')
      
      if (pacienteHeader && modalOverlay && modal && modalHeader) {
        const pacienteHeaderStyle = window.getComputedStyle(pacienteHeader)
        const overlayStyle = window.getComputedStyle(modalOverlay)
        const modalStyle = window.getComputedStyle(modal)
        const headerStyle = window.getComputedStyle(modalHeader)
        
        const pacienteHeaderRect = pacienteHeader.getBoundingClientRect()
        const overlayRect = modalOverlay.getBoundingClientRect()
        const modalRect = modal.getBoundingClientRect()
        const headerRect = modalHeader.getBoundingClientRect()
        
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInDetailModal.jsx:26',message:'Modal opened - z-index check',data:{pacienteHeaderZIndex:pacienteHeaderStyle.zIndex,pacienteHeaderPosition:pacienteHeaderStyle.position,pacienteHeaderTop:pacienteHeaderRect.top,pacienteHeaderHeight:pacienteHeaderRect.height,overlayZIndex:overlayStyle.zIndex,overlayTop:overlayRect.top,overlayHeight:overlayRect.height,modalZIndex:modalStyle.zIndex,modalTop:modalRect.top,headerZIndex:headerStyle.zIndex,headerTop:headerRect.top,headerHeight:headerRect.height,isOverlayFullScreen:overlayRect.top === 0 && overlayRect.left === 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInDetailModal.jsx:27',message:'Stacking context check',data:{pacienteHeaderParentZIndex:pacienteHeader.parentElement ? window.getComputedStyle(pacienteHeader.parentElement).zIndex : 'no-parent',modalParentZIndex:modalOverlay.parentElement ? window.getComputedStyle(modalOverlay.parentElement).zIndex : 'no-parent',pacienteHeaderIsSticky:pacienteHeaderStyle.position === 'sticky',overlayIsFixed:overlayStyle.position === 'fixed'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [checkIn])

  const loadReactions = async () => {
    if (!checkIn || checkIn.type === 'dieta') return
    setLoadingReactions(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/reactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setReactions(data.reactions || {})
      }
    } catch (error) {
      console.error('Erro ao carregar reações:', error)
    } finally {
      setLoadingReactions(false)
    }
  }

  const loadComments = async () => {
    if (!checkIn || checkIn.type === 'dieta') return
    setLoadingComments(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleReaction = async (emoji) => {
    if (!checkIn || checkIn.type === 'dieta') return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      })
      if (response.ok) {
        await loadReactions()
      }
    } catch (error) {
      console.error('Erro ao reagir:', error)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || postingComment) return
    setPostingComment(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      })
      if (response.ok) {
        setNewComment('')
        await loadComments()
      }
    } catch (error) {
      console.error('Erro ao postar comentário:', error)
    } finally {
      setPostingComment(false)
    }
  }

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return '?'
    const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (!checkIn) return null

  const displayName = checkIn.user?.name || checkIn.user?.email || 'Usuário'
  const isDietaCheckIn = checkIn.type === 'dieta'

  // #region agent log
  if (checkIn) {
    const overlay = document.querySelector('.checkin-detail-modal-overlay')
    if (overlay) {
      const overlayStyle = window.getComputedStyle(overlay)
      const overlayRect = overlay.getBoundingClientRect()
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckInDetailModal.jsx:145',message:'Overlay render check',data:{overlayZIndex:overlayStyle.zIndex,overlayPosition:overlayStyle.position,overlayTop:overlayRect.top,overlayLeft:overlayRect.left,overlayWidth:overlayRect.width,overlayHeight:overlayRect.height,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,isFullScreen:overlayRect.top === 0 && overlayRect.left === 0 && overlayRect.width === window.innerWidth && overlayRect.height === window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    }
  }
  // #endregion

  const modalContent = (
    <div 
      className="checkin-detail-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="checkin-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkin-detail-header">
          <h2>{checkIn.title || (isDietaCheckIn ? 'Check-in de Dieta' : 'Check-in')}</h2>
          <button 
            className="checkin-detail-close" 
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
            }}
            aria-label="Fechar modal"
            title="Fechar"
            type="button"
          >
            <span className="checkin-close-icon">✕</span>
            <span className="checkin-close-text">Fechar</span>
          </button>
        </div>

        <div className="checkin-detail-body">
          {checkIn.photoUrl && (
            <div className="checkin-detail-photo">
              <img src={checkIn.photoUrl} alt="Check-in" />
            </div>
          )}

          <div className="checkin-detail-user">
            <div className="checkin-detail-avatar">
              {checkIn.user?.profilePhoto ? (
                <img src={checkIn.user.profilePhoto} alt="" />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>
            <div>
              <span className="checkin-detail-name">{displayName}</span>
              <span className="checkin-detail-date">
                {formatDate(checkIn.createdAt)} às {formatTime(checkIn.createdAt)}
              </span>
            </div>
          </div>

          {checkIn.description && (
            <p className="checkin-detail-description">{checkIn.description}</p>
          )}

          {/* Métricas */}
          <div className="checkin-detail-metrics">
            {isDietaCheckIn ? (
              <>
                {checkIn.totalKcal && (
                  <div className="checkin-detail-metric">
                    <span>🔥</span>
                    <span>{Math.round(checkIn.totalKcal)} kcal</span>
                  </div>
                )}
                {checkIn.totalProtein && (
                  <div className="checkin-detail-metric">
                    <span>💪</span>
                    <span>{Math.round(checkIn.totalProtein)}g proteína</span>
                  </div>
                )}
                {checkIn.totalCarbs && (
                  <div className="checkin-detail-metric">
                    <span>🍞</span>
                    <span>{Math.round(checkIn.totalCarbs)}g carboidratos</span>
                  </div>
                )}
                {checkIn.totalFat && (
                  <div className="checkin-detail-metric">
                    <span>🥑</span>
                    <span>{Math.round(checkIn.totalFat)}g gordura</span>
                  </div>
                )}
                {checkIn.mealName && (
                  <div className="checkin-detail-metric">
                    <span>🍽️</span>
                    <span>{checkIn.mealName}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {checkIn.activity && (
                  <div className="checkin-detail-metric">
                    <span>🏃</span>
                    <span>{checkIn.activity}</span>
                  </div>
                )}
                {checkIn.duration && (
                  <div className="checkin-detail-metric">
                    <span>⏱️</span>
                    <span>{checkIn.duration} minutos</span>
                  </div>
                )}
                {checkIn.distance && (
                  <div className="checkin-detail-metric">
                    <span>📏</span>
                    <span>{checkIn.distance} km</span>
                  </div>
                )}
                {checkIn.calories && (
                  <div className="checkin-detail-metric">
                    <span>🔥</span>
                    <span>{checkIn.calories} calorias</span>
                  </div>
                )}
                {checkIn.steps && (
                  <div className="checkin-detail-metric">
                    <span>👣</span>
                    <span>{checkIn.steps} passos</span>
                  </div>
                )}
                {checkIn.locationName && (
                  <div className="checkin-detail-metric">
                    <span>📍</span>
                    <span>{checkIn.locationName}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detalhes do treino se houver */}
          {!isDietaCheckIn && checkIn.treinoExecutado && (
            <div className="checkin-detail-workout">
              <h3>Treino Executado</h3>
              <p>
                {checkIn.treinoExecutado.prescricao?.nome} - {checkIn.treinoExecutado.divisao?.nome}
              </p>
            </div>
          )}

          {/* Reações e Comentários (apenas para check-ins de treino) */}
          {!isDietaCheckIn && (
            <>
              {/* Reações */}
              <div className="checkin-detail-reactions">
                <div className="checkin-detail-reactions-list">
                  {Object.entries(reactions).map(([emoji, reactionList]) => (
                    <button
                      key={emoji}
                      className={`checkin-reaction-btn ${reactionList.some(r => (r.user?.id || r.userId) === currentUserId) ? 'active' : ''}`}
                      onClick={() => handleReaction(emoji)}
                    >
                      <span className="checkin-reaction-emoji">{emoji}</span>
                      <span className="checkin-reaction-count">{reactionList.length}</span>
                    </button>
                  ))}
                  <button
                    className="checkin-add-reaction-btn"
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    +
                  </button>
                </div>
                {showReactions && (
                  <div className="checkin-reaction-picker">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        className="checkin-reaction-option"
                        onClick={() => {
                          handleReaction(emoji)
                          setShowReactions(false)
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Comentários */}
              <div className="checkin-detail-comments">
                <h3>Comentários ({comments.length})</h3>
                <div className="checkin-comments-list">
                  {comments.map(comment => (
                    <div key={comment.id} className="checkin-comment">
                      <div className="checkin-comment-avatar">
                        {comment.user?.profilePhoto ? (
                          <img src={comment.user.profilePhoto} alt="" />
                        ) : (
                          <span>{getInitials(comment.user?.name || comment.user?.email)}</span>
                        )}
                      </div>
                      <div className="checkin-comment-content">
                        <div className="checkin-comment-header">
                          <span className="checkin-comment-name">
                            {comment.user?.name || comment.user?.email}
                          </span>
                          <span className="checkin-comment-date">
                            {formatDate(comment.createdAt)} às {formatTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="checkin-comment-text">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="checkin-comment-form" onSubmit={handlePostComment}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                    maxLength={500}
                  />
                  <button type="submit" disabled={!newComment.trim() || postingComment}>
                    {postingComment ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // Renderizar via Portal no body para evitar problemas de stacking context
  return checkIn ? createPortal(modalContent, document.body) : null
}

export default CheckInDetailModal
