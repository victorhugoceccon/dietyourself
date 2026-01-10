import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import ProfessionalLayout from './ProfessionalLayout'
import LoadingBar from './LoadingBar'
import SubscriptionManager from './SubscriptionManager'
import './Admin.css'

function Admin() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'subscriptions'
  const [linkUserData, setLinkUserData] = useState({
    userId: '',
    nutricionistaId: '',
    personalId: ''
  })
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'PACIENTE'
  })
  const [creating, setCreating] = useState(false)
  const [nutricionistas, setNutricionistas] = useState([])
  const [personals, setPersonals] = useState([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [filters, setFilters] = useState({
    role: 'ALL',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadStats()
      loadUsers()
      loadNutricionistas()
      loadPersonals()
    }
  }, [user, filters, pagination.page])

  const checkAuth = () => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!token || !userData) {
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (!parsedUser.roles || (!parsedUser.roles.includes('ADMIN') && parsedUser.role !== 'ADMIN')) {
        navigate('/login')
        return
      }
      setUser(parsedUser)
      setLoading(false)
    } catch (error) {
      navigate('/login')
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadNutricionistas = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users?role=NUTRICIONISTA&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNutricionistas(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error)
    }
  }

  const loadPersonals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users?role=PERSONAL&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPersonals(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar personais:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.role !== 'ALL') {
        params.append('role', filters.role)
      }

      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setSelectedUser(userData)
        setEditingUser(null)
        setShowUserModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error)
    }
  }

  const handleEditUser = async (user) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        let roles = null
        if (userData.roles) {
          try {
            roles = typeof userData.roles === 'string' ? JSON.parse(userData.roles) : userData.roles
          } catch (e) {
            console.warn('Erro ao parsear roles:', e)
          }
        }

        setEditingUser({
          ...userData,
          roles: roles || [],
          nutricionistaId: userData.nutricionistaId || '',
          personalId: userData.personalId || ''
        })
        setShowUserModal(true)
      } else {
        setEditingUser({ ...user })
        setShowUserModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error)
      setEditingUser({ ...user })
      setShowUserModal(true)
    }
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: editingUser.role,
          roles: editingUser.roles || [],
          name: editingUser.name,
          email: editingUser.email,
          nutricionistaId: editingUser.nutricionistaId || null,
          personalId: editingUser.personalId || null
        })
      })

      if (response.ok) {
        setShowUserModal(false)
        setEditingUser(null)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadUsers()
        loadStats()
        if (showUserModal) {
          setShowUserModal(false)
          setSelectedUser(null)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao deletar usuário')
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      alert('Erro ao deletar usuário')
    }
  }

  const handleResetPassword = async () => {
    if (!editingUser) return

    const newPassword = prompt('Digite a nova senha (mínimo 6 caracteres):')
    if (!newPassword || newPassword.length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${editingUser.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      })

      if (response.ok) {
        alert('Senha resetada com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao resetar senha')
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      alert('Erro ao resetar senha')
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (newUser.password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewUser({
          email: '',
          password: '',
          name: '',
          role: 'PACIENTE'
        })
        loadUsers()
        loadStats()
        alert('Usuário criado com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  const handleLinkUser = async () => {
    if (!linkUserData.userId) {
      alert('Selecione um usuário')
      return
    }

    setLoadingLinks(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${linkUserData.userId}/link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nutricionistaId: linkUserData.nutricionistaId || null,
          personalId: linkUserData.personalId || null
        })
      })

      if (response.ok) {
        setShowLinkModal(false)
        setLinkUserData({
          userId: '',
          nutricionistaId: '',
          personalId: ''
        })
        loadUsers()
        loadStats()
        alert('Usuário vinculado com sucesso!')
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao vincular usuário')
      }
    } catch (error) {
      console.error('Erro ao vincular usuário:', error)
      alert('Erro ao vincular usuário')
    } finally {
      setLoadingLinks(false)
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge admin'
      case 'NUTRICIONISTA':
        return 'role-badge nutricionista'
      case 'PERSONAL':
        return 'role-badge personal'
      case 'PACIENTE':
        return 'role-badge paciente'
      default:
        return 'role-badge'
    }
  }

  if (loading && !users.length) {
    return (
      <ProfessionalLayout allowedRoles={['ADMIN']}>
        <LoadingBar message="Carregando..." />
      </ProfessionalLayout>
    )
  }

  return (
    <ProfessionalLayout allowedRoles={['ADMIN']}>
      <div className="admin-content-wrapper">
        {/* Tabs de navegação */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuários
          </button>
          <button
            className={`admin-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            💳 Assinaturas
          </button>
        </div>

        {/* Tab de Assinaturas */}
        {activeTab === 'subscriptions' && <SubscriptionManager />}

        {/* Tab de Usuários */}
        {activeTab === 'users' && (
          <>
            {/* Estatísticas */}
        {stats && (
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total de Usuários</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.usersByRole?.NUTRICIONISTA || 0}</div>
                <div className="stat-label">Nutricionistas</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-content">
                <div className="stat-value">{stats.usersByRole?.PERSONAL || 0}</div>
                <div className="stat-label">Personal Trainers</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{stats.usersByRole?.PACIENTE || 0}</div>
                <div className="stat-label">Pacientes</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="role-filter">Filtrar por Role:</label>
            <select
              id="role-filter"
              value={filters.role}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            >
              <option value="ALL">Todas</option>
              <option value="ADMIN">Admin</option>
              <option value="NUTRICIONISTA">Nutricionista</option>
              <option value="PERSONAL">Personal</option>
              <option value="PACIENTE">Paciente</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="search-filter">Buscar:</label>
            <input
              id="search-filter"
              type="text"
              placeholder="Email ou nome..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="users-section">
          <div className="section-header">
            <h2>Usuários</h2>
            <div className="section-header-right">
              <span className="users-count">
                {pagination.total} {pagination.total === 1 ? 'usuário' : 'usuários'}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setShowLinkModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Vincular
              </button>
              <button
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5V19M5 12H19" strokeLinecap="round"/>
                </svg>
                Criar Usuário
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <LoadingBar message="Carregando usuários..." />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" strokeLinecap="round"/>
              </svg>
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nome</th>
                      <th>Role</th>
                      <th>Criado em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.name || '-'}</td>
                        <td>
                          <span className={getRoleBadgeClass(u.role)}>
                            {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleViewUser(u.id)}
                              title="Ver detalhes"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEditUser(u)}
                              title="Editar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            {u.id !== user?.id && (
                              <button
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Deletar"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </button>
                  <span className="pagination-info">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}

        {/* Modais globais */}
        {showUserModal && (selectedUser || editingUser) && (
          <UserModal
            user={editingUser || selectedUser}
            isEditing={!!editingUser}
            onClose={() => {
              setShowUserModal(false)
              setSelectedUser(null)
              setEditingUser(null)
            }}
            onSave={handleSaveUser}
            onResetPassword={handleResetPassword}
            onDelete={handleDeleteUser}
            onEdit={() => handleEditUser(selectedUser)}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            nutricionistas={nutricionistas}
            personals={personals}
            currentUserId={user?.id}
          />
        )}

        {showCreateModal && (
          <CreateUserModal
            newUser={newUser}
            setNewUser={setNewUser}
            creating={creating}
            onClose={() => {
              setShowCreateModal(false)
              setNewUser({
                email: '',
                password: '',
                name: '',
                role: 'PACIENTE'
              })
            }}
            onSubmit={handleCreateUser}
          />
        )}

        {showLinkModal && (
          <LinkUserModal
            linkUserData={linkUserData}
            setLinkUserData={setLinkUserData}
            users={users}
            nutricionistas={nutricionistas}
            personals={personals}
            loading={loadingLinks}
            onClose={() => {
              setShowLinkModal(false)
              setLinkUserData({
                userId: '',
                nutricionistaId: '',
                personalId: ''
              })
            }}
            onSubmit={handleLinkUser}
          />
        )}
      </div>
    </ProfessionalLayout>
  )
}

// Componente Modal de Usuário
function UserModal({ user, isEditing, onClose, onSave, onResetPassword, onDelete, onEdit, editingUser, setEditingUser, nutricionistas, personals, currentUserId }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Usuário' : 'Detalhes do Usuário'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nome:</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role Principal:</label>
                <select
                  value={editingUser.role || 'PACIENTE'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="NUTRICIONISTA">Nutricionista</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="PACIENTE">Paciente</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Roles Múltiplas:</label>
                <div className="checkbox-group">
                  {['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE'].map(role => (
                    <label key={role} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(editingUser.roles || []).includes(role)}
                        onChange={(e) => {
                          const currentRoles = editingUser.roles || []
                          if (e.target.checked) {
                            setEditingUser({ ...editingUser, roles: [...currentRoles, role] })
                          } else {
                            setEditingUser({ ...editingUser, roles: currentRoles.filter(r => r !== role) })
                          }
                        }}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {(editingUser.role === 'PACIENTE' || (editingUser.roles || []).includes('PACIENTE')) && (
                <>
                  <div className="form-group">
                    <label>Nutricionista:</label>
                    <select
                      value={editingUser.nutricionistaId || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, nutricionistaId: e.target.value || null })}
                    >
                      <option value="">Nenhum</option>
                      {nutricionistas.map(nutri => (
                        <option key={nutri.id} value={nutri.id}>
                          {nutri.name || nutri.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Personal Trainer:</label>
                    <select
                      value={editingUser.personalId || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, personalId: e.target.value || null })}
                    >
                      <option value="">Nenhum</option>
                      {personals.map(personal => (
                        <option key={personal.id} value={personal.id}>
                          {personal.name || personal.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="form-actions">
                <button className="btn-primary" onClick={onSave}>
                  Salvar
                </button>
                <button className="btn-secondary" onClick={onResetPassword}>
                  Resetar Senha
                </button>
                <button className="btn-cancel" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Nome:</span>
                <span className="detail-value">{user.name || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className={`role-badge ${user.role?.toLowerCase()}`}>
                  {user.role}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Criado em:</span>
                <span className="detail-value">
                  {new Date(user.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              {user._count && (
                <div className="detail-section">
                  <h4>Estatísticas:</h4>
                  <div className="detail-row">
                    <span className="detail-label">Pacientes (Nutricionista):</span>
                    <span className="detail-value">{user._count.pacientesNutricionista || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Pacientes (Personal):</span>
                    <span className="detail-value">{user._count.pacientesPersonal || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Check-ins:</span>
                    <span className="detail-value">{user._count.dailyCheckIns || 0}</span>
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button className="btn-primary" onClick={onEdit}>
                  Editar
                </button>
                {user.id !== currentUserId && (
                  <button className="btn-danger" onClick={() => {
                    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
                      onDelete(user.id)
                      onClose()
                    }
                  }}>
                    Deletar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Criação
function CreateUserModal({ newUser, setNewUser, creating, onClose, onSubmit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Novo Usuário</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="edit-form">
            <div className="form-group">
              <label>Email: *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Nome: *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="form-group">
              <label>Senha: *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Role: *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="PACIENTE">Paciente</option>
                <option value="NUTRICIONISTA">Nutricionista</option>
                <option value="PERSONAL">Personal Trainer</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Criando...' : 'Criar Usuário'}
              </button>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={creating}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Vincular
function LinkUserModal({ linkUserData, setLinkUserData, users, nutricionistas, personals, loading, onClose, onSubmit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vincular Usuário Existente</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="edit-form">
            <div className="form-group">
              <label>Usuário (Paciente/Aluno):</label>
              <select
                value={linkUserData.userId}
                onChange={(e) => setLinkUserData({ ...linkUserData, userId: e.target.value })}
                required
              >
                <option value="">Selecione um usuário</option>
                {users.filter(u => u.role === 'PACIENTE').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nutricionista:</label>
              <select
                value={linkUserData.nutricionistaId}
                onChange={(e) => setLinkUserData({ ...linkUserData, nutricionistaId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {nutricionistas.map(nutri => (
                  <option key={nutri.id} value={nutri.id}>
                    {nutri.name || nutri.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Personal Trainer:</label>
              <select
                value={linkUserData.personalId}
                onChange={(e) => setLinkUserData({ ...linkUserData, personalId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {personals.map(personal => (
                  <option key={personal.id} value={personal.id}>
                    {personal.name || personal.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Vinculando...' : 'Vincular'}
              </button>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Admin
