import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './SubscriptionStatus.css'

function SubscriptionStatus({ showBanner = true }) {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadSubscriptionStatus()
  }, [])

  const loadSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Erro ao carregar status da assinatura:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription || dismissed) return null

  // Não mostrar banner para assinaturas ativas com mais de 3 dias
  if (subscription.isActive && subscription.daysRemaining > 3) return null

  // Banner de trial expirando
  if (subscription.isTrial && subscription.daysRemaining <= 3 && showBanner) {
    return (
      <div className={`subscription-banner ${subscription.daysRemaining <= 1 ? 'urgent' : 'warning'}`}>
        <div className="banner-content">
          <span className="banner-icon">⏰</span>
          <div className="banner-text">
            {subscription.daysRemaining === 0 ? (
              <strong>Seu período de teste expira hoje!</strong>
            ) : subscription.daysRemaining === 1 ? (
              <strong>Seu período de teste expira amanhã!</strong>
            ) : (
              <strong>Seu período de teste expira em {subscription.daysRemaining} dias</strong>
            )}
            <span>Assine agora para continuar usando o GIBA APP</span>
          </div>
        </div>
        <div className="banner-actions">
          <button className="btn-subscribe" onClick={() => navigate('/assinar')}>
            Assinar Agora
          </button>
          <button className="btn-dismiss" onClick={() => setDismissed(true)}>
            ✕
          </button>
        </div>
      </div>
    )
  }

  // Banner de assinatura expirada
  if (!subscription.isActive) {
    return (
      <div className="subscription-banner expired">
        <div className="banner-content">
          <span className="banner-icon">🔒</span>
          <div className="banner-text">
            <strong>
              {subscription.status === 'EXPIRED' 
                ? 'Seu período de teste expirou' 
                : 'Sua assinatura está inativa'}
            </strong>
            <span>Assine para desbloquear todos os recursos do GIBA APP</span>
          </div>
        </div>
        <div className="banner-actions">
          <button className="btn-subscribe" onClick={() => navigate('/assinar')}>
            Assinar Agora
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Widget compacto para exibir em sidebars/dashboards
export function SubscriptionWidget() {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`${API_URL}/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          setSubscription(data.subscription)
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  if (loading || !subscription) return null

  const getPlanLabel = () => {
    const labels = {
      FREE_TRIAL: 'Trial Grátis',
      MONTHLY: 'Plano Mensal',
      YEARLY: 'Plano Anual',
      LIFETIME: 'Plano Vitalício'
    }
    return labels[subscription.plan] || subscription.plan
  }

  return (
    <div className={`subscription-widget ${subscription.isActive ? 'active' : 'inactive'}`}>
      <div className="widget-header">
        <span className="widget-icon">
          {subscription.isActive ? '✓' : '⚠'}
        </span>
        <span className="widget-label">{getPlanLabel()}</span>
      </div>
      
      {subscription.isTrial && subscription.daysRemaining !== null && (
        <div className="widget-trial-info">
          <div className="trial-progress">
            <div 
              className="trial-progress-bar" 
              style={{ width: `${Math.max(0, (subscription.daysRemaining / 7) * 100)}%` }}
            />
          </div>
          <span className="trial-days">
            {subscription.daysRemaining} dias restantes
          </span>
        </div>
      )}

      {!subscription.isActive && (
        <button className="widget-cta" onClick={() => navigate('/assinar')}>
          Assinar
        </button>
      )}
    </div>
  )
}

export default SubscriptionStatus
