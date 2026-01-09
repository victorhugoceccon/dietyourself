import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../config/api'
import { EmptyState, Modal } from './ui'
import GroupCheckInModal from './GroupCheckInModal'
import './ProjetoDetalhe.css'

function ProjetoDetalhe() {
  const { grupoId } = useParams()
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('token'), [])

  const [loading, setLoading] = useState(true)
  const [grupo, setGrupo] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [selectedCheckIn, setSelectedCheckIn] = useState(null)

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return '?'
    const parts = String(nameOrEmail).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const [gRes, lRes, cRes] = await Promise.all([
        fetch(`${API_URL}/groups/${grupoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/${grupoId}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/${grupoId}/checkins`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      const gData = await gRes.json()
      const lData = await lRes.json()
      const cData = await cRes.json()
      
      if (!gRes.ok) throw new Error(gData?.error || 'Erro ao carregar grupo')
      if (!lRes.ok) throw new Error(lData?.error || 'Erro ao carregar ranking')

      setGrupo(gData.grupo)
      setLeaderboard(lData.leaderboard || [])
      setCheckIns(cData.checkIns || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId])

  const handleCopy = async () => {
    try {
      if (!grupo?.codigoConvite) return
      await navigator.clipboard.writeText(grupo.codigoConvite)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignora
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    }
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

  const mapUrl = (checkIn) => {
    if (!checkIn.locationLat || !checkIn.locationLng) return null
    return `${API_URL}/places/static-map?lat=${checkIn.locationLat}&lng=${checkIn.locationLng}&zoom=15&size=600x200&markers=true`
  }

  if (loading) {
    return <div className="projeto-modern projeto-loading">Carregando...</div>
  }

  if (error) {
    return (
      <div className="projeto-modern">
        <div className="projeto-error">{error}</div>
        <div className="projeto-actions-row">
          <button className="btn-secondary" onClick={() => navigate('/paciente/projetos')}>
            Voltar
          </button>
          <button className="btn-primary" onClick={load}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="projeto-modern">
        <EmptyState
          title="Projeto não encontrado"
          description="Esse projeto pode ter sido removido, ou você não tem acesso."
          action={(
            <button className="btn-secondary" onClick={() => navigate('/paciente/projetos')}>
              Voltar
            </button>
          )}
        />
      </div>
    )
  }

  return (
    <div className="projeto-modern">
      {/* Hero Section */}
      <div className="projeto-hero">
        <div className="projeto-hero__bg">
          {grupo.bannerUrl && (
            <img src={grupo.bannerUrl} alt={`Banner do projeto ${grupo.nome}`} />
          )}
          <div className="projeto-hero__overlay" />
        </div>

        <div className="projeto-hero-content">
          <button
            className="projeto-hero-back"
            onClick={() => navigate('/paciente/projetos')}
            aria-label="Voltar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <p className="projeto-hero-kicker">Projeto em equipe</p>
          <h1 className="projeto-hero-title">{grupo.nome}</h1>
          {grupo.descricao && (
            <p className="projeto-hero-subtitle">{grupo.descricao}</p>
          )}

          <div className="projeto-hero-chips">
            <div className="projeto-hero-chip">
              <span>Participantes</span>
              <strong>{leaderboard?.length || 0}</strong>
            </div>
            <div className="projeto-hero-chip">
              <span>Código do projeto</span>
              <button className="projeto-chip-btn" onClick={handleCopy}>
                {copied ? 'Copiado!' : (grupo.codigoConvite || '–––')}
              </button>
            </div>
            <div className="projeto-hero-chip">
              <span>Check-ins recentes</span>
              <strong>{checkIns.length}</strong>
            </div>
          </div>

          <div className="projeto-hero-actions">
            <button className="cta-hero" onClick={() => setShowCheckInModal(true)}>
              <span>Fazer Check-in</span>
              <span className="cta-hero__arrow">
                <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="projeto-cards-grid">
        {/* Código de Convite */}
        <div className="projeto-card projeto-card-code">
          <div className="projeto-card-header">
            <div className="projeto-card-icon">🔗</div>
            <h3 className="projeto-card-title">Código de Convite</h3>
          </div>
          <div className="projeto-card-content">
            <div className="projeto-code-display" onClick={handleCopy}>
              <span className="projeto-code-text">{grupo.codigoConvite}</span>
              <button className="projeto-code-copy" onClick={handleCopy}>
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <p className="projeto-code-hint">
              Compartilhe este código para convidar amigos
            </p>
          </div>
        </div>

        {/* Participantes */}
        <div className="projeto-card">
          <div className="projeto-card-header">
            <div className="projeto-card-icon">👥</div>
            <h3 className="projeto-card-title">Participantes</h3>
          </div>
          <div className="projeto-card-content">
            <div className="projeto-members-grid">
              {(grupo.membros || []).slice(0, 6).map((m) => {
                const displayName = m.user?.name || m.user?.email || 'Usuário'
                return (
                  <div key={m.userId} className="projeto-member-item">
                    {m.user?.profilePhoto ? (
                      <img className="projeto-member-avatar" src={m.user.profilePhoto} alt={displayName} />
                    ) : (
                      <div className="projeto-member-avatar projeto-member-avatar-fallback">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span className="projeto-member-name">{displayName.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
            {(grupo.membros || []).length > 6 && (
              <p className="projeto-members-more">+{grupo.membros.length - 6} mais</p>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="projeto-card projeto-card-ranking">
          <div className="projeto-card-header">
            <div className="projeto-card-icon">🏆</div>
            <h3 className="projeto-card-title">Ranking</h3>
          </div>
          <div className="projeto-card-content">
            {leaderboard.length === 0 ? (
              <EmptyState
                title="Sem pontuação ainda"
                description="Quando o grupo fizer check-in e finalizar treinos, o placar aparece aqui."
              />
            ) : (
              <div className="projeto-leaderboard-modern">
                {leaderboard.slice(0, 5).map((item) => {
                  const trophy = getTrophyIcon(item.posicao)
                  return (
                    <div key={item.user?.id} className={`projeto-leader-item ${item.posicao <= 3 ? 'projeto-leader-top' : ''}`}>
                      <div className="projeto-leader-left">
                        <div className="projeto-leader-position">
                          {trophy || item.posicao}º
                        </div>
                        {item.user?.profilePhoto ? (
                          <img className="projeto-leader-avatar" src={item.user.profilePhoto} alt={item.user?.name || item.user?.email || 'Usuário'} />
                        ) : (
                          <div className="projeto-leader-avatar projeto-leader-avatar-fallback">
                            {getInitials(item.user?.name || item.user?.email)}
                          </div>
                        )}
                        <div className="projeto-leader-info">
                          <div className="projeto-leader-name">
                            {item.user?.name || item.user?.email || 'Usuário'}
                          </div>
                        </div>
                      </div>
                      <div className="projeto-leader-points">
                        {item.pontos} <span className="projeto-leader-points-label">pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="projeto-timeline-section">
        <div className="projeto-timeline-header">
          <h2 className="projeto-timeline-title">Timeline</h2>
        </div>
        {checkIns.length === 0 ? (
          <EmptyState
            title="Nenhum check-in ainda"
            description="Seja o primeiro a fazer um check-in e compartilhar seu treino!"
          />
        ) : (
          <div className="projeto-timeline">
            {checkIns.map((checkIn) => {
              const displayName = checkIn.user?.name || checkIn.user?.email || 'Usuário'
              return (
                <div
                  key={checkIn.id}
                  className="projeto-timeline-item"
                  onClick={() => setSelectedCheckIn(checkIn)}
                >
                  {checkIn.photoUrl && (
                    <div className="projeto-timeline-photo">
                      <img src={checkIn.photoUrl} alt="Check-in" />
                    </div>
                  )}
                  <div className="projeto-timeline-content">
                    <div className="projeto-timeline-header-item">
                      <div className="projeto-timeline-user">
                        {checkIn.user?.profilePhoto ? (
                          <img className="projeto-timeline-avatar" src={checkIn.user.profilePhoto} alt={displayName} />
                        ) : (
                          <div className="projeto-timeline-avatar projeto-timeline-avatar-fallback">
                            {getInitials(displayName)}
                          </div>
                        )}
                        <div>
                          <div className="projeto-timeline-name">{displayName}</div>
                          <div className="projeto-timeline-date">
                            {formatDate(checkIn.createdAt)} às {formatTime(checkIn.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {checkIn.title && (
                      <h3 className="projeto-timeline-title-item">{checkIn.title}</h3>
                    )}
                    {checkIn.activity && (
                      <div className="projeto-timeline-activity">
                        Atividade: <strong>{checkIn.activity}</strong>
                      </div>
                    )}
                    {checkIn.description && (
                      <p className="projeto-timeline-description">{checkIn.description}</p>
                    )}
                    <div className="projeto-timeline-tags">
                      {checkIn.activity && (
                        <span className="projeto-timeline-tag">{checkIn.activity}</span>
                      )}
                      {checkIn.duration && (
                        <span className="projeto-timeline-tag">⏱️ {checkIn.duration}min</span>
                      )}
                      {checkIn.distance && (
                        <span className="projeto-timeline-tag">📏 {checkIn.distance}km</span>
                      )}
                      {checkIn.calories && (
                        <span className="projeto-timeline-tag">🔥 {checkIn.calories}cal</span>
                      )}
                      {checkIn.steps && (
                        <span className="projeto-timeline-tag">👣 {checkIn.steps} passos</span>
                      )}
                      {checkIn.locationName && (
                        <span className="projeto-timeline-tag">📍 {checkIn.locationName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="projeto-sticky-cta">
        <button className="cta-hero" onClick={() => setShowCheckInModal(true)}>
          <span>Fazer Check-in agora</span>
          <span className="cta-hero__arrow">
            <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
              <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
              <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
            </svg>
          </span>
        </button>
      </div>

      {/* Modal de Check-in */}
      <GroupCheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        grupoId={grupoId}
        onCreated={() => {
          load()
          setShowCheckInModal(false)
        }}
      />

      {/* Modal de Detalhes do Check-in */}
      {selectedCheckIn && (
        <Modal
          isOpen={!!selectedCheckIn}
          onClose={() => setSelectedCheckIn(null)}
          title={selectedCheckIn.title || 'Check-in'}
          size="lg"
          className="lifefit-modal--scroll-body"
        >
          <div className="projeto-checkin-detail">
            {selectedCheckIn.photoUrl && (
              <div className="projeto-checkin-detail-photo">
                <img src={selectedCheckIn.photoUrl} alt="Check-in" />
              </div>
            )}
            <div className="projeto-checkin-detail-content">
              <div className="projeto-checkin-detail-meta">
                <div className="projeto-checkin-detail-meta-item">
                  <span className="meta-label">Por</span>
                  <strong>{selectedCheckIn.user?.name || selectedCheckIn.user?.email || 'Usuário'}</strong>
                </div>
                <div className="projeto-checkin-detail-meta-item">
                  <span className="meta-label">Data</span>
                  <strong>{formatDate(selectedCheckIn.createdAt)} · {formatTime(selectedCheckIn.createdAt)}</strong>
                </div>
                <div className="projeto-checkin-detail-meta-item">
                  <span className="meta-label">Local</span>
                  <strong>{selectedCheckIn.locationName || 'Não informado'}</strong>
                </div>
                <div className="projeto-checkin-detail-meta-item">
                  <span className="meta-label">Atividade</span>
                  <strong>{selectedCheckIn.activity || 'Não informado'}</strong>
                </div>
              </div>

              <div className="projeto-checkin-detail-description">
                {selectedCheckIn.description
                  ? selectedCheckIn.description
                  : 'Sem descrição.'}
              </div>

              <div className="projeto-checkin-detail-metrics">
                {[
                  selectedCheckIn.duration && { label: 'Duração', value: `${selectedCheckIn.duration} min`, icon: '⏱️' },
                  selectedCheckIn.distance && { label: 'Distância', value: `${selectedCheckIn.distance} km`, icon: '📏' },
                  selectedCheckIn.calories && { label: 'Calorias', value: `${selectedCheckIn.calories} cal`, icon: '🔥' },
                  selectedCheckIn.steps && { label: 'Passos', value: `${selectedCheckIn.steps}`, icon: '👣' }
                ].filter(Boolean).length > 0 ? (
                  [
                    selectedCheckIn.duration && { label: 'Duração', value: `${selectedCheckIn.duration} min`, icon: '⏱️' },
                    selectedCheckIn.distance && { label: 'Distância', value: `${selectedCheckIn.distance} km`, icon: '📏' },
                    selectedCheckIn.calories && { label: 'Calorias', value: `${selectedCheckIn.calories} cal`, icon: '🔥' },
                    selectedCheckIn.steps && { label: 'Passos', value: `${selectedCheckIn.steps}`, icon: '👣' }
                  ].filter(Boolean).map((item, idx) => (
                    <div className="projeto-checkin-detail-metric" key={idx}>
                      <span className="metric-icon">{item.icon}</span>
                      <div>
                        <strong>{item.label}:</strong> {item.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="projeto-checkin-detail-metric muted">
                    Nenhuma métrica informada.
                  </div>
                )}
              </div>

            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ProjetoDetalhe
