import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_URL } from '../config/api'
import './BillingSuccess.css'

function BillingSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const checkStatus = async () => {
      if (!sessionId) {
        setError('Sessão não encontrada')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        // Aguardar um pouco para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verificar status da assinatura
        const res = await fetch(`${API_URL}/subscription/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
          const data = await res.json()
          if (data.subscription?.status === 'ACTIVE') {
            // Assinatura ativa, redirecionar para dashboard
            setTimeout(() => {
              navigate('/paciente/dashboard')
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [sessionId, navigate])

  return (
    <div className="billing-success">
      <div className="billing-success-content">
        {loading ? (
          <>
            <div className="success-icon loading">
              <div className="spinner"></div>
            </div>
            <h1>Processando seu pagamento...</h1>
            <p>Aguarde enquanto confirmamos sua assinatura.</p>
          </>
        ) : error ? (
          <>
            <div className="success-icon error">⚠️</div>
            <h1>Erro ao processar pagamento</h1>
            <p>{error}</p>
            <button className="btn cta" onClick={() => navigate('/landing')}>
              Voltar para planos
            </button>
          </>
        ) : (
          <>
            <div className="success-icon">✓</div>
            <h1>Pagamento confirmado!</h1>
            <p>Sua assinatura foi ativada com sucesso. Você já pode usar todos os recursos do GIBA APP.</p>
            <div className="success-actions">
              <button className="btn cta" onClick={() => navigate('/paciente/dashboard')}>
                Ir para Dashboard
              </button>
              <button className="btn outline" onClick={() => navigate('/landing')}>
                Ver planos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BillingSuccess
