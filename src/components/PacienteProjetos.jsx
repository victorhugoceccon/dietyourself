import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import { EmptyState, Modal, SectionHeader } from './ui'
import ImageCropModal from './ImageCropModal'
import './PacienteProjetos.css'

function PacienteProjetos() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [grupos, setGrupos] = useState([])
  const [error, setError] = useState(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pendingBannerSrc, setPendingBannerSrc] = useState('')
  const [showCrop, setShowCrop] = useState(false)

  const token = useMemo(() => localStorage.getItem('token'), [])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar grupos')

      setGrupos(data.grupos || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
    try {
      setError(null)
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() ? descricao.trim() : null,
          bannerUrl: bannerUrl ? bannerUrl : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar grupo')

      setShowCreate(false)
      setNome('')
      setDescricao('')
      setBannerUrl('')
      await load()
      if (data?.grupo?.id) navigate(`/paciente/projetos/${data.grupo.id}`)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleJoin = async () => {
    try {
      setError(null)
      const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codigo: codigo.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao entrar no grupo')

      setShowJoin(false)
      setCodigo('')
      await load()
      if (data?.grupoId) navigate(`/paciente/projetos/${data.grupoId}`)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="paciente-projetos">
<<<<<<< HEAD
      <div className="projetos-hero">
        <div className="projetos-hero__glow"></div>
        <div className="projetos-hero__content">
          <p className="projetos-hero__kicker">Desafios em grupo</p>
          <h1 className="projetos-hero__title">Construa o próximo desafio</h1>
          <p className="projetos-hero__subtitle">
            Crie ou entre em um projeto, acompanhe pontos e incentive o time com check-ins diários.
          </p>

          <div className="projetos-actions">
            <button className="btn-secondary projetos-action-btn ghost" onClick={() => setShowJoin(true)}>
              Entrar com código
            </button>
            <button className="projetos-action-btn cta" onClick={() => setShowCreate(true)}>
              <span>Criar projeto</span>
              <span className="cta-hero__arrow">
                <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                </svg>
              </span>
            </button>
          </div>

          <div className="projetos-hero__stats">
            <div className="projetos-hero__stat">
              <span>Projetos ativos</span>
              <strong>{grupos.length}</strong>
            </div>
            <div className="projetos-hero__stat">
              <span>Check-ins em equipe</span>
              <strong>Ranking por pontos</strong>
            </div>
            <div className="projetos-hero__stat">
              <span>Convites</span>
              <strong>Código compartilhável</strong>
            </div>
          </div>
        </div>
      </div>
=======
      <SectionHeader
        title="Projetos"
        subtitle="Crie um desafio com amigos e acompanhe o ranking por pontos."
        actions={(
          <div className="projetos-actions">
            <button className="btn-secondary projetos-action-btn" onClick={() => setShowJoin(true)}>
              Entrar com código
            </button>
            <button className="btn-primary projetos-action-btn" onClick={() => setShowCreate(true)}>
              Criar projeto
            </button>
          </div>
        )}
      />
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e

      {error && (
        <div className="projetos-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="projetos-loading">Carregando...</div>
      ) : (
        <>
          {grupos.length === 0 ? (
            <EmptyState
              title="Nenhum projeto ainda"
              description="Crie um “Projeto Verão” com seus amigos ou entre com um código de convite."
              action={(
                <div className="projetos-empty-actions">
                  <button className="btn-secondary projetos-action-btn" onClick={() => setShowJoin(true)}>
                    Entrar
                  </button>
                  <button className="btn-primary projetos-action-btn" onClick={() => setShowCreate(true)}>
                    Criar
                  </button>
                </div>
              )}
            />
          ) : (
            <div className="projetos-grid">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  className="projeto-card"
                  onClick={() => navigate(`/paciente/projetos/${g.id}`)}
                >
<<<<<<< HEAD
                  <div className="projeto-card__media">
                    {g.bannerUrl ? (
                      <img src={g.bannerUrl} alt={`Banner do projeto ${g.nome}`} />
                    ) : (
                      <div className="projeto-card__placeholder">
                        <span>Projeto</span>
                      </div>
                    )}
                    <span className="projeto-card__pill">Desafio</span>
                  </div>

                  <div className="projeto-card__body">
                    <div className="projeto-card__title-row">
                      <h3 className="projeto-card__title">{g.nome}</h3>
                      <span className="projeto-card__members">
                        {g.membrosCount} {g.membrosCount === 1 ? 'membro' : 'membros'}
                      </span>
                    </div>

                    {g.descricao && (
                      <p className="projeto-card__desc">{g.descricao}</p>
                    )}

                    <div className="projeto-card__meta">
                      <span className="projeto-card__code">
                        Código: <strong>{g.codigoConvite}</strong>
                      </span>
                      <span className="projeto-card__cta">Ver ranking →</span>
                    </div>
=======
                  {g.bannerUrl && (
                    <div className="projeto-card__banner">
                      <img src={g.bannerUrl} alt={`Banner do projeto ${g.nome}`} />
                    </div>
                  )}
                  <div className="projeto-card__header">
                    <div className="projeto-card__title">{g.nome}</div>
                    <div className="projeto-card__badge">
                      {g.membrosCount} {g.membrosCount === 1 ? 'membro' : 'membros'}
                    </div>
                  </div>
                  {g.descricao && (
                    <div className="projeto-card__desc">{g.descricao}</div>
                  )}
                  <div className="projeto-card__footer">
                    <span className="projeto-card__code">Código: {g.codigoConvite}</span>
                    <span className="projeto-card__cta">Ver ranking</span>
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Criar */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Criar projeto"
        subtitle="Ex.: Projeto Verão • 30 dias • quem somar mais pontos vence"
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancelar
            </button>
<<<<<<< HEAD
            <button className="projetos-action-btn cta" onClick={handleCreate} disabled={nome.trim().length < 2}>
              <span>Criar</span>
              <span className="cta-hero__arrow">
                <svg width="46" height="24" viewBox="0 0 66 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="one" d="M40.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L65.692 20.785a.7.7 0 0 1 0 .988L44.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L56.994 21.857a.271.271 0 0 0-.006-.714L40.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="two" d="M20.154 3.895l3.822-3.756c.195-.192.507-.192.702 0L45.692 20.785a.7.7 0 0 1 0 .988L24.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L36.994 21.857a.271.271 0 0 0-.006-.714L20.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                  <path className="three" d="m.154 3.895 3.822-3.756c.195-.192.507-.192.702 0L25.692 20.785a.7.7 0 0 1 0 .988L4.677 42.861a.498.498 0 0 1-.702 0l-3.821-3.754a.271.271 0 0 1 .007-.393L16.994 21.857a.271.271 0 0 0-.006-.714L.155 4.608a.27.27 0 0 1 .002-.713Z" fill="currentColor"/>
                </svg>
              </span>
=======
            <button className="btn-primary" onClick={handleCreate} disabled={nome.trim().length < 2}>
              Criar
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
            </button>
          </>
        )}
      >
        <div className="projetos-form">
          <label className="projetos-label">
            Banner (opcional)
            <input
              className="projetos-file"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (!file.type.startsWith('image/')) {
                  setError('Selecione uma imagem válida')
                  return
                }
                // Limite similar ao profilePhoto (~2MB) para não estourar payload
                if (file.size > 2 * 1024 * 1024) {
                  setError('Banner muito grande. Máximo de 2MB.')
                  return
                }
                const reader = new FileReader()
                reader.onloadend = () => {
                  setPendingBannerSrc(reader.result)
                  setShowCrop(true)
                }
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {bannerUrl && (
            <div className="projetos-banner-preview">
              <img src={bannerUrl} alt="Prévia do banner" />
              <button className="btn-secondary projetos-banner-remove" onClick={() => setBannerUrl('')}>
                Remover
              </button>
            </div>
          )}
          <label className="projetos-label">
            Nome
            <input
              className="projetos-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Projeto Verão"
              maxLength={60}
            />
          </label>
          <label className="projetos-label">
            Descrição (opcional)
            <textarea
              className="projetos-textarea"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Regras rápidas: check-in diário + treino finalizado = pontos"
              maxLength={280}
              rows={4}
            />
          </label>
          <div className="projetos-points-hint">
            Pontuação padrão: <b>Check-in TOTAL = 10</b>, <b>PARCIAL = 5</b>, <b>treino finalizado = 20</b>, <b>incompleto = 10</b>.
          </div>
        </div>
      </Modal>

      <ImageCropModal
        isOpen={showCrop}
        onClose={() => {
          setShowCrop(false)
          setPendingBannerSrc('')
        }}
        imageSrc={pendingBannerSrc}
        title="Ajustar banner do projeto"
        subtitle="Selecione a área que vai aparecer no banner."
        aspect={3 / 1}
        confirmLabel="USAR ESTE BANNER"
        output={{ maxWidth: 1200, mimeType: 'image/jpeg', quality: 0.88 }}
        onConfirm={(dataUrl) => {
          setBannerUrl(dataUrl)
          setShowCrop(false)
          setPendingBannerSrc('')
        }}
      />

      {/* Modal Entrar */}
      <Modal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        title="Entrar em um projeto"
        subtitle="Cole o código de convite (ex.: 6 letras/números)."
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setShowJoin(false)}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleJoin} disabled={codigo.trim().length < 4}>
              Entrar
            </button>
          </>
        )}
      >
        <div className="projetos-form">
          <label className="projetos-label">
            Código
            <input
              className="projetos-input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={12}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}

export default PacienteProjetos


