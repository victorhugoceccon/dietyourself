import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleRedirect } from '../utils/roleRedirect'
import { AUTH_API_URL } from '../config/api'
import ThemeToggle from './ThemeToggle'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

<<<<<<< HEAD
      // Verificar se a resposta é JSON válido
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('Erro ao parsear JSON:', jsonError)
          throw new Error('Resposta inválida do servidor')
        }
      } else {
        const text = await response.text()
        throw new Error(text || `Erro ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Erro ${response.status}: ${response.statusText}`)
=======
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      }

      // Salvar token no localStorage
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      setSuccess('Login realizado com sucesso!')
      
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
<<<<<<< HEAD
      if (err.message === 'Failed to fetch' || err.name === 'TypeError' || err.message.includes('fetch')) {
        setError('Erro de conexão. Verifique se o servidor está acessível.')
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Erro ao processar solicitação. Tente novamente.')
=======
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Erro de conexão. Verifique se o servidor está acessível.')
      } else {
        setError(err.message || 'Erro ao processar solicitação')
>>>>>>> 974b9cadf6720b9d883b748232be2a53545f282e
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      setResetSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
      setTimeout(() => {
        setShowPasswordReset(false)
        setResetEmail('')
      }, 3000)

    } catch (err) {
      console.error('Erro ao solicitar reset:', err)
      setResetError(err.message || 'Erro ao enviar email de recuperação')
    } finally {
      setResetLoading(false)
    }
  }


  return (
    <div className="login-container">
      <div className="login-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-theme-toggle">
        <ThemeToggle />
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
            <h1 className="logo-text">LifeFit</h1>
            <p className="logo-subtitle">Seu corpo, no seu ritmo</p>
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
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Lembrar-me</span>
              </label>
              <button 
                type="button"
                className="forgot-password"
                onClick={() => setShowPasswordReset(true)}
              >
                Esqueceu a senha?
              </button>
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      {showPasswordReset && (
        <div className="password-reset-modal" onClick={() => setShowPasswordReset(false)}>
          <div className="password-reset-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-reset-modal-header">
              <h2>Recuperar Senha</h2>
              <p>Digite seu email para receber instruções de recuperação</p>
            </div>

            {resetError && (
              <div className="alert alert-error">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="alert alert-success">
                {resetSuccess}
              </div>
            )}

            <form className="password-reset-form" onSubmit={handlePasswordResetRequest}>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input
                  type="email"
                  id="reset-email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={resetLoading}
                />
              </div>

              <div className="password-reset-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPasswordReset(false)
                    setResetEmail('')
                    setResetError('')
                    setResetSuccess('')
                  }}
                  disabled={resetLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
