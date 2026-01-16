import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import ImageCropModal from './ImageCropModal'
import './ProjetosMobileView.css'

function ProjetosMobileView() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState([])
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pendingBannerSrc, setPendingBannerSrc] = useState('')
  const [showCrop, setShowCrop] = useState(false)

  const token = useMemo(() => localStorage.getItem('token'), [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar projetos')
      setGrupos(data.grupos || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleCreate = async () => {
    if (creating || nome.trim().length < 2) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          bannerUrl: bannerUrl || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar projeto')

      setShowCreate(false)
      setNome('')
      setDescricao('')
      setBannerUrl('')
      await loadGroups()
      if (data?.grupo?.id) navigate(`/paciente/projetos/${data.grupo.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (joining || codigo.trim().length < 4) return
    setJoining(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao entrar no projeto')

      setShowJoin(false)
      setCodigo('')
      await loadGroups()
      if (data?.grupoId) navigate(`/paciente/projetos/${data.grupoId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setJoining(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo de 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPendingBannerSrc(reader.result)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
  }

  const copyInviteLink = (codigoConvite) => {
    const link = `${window.location.origin}/convite/${codigoConvite}`
    navigator.clipboard.writeText(link)
  }

  // Estado vazio
  const renderEmptyState = () => (
    <div className="giba-proj-page">
      {/* Hero */}
      <div className="giba-proj-welcome">
        <div className="giba-proj-badge">
          <span className="giba-proj-badge-icon">🏆</span>
          <span className="giba-proj-badge-text">GIBA</span>
        </div>
        <h1 className="giba-proj-welcome-title">Desafios em equipe</h1>
        <p className="giba-proj-welcome-sub">
          Crie projetos fitness com amigos, acompanhe check-ins e dispute quem ganha mais pontos!
        </p>
      </div>

      {/* Ações */}
      <section className="giba-proj-section">
        <div className="giba-proj-section-header">
          <h2 className="giba-proj-section-title">Comece agora</h2>
        </div>
        <p className="giba-proj-section-desc">
          Crie seu próprio projeto ou entre em um existente usando o código de convite.
        </p>

        <div className="giba-proj-actions-grid">
          <button className="giba-proj-action-card" onClick={() => setShowCreate(true)}>
            <span className="giba-proj-action-icon">➕</span>
            <div className="giba-proj-action-info">
              <h3>Criar projeto</h3>
              <p>Monte seu desafio e convide amigos</p>
            </div>
          </button>

          <button className="giba-proj-action-card" onClick={() => setShowJoin(true)}>
            <span className="giba-proj-action-icon">🔗</span>
            <div className="giba-proj-action-info">
              <h3>Entrar com código</h3>
              <p>Use um código de convite para participar</p>
            </div>
          </button>
        </div>
      </section>

      {/* Como funciona */}
      <section className="giba-proj-section">
        <div className="giba-proj-section-header">
          <h2 className="giba-proj-section-title">Como funciona</h2>
        </div>

        <div className="giba-proj-how-list">
          <div className="giba-proj-how-item">
            <span className="giba-proj-how-num">1</span>
            <div>
              <h4>Crie ou entre em um projeto</h4>
              <p>Projetos são grupos de pessoas com um objetivo em comum, como "Projeto Verão".</p>
            </div>
          </div>
          <div className="giba-proj-how-item">
            <span className="giba-proj-how-num">2</span>
            <div>
              <h4>Faça check-ins diários</h4>
              <p>Compartilhe sua atividade com o grupo - cada check-in dá pontos!</p>
            </div>
          </div>
          <div className="giba-proj-how-item">
            <span className="giba-proj-how-num">3</span>
            <div>
              <h4>Acompanhe o ranking</h4>
              <p>Veja quem está liderando e se motive com a competição saudável.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pontuação */}
      <section className="giba-proj-section">
        <div className="giba-proj-section-header">
          <h2 className="giba-proj-section-title">Sistema de pontos</h2>
        </div>
        <p className="giba-proj-section-desc">
          Cada atividade no projeto dá pontos. Quanto mais consistente, mais você sobe no ranking!
        </p>

        <div className="giba-proj-points-grid">
          <div className="giba-proj-point-card">
            <span className="giba-proj-point-icon">✅</span>
            <span className="giba-proj-point-value">+10</span>
            <span className="giba-proj-point-label">Check-in completo</span>
          </div>
          <div className="giba-proj-point-card">
            <span className="giba-proj-point-icon">📝</span>
            <span className="giba-proj-point-value">+5</span>
            <span className="giba-proj-point-label">Check-in parcial</span>
          </div>
          <div className="giba-proj-point-card">
            <span className="giba-proj-point-icon">💪</span>
            <span className="giba-proj-point-value">+20</span>
            <span className="giba-proj-point-label">Treino finalizado</span>
          </div>
          <div className="giba-proj-point-card">
            <span className="giba-proj-point-icon">🏃</span>
            <span className="giba-proj-point-value">+10</span>
            <span className="giba-proj-point-label">Treino parcial</span>
          </div>
        </div>
      </section>
    </div>
  )

  // Com projetos
  const renderProjectsView = () => (
    <div className="giba-proj-page">
      {/* Hero */}
      <div className="giba-proj-hero">
        <div className="giba-proj-hero-badge">
          <span>🏆</span>
          <span>GIBA</span>
        </div>
        <h1 className="giba-proj-hero-title">Seus projetos</h1>
        <p className="giba-proj-hero-sub">
          {grupos.length} projeto{grupos.length !== 1 ? 's' : ''} ativo{grupos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ações rápidas */}
      <section className="giba-proj-section">
        <div className="giba-proj-quick-actions">
          <button className="giba-proj-quick-btn" onClick={() => setShowCreate(true)}>
            <span>➕</span> Criar projeto
          </button>
          <button className="giba-proj-quick-btn secondary" onClick={() => setShowJoin(true)}>
            <span>🔗</span> Entrar com código
          </button>
        </div>
      </section>

      {/* Lista de projetos */}
      <section className="giba-proj-section">
        <div className="giba-proj-section-header">
          <h2 className="giba-proj-section-title">Meus projetos</h2>
        </div>

        <div className="giba-proj-list">
          {grupos.map((g) => (
            <div 
              key={g.id} 
              className="giba-proj-card"
              onClick={() => navigate(`/paciente/projetos/${g.id}`)}
            >
              <div className="giba-proj-card-banner">
                {g.bannerUrl ? (
                  <img src={g.bannerUrl} alt={g.nome} />
                ) : (
                  <div className="giba-proj-card-placeholder">
                    <span>🏆</span>
                  </div>
                )}
                <div className="giba-proj-card-overlay"></div>
                <span className="giba-proj-card-badge">
                  {g.membrosCount} {g.membrosCount === 1 ? 'membro' : 'membros'}
                </span>
              </div>

              <div className="giba-proj-card-body">
                <h3 className="giba-proj-card-title">{g.nome}</h3>
                {g.descricao && (
                  <p className="giba-proj-card-desc">{g.descricao}</p>
                )}

                <div className="giba-proj-card-footer">
                  <div className="giba-proj-card-code">
                    <span className="giba-proj-card-code-label">Código:</span>
                    <span className="giba-proj-card-code-value">{g.codigoConvite}</span>
                  </div>
                  <button 
                    className="giba-proj-card-share"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyInviteLink(g.codigoConvite)
                    }}
                    title="Copiar link de convite"
                  >
                    📋
                  </button>
                </div>

                <div className="giba-proj-card-cta">
                  Ver ranking e check-ins →
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  if (loading) {
    return (
      <div className="giba-proj-page">
        <div className="giba-proj-loading">
          <div className="giba-proj-loading-spinner"></div>
          <p>Carregando seus projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="giba-proj-error-toast">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {grupos.length === 0 ? renderEmptyState() : renderProjectsView()}

      {/* Modal Criar */}
      {showCreate && (
        <div className="giba-proj-modal-overlay" onClick={() => !creating && setShowCreate(false)}>
          <div className="giba-proj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="giba-proj-modal-header">
              <h2>Criar projeto</h2>
              <p>Monte seu desafio e convide amigos para participar</p>
            </div>

            <div className="giba-proj-modal-body">
              <div className="giba-proj-form-group">
                <label>Banner (opcional)</label>
                <div className="giba-proj-upload-area">
                  {bannerUrl ? (
                    <div className="giba-proj-upload-preview">
                      <img src={bannerUrl} alt="Preview" />
                      <button onClick={() => setBannerUrl('')}>Remover</button>
                    </div>
                  ) : (
                    <label className="giba-proj-upload-btn">
                      <span>📷</span>
                      <span>Escolher imagem</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="giba-proj-form-group">
                <label>Nome do projeto *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Projeto Verão 2026"
                  maxLength={60}
                />
              </div>

              <div className="giba-proj-form-group">
                <label>Descrição (opcional)</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Regras e objetivo do desafio..."
                  maxLength={280}
                  rows={3}
                />
              </div>

              <div className="giba-proj-info-box">
                <span>💡</span>
                <p>Após criar, você receberá um código de convite para compartilhar com amigos.</p>
              </div>
            </div>

            <div className="giba-proj-modal-footer">
              <button 
                className="giba-proj-btn-secondary" 
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button 
                className="giba-proj-btn-primary" 
                onClick={handleCreate}
                disabled={creating || nome.trim().length < 2}
              >
                {creating ? 'Criando...' : 'Criar projeto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrar */}
      {showJoin && (
        <div className="giba-proj-modal-overlay" onClick={() => !joining && setShowJoin(false)}>
          <div className="giba-proj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="giba-proj-modal-header">
              <h2>Entrar em um projeto</h2>
              <p>Cole o código de convite que você recebeu</p>
            </div>

            <div className="giba-proj-modal-body">
              <div className="giba-proj-form-group">
                <label>Código de convite</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  maxLength={12}
                  className="giba-proj-code-input"
                />
              </div>

              <div className="giba-proj-info-box">
                <span>💡</span>
                <p>O código tem 6 caracteres e foi enviado pelo criador do projeto.</p>
              </div>
            </div>

            <div className="giba-proj-modal-footer">
              <button 
                className="giba-proj-btn-secondary" 
                onClick={() => setShowJoin(false)}
                disabled={joining}
              >
                Cancelar
              </button>
              <button 
                className="giba-proj-btn-primary" 
                onClick={handleJoin}
                disabled={joining || codigo.trim().length < 4}
              >
                {joining ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={showCrop}
        onClose={() => {
          setShowCrop(false)
          setPendingBannerSrc('')
        }}
        imageSrc={pendingBannerSrc}
        title="Ajustar banner"
        subtitle="Selecione a área que vai aparecer no banner."
        aspect={3 / 1}
        confirmLabel="Usar este banner"
        output={{ maxWidth: 1200, mimeType: 'image/jpeg', quality: 0.88 }}
        onConfirm={(dataUrl) => {
          setBannerUrl(dataUrl)
          setShowCrop(false)
          setPendingBannerSrc('')
        }}
      />
    </>
  )
}

export default ProjetosMobileView
