import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleRedirect } from '../utils/roleRedirect'
import './Login.css'

const API_URL = 'http://localhost:5000/api/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`
      const body = isLogin 
        ? { email, password }
        : { email, password, name: name || undefined }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      // Salvar token no localStorage
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      setSuccess(isLogin ? 'Login realizado com sucesso!' : 'Conta criada com sucesso!')
      
      // Redirecionar baseado na role do usuário
      setTimeout(() => {
        const userRole = data.user?.role || 'PACIENTE'
        console.log('Role do usuário:', userRole)
        const redirectPath = getRoleRedirect(userRole)
        console.log('Redirecionando para:', redirectPath)
        navigate(redirectPath, { replace: true })
      }, 1000)

    } catch (err) {
      console.error('Erro no login:', err)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Erro de conexão. Verifique se o servidor está rodando em http://localhost:5000')
      } else {
        setError(err.message || 'Erro ao processar solicitação')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (isLoginTab) => {
    setIsLogin(isLoginTab)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" fill="url(#gradient)" />
                <path d="M20 30L27 37L40 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="60" y2="60">
                    <stop offset="0%" stopColor="#4CAF50" />
                    <stop offset="100%" stopColor="#8BC34A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="logo-text">DietYourself</h1>
            <p className="logo-subtitle">Sua jornada para uma vida saudável</p>
          </div>

          <div className="login-tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => handleTabChange(true)}
              disabled={loading}
            >
              Entrar
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => handleTabChange(false)}
              disabled={loading}
            >
              Registrar
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Nome (opcional)</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              {!isLogin && (
                <small className="form-hint">Mínimo de 6 caracteres</small>
              )}
            </div>

            {isLogin && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Lembrar-me</span>
                </label>
                <a href="#" className="forgot-password">Esqueceu a senha?</a>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>

            {!isLogin && (
              <p className="terms">
                Ao criar uma conta, você concorda com nossos{' '}
                <a href="#">Termos de Uso</a> e{' '}
                <a href="#">Política de Privacidade</a>
              </p>
            )}
          </form>

          <div className="divider">
            <span>ou</span>
          </div>

          <div className="social-login">
            <button 
              type="button"
              className="social-button google"
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
