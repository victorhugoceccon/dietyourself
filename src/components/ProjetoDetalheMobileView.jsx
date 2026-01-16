import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../config/api'
import GroupCheckInModal from './GroupCheckInModal'
import GroupDietCheckInModal from './GroupDietCheckInModal'
import CheckInDetailModal from './CheckInDetailModal'
import CommentInput from './CommentInput'
import './ProjetoDetalheMobileView.css'

function ProjetoDetalheMobileView() {
  const { grupoId } = useParams()
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('token'), [])

  const [loading, setLoading] = useState(true)
  const [grupo, setGrupo] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [checkInsWithSocial, setCheckInsWithSocial] = useState([]) // Check-ins com reações e comentários
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showDietCheckInModal, setShowDietCheckInModal] = useState(false)
  const [showCheckInTypeSelector, setShowCheckInTypeSelector] = useState(false)
  const [selectedCheckIn, setSelectedCheckIn] = useState(null)
  const [activeTab, setActiveTab] = useState('ranking')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [expandedActions, setExpandedActions] = useState(null) // ID do check-in com ações expandidas

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return '?'
    const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [gRes, lRes, cRes] = await Promise.all([
        fetch(`${API_URL}/groups/${grupoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/${grupoId}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/${grupoId}/checkins`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      const gData = await gRes.json()
      const lData = await lRes.json()
      const cData = await cRes.json()

      if (!gRes.ok) throw new Error(gData?.error || 'Erro ao carregar projeto')
      if (!lRes.ok) throw new Error(lData?.error || 'Erro ao carregar ranking')

      setGrupo(gData.grupo)
      setLeaderboard(lData.leaderboard || [])
      setCheckIns(cData.checkIns || [])
      
      // Carregar reações e comentários para cada check-in
      await loadCheckInsSocial(cData.checkIns || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadCurrentUser()
  }, [grupoId])

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (expandedActions && !e.target.closest('.giba-det-timeline-actions')) {
        setExpandedActions(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedActions])

  const loadCurrentUser = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setCurrentUserId(userData.id)
      } else {
        // Buscar da API se não estiver no localStorage
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.user?.id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const loadCheckInsSocial = async (checkInsList) => {
    try {
      const checkInsWithData = await Promise.all(
        checkInsList.map(async (checkIn) => {
          if (checkIn.type === 'dieta') {
            return { ...checkIn, reactions: {}, comments: [] }
          }

          // Carregar reações e comentários
          const [reactionsRes, commentsRes] = await Promise.all([
            fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/reactions`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`${API_URL}/groups/${grupoId}/checkins/${checkIn.id}/comments`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ])

          const reactions = reactionsRes.ok ? (await reactionsRes.json()).reactions || {} : {}
          const comments = commentsRes.ok ? (await commentsRes.json()).comments || [] : []

          return {
            ...checkIn,
            reactions,
            comments,
            reactionsCount: Object.values(reactions).reduce((sum, arr) => sum + arr.length, 0),
            commentsCount: comments.length
          }
        })
      )

      setCheckInsWithSocial(checkInsWithData)
    } catch (error) {
      console.error('Erro ao carregar dados sociais:', error)
      setCheckInsWithSocial(checkInsList.map(ci => ({ ...ci, reactions: {}, comments: [] })))
    }
  }

  const handleReaction = async (checkInId, emoji) => {
    if (!checkInId || !emoji) return
    
    try {
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkInId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        // Recarregar reações completas para garantir sincronização
        const reactionsRes = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkInId}/reactions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (reactionsRes.ok) {
          const reactionsData = await reactionsRes.json()
          setCheckInsWithSocial(prev => prev.map(ci => 
            ci.id === checkInId 
              ? { 
                  ...ci, 
                  reactions: reactionsData.reactions || {},
                  reactionsCount: reactionsData.total || 0
                }
              : ci
          ))
        }
      }
    } catch (error) {
      console.error('Erro ao reagir:', error)
    }
  }

  const handleAddComment = async (checkInId, content) => {
    if (!checkInId || !content.trim()) return

    try {
      const response = await fetch(`${API_URL}/groups/${grupoId}/checkins/${checkInId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: content.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar comentários no estado
        setCheckInsWithSocial(prev => prev.map(ci => {
          if (ci.id === checkInId) {
            const newComments = [...(ci.comments || []), data.comment]
            return {
              ...ci,
              comments: newComments,
              commentsCount: newComments.length
            }
          }
          return ci
        }))
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    }
  }

  const handleCopyCode = async () => {
    if (!grupo?.codigoConvite) return
    await navigator.clipboard.writeText(grupo.codigoConvite)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!grupo?.codigoConvite) return
    const link = `${window.location.origin}/convite/${grupo.codigoConvite}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const getTrophyIcon = (position) => {
    if (position === 1) return '🥇'
    if (position === 2) return '🥈'
    if (position === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="giba-det-page">
        <div className="giba-det-loading">
          <div className="giba-det-loading-spinner"></div>
          <p>Carregando projeto...</p>
        </div>
      </div>
    )
  }

  if (error || !grupo) {
    return (
      <div className="giba-det-page">
        <div className="giba-det-error">
          <span className="giba-det-error-icon">😕</span>
          <h2>Projeto não encontrado</h2>
          <p>{error || 'Esse projeto pode ter sido removido ou você não tem acesso.'}</p>
          <button className="giba-det-btn-primary" onClick={() => navigate('/paciente/projetos')}>
            Voltar para projetos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="giba-det-page">
      {/* Hero */}
      <div className="giba-det-hero">
        {grupo.bannerUrl && (
          <img src={grupo.bannerUrl} alt={grupo.nome} className="giba-det-hero-bg" />
        )}
        <div className="giba-det-hero-overlay"></div>

        <div className="giba-det-hero-content">
          <button 
            className="giba-det-back-btn"
            onClick={() => navigate('/paciente/projetos')}
          >
            ← Voltar
          </button>

          <div className="giba-det-hero-badge">
            <span>🏆</span>
            <span>Projeto</span>
          </div>

          <h1 className="giba-det-hero-title">{grupo.nome}</h1>
          {grupo.descricao && (
            <p className="giba-det-hero-desc">{grupo.descricao}</p>
          )}

          <div className="giba-det-hero-stats">
            <div className="giba-det-stat">
              <span className="giba-det-stat-value">{leaderboard.length}</span>
              <span className="giba-det-stat-label">Participantes</span>
            </div>
            <div className="giba-det-stat">
              <span className="giba-det-stat-value">{checkIns.length}</span>
              <span className="giba-det-stat-label">Check-ins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Código de convite */}
      <section className="giba-det-section">
        <div className="giba-det-invite-card">
          <div className="giba-det-invite-info">
            <span className="giba-det-invite-icon">🔗</span>
            <div>
              <span className="giba-det-invite-label">Código de convite</span>
              <span className="giba-det-invite-code">{grupo.codigoConvite}</span>
            </div>
          </div>
          <div className="giba-det-invite-actions">
            <button 
              className="giba-det-invite-btn"
              onClick={handleCopyCode}
            >
              {copied ? '✓ Copiado!' : 'Copiar código'}
            </button>
            <button 
              className="giba-det-invite-btn secondary"
              onClick={handleCopyLink}
            >
              📋 Copiar link
            </button>
          </div>
        </div>
      </section>

      {/* CTA Check-in */}
      <section className="giba-det-section">
        <button 
          className="giba-det-checkin-btn"
          onClick={() => setShowCheckInModal(true)}
        >
          <span className="giba-det-checkin-icon">📸</span>
          <div className="giba-det-checkin-info">
            <span className="giba-det-checkin-title">Fazer check-in</span>
            <span className="giba-det-checkin-sub">Compartilhe sua atividade e ganhe pontos</span>
          </div>
          <span className="giba-det-checkin-arrow">→</span>
        </button>
      </section>

      {/* Tabs */}
      <section className="giba-det-section">
        <div className="giba-det-tabs">
          <button 
            className={`giba-det-tab ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            🏆 Ranking
          </button>
          <button 
            className={`giba-det-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📝 Timeline
          </button>
          <button 
            className={`giba-det-tab ${activeTab === 'membros' ? 'active' : ''}`}
            onClick={() => setActiveTab('membros')}
          >
            👥 Membros
          </button>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'ranking' && (
        <section className="giba-det-section">
          <div className="giba-det-section-header">
            <h2 className="giba-det-section-title">Quem está na frente</h2>
          </div>
          <p className="giba-det-section-desc">
            Ranking baseado em check-ins e treinos finalizados.
          </p>

          {leaderboard.length === 0 ? (
            <div className="giba-det-empty">
              <span>🏆</span>
              <h3>Sem pontuação ainda</h3>
              <p>Seja o primeiro a fazer um check-in!</p>
            </div>
          ) : (
            <div className="giba-det-ranking">
              {leaderboard.map((item, idx) => {
                const trophy = getTrophyIcon(item.posicao)
                const isTop3 = item.posicao <= 3
                return (
                  <div 
                    key={item.user?.id || idx} 
                    className={`giba-det-rank-item ${isTop3 ? 'top' : ''}`}
                  >
                    <div className="giba-det-rank-pos">
                      {trophy || `${item.posicao}º`}
                    </div>
                    <div className="giba-det-rank-avatar">
                      {item.user?.profilePhoto ? (
                        <img src={item.user.profilePhoto} alt="" />
                      ) : (
                        <span>{getInitials(item.user?.name || item.user?.email)}</span>
                      )}
                    </div>
                    <div className="giba-det-rank-info">
                      <span className="giba-det-rank-name">
                        {item.user?.name || item.user?.email || 'Usuário'}
                      </span>
                    </div>
                    <div className="giba-det-rank-points">
                      <span className="giba-det-points-value">{item.pontos}</span>
                      <span className="giba-det-points-label">pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'timeline' && (
        <section className="giba-det-section">
          <div className="giba-det-section-header">
            <h2 className="giba-det-section-title">Atividades recentes</h2>
          </div>

          {(checkInsWithSocial.length > 0 ? checkInsWithSocial : checkIns).length === 0 ? (
            <div className="giba-det-empty">
              <span>📝</span>
              <h3>Nenhum check-in ainda</h3>
              <p>Seja o primeiro a compartilhar sua atividade!</p>
            </div>
          ) : (
            <div className="giba-det-timeline">
              {(checkInsWithSocial.length > 0 ? checkInsWithSocial : checkIns).map((checkIn) => {
                const displayName = checkIn.user?.name || checkIn.user?.email || 'Usuário'
                const isDieta = checkIn.type === 'dieta'
                const showActions = expandedActions === checkIn.id
                return (
                  <div 
                    key={checkIn.id} 
                    className={`giba-det-timeline-item ${isDieta ? 'dieta' : 'treino'}`}
                  >
                    {checkIn.photoUrl && (
                      <div className="giba-det-timeline-photo" onClick={() => setSelectedCheckIn(checkIn)}>
                        <img src={checkIn.photoUrl} alt="Check-in" />
                        {isDieta && (
                          <div className="giba-det-timeline-type-badge dieta">
                            🥗 Dieta
                          </div>
                        )}
                        {!isDieta && (
                          <div className="giba-det-timeline-type-badge treino">
                            💪 Treino
                          </div>
                        )}
                      </div>
                    )}
                    <div className="giba-det-timeline-content">
                      <div className="giba-det-timeline-header">
                        <div className="giba-det-timeline-avatar">
                          {checkIn.user?.profilePhoto ? (
                            <img src={checkIn.user.profilePhoto} alt="" />
                          ) : (
                            <span>{getInitials(displayName)}</span>
                          )}
                        </div>
                        <div className="giba-det-timeline-meta">
                          <span className="giba-det-timeline-name">{displayName}</span>
                          <span className="giba-det-timeline-date">
                            {formatDate(checkIn.createdAt)} às {formatTime(checkIn.createdAt)}
                          </span>
                        </div>
                      </div>

                      {checkIn.title && (
                        <h3 className="giba-det-timeline-title">{checkIn.title}</h3>
                      )}

                      {checkIn.description && (
                        <p className="giba-det-timeline-desc">{checkIn.description}</p>
                      )}

                      <div className="giba-det-timeline-tags">
                        {isDieta ? (
                          <>
                            {checkIn.totalKcal && (
                              <span className="giba-det-timeline-tag">🔥 {Math.round(checkIn.totalKcal)} kcal</span>
                            )}
                            {checkIn.totalProtein && (
                              <span className="giba-det-timeline-tag">💪 {Math.round(checkIn.totalProtein)}g</span>
                            )}
                            {checkIn.mealName && (
                              <span className="giba-det-timeline-tag">🍽️ {checkIn.mealName}</span>
                            )}
                          </>
                        ) : (
                          <>
                            {checkIn.activity && (
                              <span className="giba-det-timeline-tag">{checkIn.activity}</span>
                            )}
                            {checkIn.duration && (
                              <span className="giba-det-timeline-tag">⏱️ {checkIn.duration}min</span>
                            )}
                            {checkIn.calories && (
                              <span className="giba-det-timeline-tag">🔥 {checkIn.calories}cal</span>
                            )}
                            {checkIn.locationName && (
                              <span className="giba-det-timeline-tag">📍 {checkIn.locationName}</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Reações e Comentários inline (apenas para treino) */}
                      {!isDieta && (
                        <>
                          {/* Reações */}
                          {Object.keys(checkIn.reactions || {}).length > 0 && (
                            <div className="giba-det-timeline-reactions-inline">
                              {Object.entries(checkIn.reactions || {}).map(([emoji, reactionList]) => (
                                <button
                                  key={emoji}
                                  className={`giba-det-reaction-inline-btn ${reactionList.some(r => (r.userId || r.user?.id) === currentUserId) ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReaction(checkIn.id, emoji)
                                  }}
                                  title={`${reactionList.length} ${emoji}`}
                                >
                                  <span>{emoji}</span>
                                  <span>{reactionList.length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Comentários */}
                          {checkIn.comments && checkIn.comments.length > 0 && (
                            <div className="giba-det-timeline-comments-inline">
                              {checkIn.comments.slice(0, 2).map(comment => (
                                <div key={comment.id} className="giba-det-comment-inline">
                                  <span className="giba-det-comment-inline-name">
                                    {comment.user?.name || comment.user?.email}:
                                  </span>
                                  <span className="giba-det-comment-inline-text">{comment.content}</span>
                                </div>
                              ))}
                              {checkIn.comments.length > 2 && (
                                <button
                                  className="giba-det-comment-inline-more"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCheckIn(checkIn)
                                  }}
                                >
                                  Ver mais {checkIn.comments.length - 2} comentários
                                </button>
                              )}
                            </div>
                          )}

                          {/* Botão de ações */}
                          <div className="giba-det-timeline-actions">
                            <button
                              className="giba-det-timeline-action-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedActions(showActions ? null : checkIn.id)
                              }}
                            >
                              +
                            </button>
                            {showActions && (
                              <div className="giba-det-timeline-actions-menu">
                                <div className="giba-det-actions-reactions">
                                  {['🔥', '💪', '👏', '🎯', '⚡', '❤️'].map(emoji => (
                                    <button
                                      key={emoji}
                                      className={`giba-det-action-reaction ${(checkIn.reactions?.[emoji] || []).some(r => (r.user?.id || r.userId) === currentUserId) ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleReaction(checkIn.id, emoji)
                                        setExpandedActions(null)
                                      }}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <CommentInput
                                  checkInId={checkIn.id}
                                  onComment={(content) => {
                                    handleAddComment(checkIn.id, content)
                                    setExpandedActions(null)
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'membros' && (
        <section className="giba-det-section">
          <div className="giba-det-section-header">
            <h2 className="giba-det-section-title">Participantes</h2>
          </div>
          <p className="giba-det-section-desc">
            {grupo.membros?.length} pessoas participando deste projeto.
          </p>

          <div className="giba-det-members">
            {(grupo.membros || []).map((m) => {
              const displayName = m.user?.name || m.user?.email || 'Usuário'
              return (
                <div key={m.userId} className="giba-det-member">
                  <div className="giba-det-member-avatar">
                    {m.user?.profilePhoto ? (
                      <img src={m.user.profilePhoto} alt="" />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}
                  </div>
                  <div className="giba-det-member-info">
                    <span className="giba-det-member-name">{displayName}</span>
                    <span className="giba-det-member-role">
                      {m.papel === 'DONO' ? '👑 Criador' : 'Membro'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Modal de Check-in de Treino */}
      <GroupCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        grupoId={grupoId}
        onCreated={async () => {
          await loadData()
          setShowCheckInModal(false)
        }}
      />

      {/* Modal de Check-in de Dieta */}
      <GroupDietCheckInModal
        isOpen={showDietCheckInModal}
        onClose={() => setShowDietCheckInModal(false)}
        grupoId={grupoId}
        onCreated={async () => {
          await loadData()
          setShowDietCheckInModal(false)
        }}
      />

      {/* Modal de Detalhes do Check-in */}
      {selectedCheckIn && (
        <CheckInDetailModal
          checkIn={selectedCheckIn}
          grupoId={grupoId}
          onClose={() => setSelectedCheckIn(null)}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

export default ProjetoDetalheMobileView
