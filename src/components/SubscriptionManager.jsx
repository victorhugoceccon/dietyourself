import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './SubscriptionManager.css'

function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    plan: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStats()
    loadSubscriptions()
  }, [filters, pagination.page])

  const getToken = () => localStorage.getItem('token')

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/subscription/admin/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.plan && { plan: filters.plan })
      })

      const response = await fetch(`${API_URL}/subscription/admin/list?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExtendTrial = async (userId, days = 7) => {
    try {
      setSaving(true)
      const response = await fetch(`${API_URL}/subscription/admin/extend-trial/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ days })
      })

      if (response.ok) {
        await loadSubscriptions()
        await loadStats()
        alert(`Trial estendido por ${days} dias!`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao estender trial')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao estender trial')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (userId, plan = 'MONTHLY') => {
    try {
      setSaving(true)
      const response = await fetch(`${API_URL}/subscription/admin/activate/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ plan })
      })

      if (response.ok) {
        await loadSubscriptions()
        await loadStats()
        alert('Assinatura ativada!')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao ativar assinatura')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao ativar assinatura')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (userId) => {
    if (!confirm('Tem certeza que deseja cancelar esta assinatura?')) return

    try {
      setSaving(true)
      const response = await fetch(`${API_URL}/subscription/admin/cancel/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ reason: 'Cancelado pelo administrador' })
      })

      if (response.ok) {
        await loadSubscriptions()
        await loadStats()
        alert('Assinatura cancelada!')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao cancelar assinatura')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cancelar assinatura')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status, isActive) => {
    const badges = {
      TRIAL: { label: 'Trial', className: 'badge-trial' },
      ACTIVE: { label: 'Ativo', className: 'badge-active' },
      EXPIRED: { label: 'Expirado', className: 'badge-expired' },
      CANCELLED: { label: 'Cancelado', className: 'badge-cancelled' },
      SUSPENDED: { label: 'Suspenso', className: 'badge-suspended' }
    }
    const badge = badges[status] || { label: status, className: '' }
    return (
      <span className={`subscription-badge ${badge.className} ${!isActive ? 'inactive' : ''}`}>
        {badge.label}
      </span>
    )
  }

  const getPlanLabel = (plan) => {
    const plans = {
      FREE_TRIAL: 'Trial Grátis',
      MONTHLY: 'Mensal',
      YEARLY: 'Anual',
      LIFETIME: 'Vitalício'
    }
    return plans[plan] || plan
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="subscription-manager">
      <h2>Gerenciamento de Assinaturas</h2>

      {/* Stats Cards */}
      {stats && (
        <div className="subscription-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total Usuários</span>
          </div>
          <div className="stat-card stat-trial">
            <span className="stat-value">{stats.activeTrials}</span>
            <span className="stat-label">Trials Ativos</span>
          </div>
          <div className="stat-card stat-active">
            <span className="stat-value">{stats.activePaid}</span>
            <span className="stat-label">Assinaturas Ativas</span>
          </div>
          <div className="stat-card stat-expired">
            <span className="stat-value">{stats.expiredTrials}</span>
            <span className="stat-label">Expirados</span>
          </div>
          <div className="stat-card stat-warning">
            <span className="stat-value">{stats.expiringTrials}</span>
            <span className="stat-label">Expirando (3 dias)</span>
          </div>
          <div className="stat-card stat-conversion">
            <span className="stat-value">{stats.conversionRate}%</span>
            <span className="stat-label">Conversão</span>
          </div>
          <div className="stat-card stat-revenue">
            <span className="stat-value">R$ {stats.monthlyRevenueBRL}</span>
            <span className="stat-label">Receita (estimada)</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="subscription-filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">Todos os status</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Ativo</option>
          <option value="EXPIRED">Expirado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>

        <select
          value={filters.plan}
          onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value }))}
        >
          <option value="">Todos os planos</option>
          <option value="FREE_TRIAL">Trial Grátis</option>
          <option value="MONTHLY">Mensal</option>
          <option value="YEARLY">Anual</option>
          <option value="LIFETIME">Vitalício</option>
        </select>

        <button onClick={loadSubscriptions} className="btn-refresh">
          Atualizar
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <div className="subscription-table-wrapper">
          <table className="subscription-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Dias Restantes</th>
                <th>Expira em</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className={!sub.isActive ? 'inactive' : ''}>
                  <td>
                    <div className="user-info">
                      <strong>{sub.user?.name || 'Sem nome'}</strong>
                      <span>{sub.user?.email}</span>
                    </div>
                  </td>
                  <td>{getPlanLabel(sub.plan)}</td>
                  <td>{getStatusBadge(sub.status, sub.isActive)}</td>
                  <td>
                    {sub.daysRemaining !== null ? (
                      <span className={sub.daysRemaining <= 3 ? 'expiring-soon' : ''}>
                        {sub.daysRemaining} dias
                      </span>
                    ) : '-'}
                  </td>
                  <td>{formatDate(sub.trialEndDate || sub.endDate)}</td>
                  <td>{formatDate(sub.createdAt)}</td>
                  <td className="actions">
                    {sub.status === 'TRIAL' && (
                      <button
                        onClick={() => handleExtendTrial(sub.userId)}
                        className="btn-action btn-extend"
                        disabled={saving}
                        title="Estender trial por 7 dias"
                      >
                        +7 dias
                      </button>
                    )}
                    {['TRIAL', 'EXPIRED'].includes(sub.status) && (
                      <button
                        onClick={() => handleActivate(sub.userId)}
                        className="btn-action btn-activate"
                        disabled={saving}
                        title="Ativar assinatura mensal"
                      >
                        Ativar
                      </button>
                    )}
                    {['TRIAL', 'ACTIVE'].includes(sub.status) && (
                      <button
                        onClick={() => handleCancel(sub.userId)}
                        className="btn-action btn-cancel"
                        disabled={saving}
                        title="Cancelar assinatura"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
          >
            Anterior
          </button>
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}

export default SubscriptionManager
