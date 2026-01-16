import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../config/api'
import './ConviteProjeto.css'

function ConviteProjeto() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [grupo, setGrupo] = useState(null)
  const [error, setError] = useState('')
  
  // Estado para formulário de guest
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPassword, setGuestPassword] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')
  
  // Estado para entrar no grupo (usuário logado)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadGroupInfo()
  }, [codigo])

  const loadGroupInfo = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Buscar informações públicas do grupo
      const res = await fetch(`${API_URL}/groups/public/${codigo}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data?.error || 'Projeto não encontrado')
      }
      
      setGrupo(data.grupo)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinAsLoggedUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { state: { returnTo: `/convite/${codigo}` } })
      return
    }

    setJoining(true)
    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ codigo })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (data.error === 'Você já está neste grupo') {
          // Redirecionar direto para o grupo
          navigate(`/paciente/projetos/${data.grupoId || grupo.id}`)
          return
        }
        throw new Error(data?.error || 'Erro ao entrar no projeto')
      }
      
      navigate(`/paciente/projetos/${data.grupoId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setJoining(false)
    }
  }

  const handleGuestRegister = async (e) => {
    e.preventDefault()
    
    if (!guestName.trim() || !guestEmail.trim() || !guestPassword.trim()) {
      setRegisterError('Preencha todos os campos')
      return
    }
    
    if (guestPassword.length < 6) {
      setRegisterError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setRegistering(true)
    setRegisterError('')
    
    try {
      // Registrar usuário guest
      const res = await fetch(`${API_URL}/auth/register-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim().toLowerCase(),
          password: guestPassword,
          codigoConvite: codigo
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao criar conta')
      }
      
      // Salvar token e usuário
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Redirecionar para o projeto
      navigate(`/paciente/projetos/${data.grupoId}`)
    } catch (e) {
      setRegisterError(e.message)
    } finally {
      setRegistering(false)
    }
  }

  const isLoggedIn = !!localStorage.getItem('token')

  if (loading) {
    return (
      <div className="convite-page">
        <div className="convite-loading">
          <div className="convite-loading-spinner"></div>
          <p>Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error && !grupo) {
    return (
      <div className="convite-page">
        <div className="convite-error">
          <span className="convite-error-icon">😕</span>
          <h2>Convite inválido</h2>
          <p>{error}</p>
          <p className="convite-error-hint">
            O código pode estar incorreto ou o projeto não existe mais.
          </p>
          <Link to="/login" className="convite-btn-primary">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="convite-page">
      {/* Header */}
      <div className="convite-header">
        <div className="convite-logo">
          <span>🏆</span>
          <span>GIBA</span>
        </div>
      </div>

      {/* Hero do projeto */}
      <div className="convite-hero">
        {grupo?.bannerUrl && (
          <img src={grupo.bannerUrl} alt="" className="convite-hero-bg" />
        )}
        <div className="convite-hero-overlay"></div>
        
        <div className="convite-hero-content">
          <span className="convite-hero-badge">Convite para projeto</span>
          <h1 className="convite-hero-title">{grupo?.nome}</h1>
          {grupo?.descricao && (
            <p className="convite-hero-desc">{grupo.descricao}</p>
          )}
          <div className="convite-hero-stats">
            <div className="convite-stat">
              <span className="convite-stat-value">{grupo?.membrosCount || 0}</span>
              <span className="convite-stat-label">participantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="convite-content">
        {error && (
          <div className="convite-error-msg">{error}</div>
        )}

        {!showGuestForm ? (
          <>
            {/* Opção: Usuário já logado */}
            {isLoggedIn ? (
              <section className="convite-section">
                <h2>Você foi convidado!</h2>
                <p>Clique no botão abaixo para entrar neste projeto.</p>
                
                <button 
                  className="convite-btn-primary large"
                  onClick={handleJoinAsLoggedUser}
                  disabled={joining}
                >
                  {joining ? 'Entrando...' : 'Entrar no projeto'}
                </button>
              </section>
            ) : (
              <>
                {/* Opção: Criar conta para participar */}
                <section className="convite-section">
                  <h2>Participe deste desafio!</h2>
                  <p>
                    Crie uma conta gratuita para entrar no projeto e acompanhar o ranking.
                  </p>
                  
                  <button 
                    className="convite-btn-primary large"
                    onClick={() => setShowGuestForm(true)}
                  >
                    Criar conta e entrar
                  </button>
                </section>

                {/* Já tem conta? */}
                <section className="convite-section">
                  <div className="convite-divider">
                    <span>ou</span>
                  </div>
                  
                  <p className="convite-alt-text">
                    Já tem uma conta no GIBA?
                  </p>
                  <Link 
                    to={`/login?returnTo=/convite/${codigo}`}
                    className="convite-btn-secondary"
                  >
                    Fazer login
                  </Link>
                </section>
              </>
            )}
          </>
        ) : (
          /* Formulário de registro guest */
          <section className="convite-section">
            <h2>Crie sua conta</h2>
            <p>Preencha os dados abaixo para participar do projeto.</p>
            
            {registerError && (
              <div className="convite-error-msg">{registerError}</div>
            )}
            
            <form onSubmit={handleGuestRegister} className="convite-form">
              <div className="convite-form-group">
                <label>Seu nome</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Como você quer ser chamado"
                  maxLength={50}
                  required
                />
              </div>
              
              <div className="convite-form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div className="convite-form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="convite-btn-primary large"
                disabled={registering}
              >
                {registering ? 'Criando conta...' : 'Criar conta e entrar'}
              </button>
            </form>
            
            <button 
              className="convite-btn-link"
              onClick={() => setShowGuestForm(false)}
            >
              ← Voltar
            </button>
          </section>
        )}

        {/* Info sobre conta guest */}
        {!isLoggedIn && (
          <section className="convite-info">
            <div className="convite-info-card">
              <span className="convite-info-icon">ℹ️</span>
              <div>
                <h4>Conta de participante</h4>
                <p>
                  Com esta conta você terá acesso apenas aos projetos que participar. 
                  Para ter acesso completo ao GIBA (dieta, treino, etc), você pode assinar depois.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ConviteProjeto
