import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../config/api'
import { EmptyState, SectionHeader } from './ui'
import './ProjetoDetalhe.css'

function ProjetoDetalhe() {
  const { grupoId } = useParams()
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('token'), [])

  const [loading, setLoading] = useState(true)
  const [grupo, setGrupo] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

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

      const [gRes, lRes] = await Promise.all([
        fetch(`${API_URL}/groups/${grupoId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/groups/${grupoId}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      const gData = await gRes.json()
      const lData = await lRes.json()
      if (!gRes.ok) throw new Error(gData?.error || 'Erro ao carregar grupo')
      if (!lRes.ok) throw new Error(lData?.error || 'Erro ao carregar ranking')

      setGrupo(gData.grupo)
      setLeaderboard(lData.leaderboard || [])
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

  if (loading) {
    return <div className="projeto-detalhe projeto-loading">Carregando...</div>
  }

  if (error) {
    return (
      <div className="projeto-detalhe">
        <div className="projeto-error">{error}</div>
        <div className="projeto-actions-row">
          <button className="btn-secondary projeto-action-btn" onClick={() => navigate('/paciente/projetos')}>
            Voltar
          </button>
          <button className="btn-primary projeto-action-btn" onClick={load}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!grupo) {
    return (
      <div className="projeto-detalhe">
        <EmptyState
          title="Projeto não encontrado"
          description="Esse projeto pode ter sido removido, ou você não tem acesso."
          action={(
            <button className="btn-secondary projeto-action-btn" onClick={() => navigate('/paciente/projetos')}>
              Voltar
            </button>
          )}
        />
      </div>
    )
  }

  return (
    <div className="projeto-detalhe">
      <SectionHeader
        title={grupo.nome}
        subtitle={grupo.descricao || 'Pontue com check-ins diários e treinos finalizados.'}
        actions={(
          <div className="projeto-actions-row">
            <button className="btn-secondary projeto-action-btn" onClick={() => navigate('/paciente/projetos')}>
              Voltar
            </button>
            <button className="btn-primary projeto-action-btn" onClick={load}>
              Atualizar
            </button>
          </div>
        )}
      />

      {grupo.bannerUrl && (
        <div className="projeto-banner">
          <img src={grupo.bannerUrl} alt={`Banner do projeto ${grupo.nome}`} />
        </div>
      )}

      <div className="projeto-invite">
        <div className="projeto-invite__label">Código do projeto</div>
        <div className="projeto-invite__row">
          <div className="projeto-invite__code">{grupo.codigoConvite}</div>
          <button className="btn-secondary projeto-action-btn" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="projeto-invite__hint">
          Envie esse código para seus amigos entrarem em “Projetos” &gt; “Entrar com código”.
        </div>
      </div>

      <div className="projeto-board">
        <div className="projeto-board__title">Participantes</div>
        <div className="projeto-members">
          {(grupo.membros || []).map((m) => {
            const displayName = m.user?.name || m.user?.email || 'Usuário'
            return (
              <div key={m.userId} className="member-pill">
                {m.user?.profilePhoto ? (
                  <img className="avatar" src={m.user.profilePhoto} alt={displayName} />
                ) : (
                  <div className="avatar avatar--fallback">{getInitials(displayName)}</div>
                )}
                <div className="member-pill__name">{displayName}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="projeto-board">
        <div className="projeto-board__title">Ranking</div>
        {leaderboard.length === 0 ? (
          <EmptyState
            title="Sem pontuação ainda"
            description="Quando o grupo fizer check-in e finalizar treinos, o placar aparece aqui."
          />
        ) : (
          <div className="projeto-leaderboard">
            {leaderboard.map((item) => (
              <div key={item.user?.id} className="leader-row">
                <div className="leader-pos">{item.posicao}</div>
                <div className="leader-user">
                  {item.user?.profilePhoto ? (
                    <img className="avatar" src={item.user.profilePhoto} alt={item.user?.name || item.user?.email || 'Usuário'} />
                  ) : (
                    <div className="avatar avatar--fallback">{getInitials(item.user?.name || item.user?.email)}</div>
                  )}
                  <div className="leader-name">
                    {item.user?.name || item.user?.email || 'Usuário'}
                  </div>
                </div>
                <div className="leader-points">{item.pontos} pts</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjetoDetalhe


