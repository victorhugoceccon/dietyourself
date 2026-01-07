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
            <button className="btn-primary" onClick={handleCreate} disabled={nome.trim().length < 2}>
              Criar
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


