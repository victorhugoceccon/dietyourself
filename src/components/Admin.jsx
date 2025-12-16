import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import RoleSelector from './RoleSelector'
import { hasAnyRole } from '../utils/roleUtils'
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

      if (!hasAnyRole(parsedUser, ['ADMIN'])) {
        navigate('/login')
        return
      }

      setUser(parsedUser)
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
      const response = await fetch(`${API_URL}/admin/nutricionistas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNutricionistas(data.nutricionistas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error)
    }
  }

  const loadPersonals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/personals`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPersonals(data.personals || [])
      }
    } catch (error) {
      console.error('Erro ao carregar personal trainers:', error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.role !== 'ALL' && { role: filters.role }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
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
        const data = await response.json()
        setSelectedUser(data)
        setShowUserModal(true)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error)
    }
  }

  const handleEditUser = async (user) => {
    // Carregar detalhes completos do usuário para ter os vínculos
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        // Parse roles se existir
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
        // Se falhar, usar dados básicos
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading && !users.length) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="logo">DietYourself</h1>
            <p className="welcome-text">Painel Administrativo</p>
            <RoleSelector user={user} />
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
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
                style={{ marginRight: '0.5rem' }}
              >
                🔗 Vincular Usuário
              </button>
              <button
                className="btn-create-user"
                onClick={() => setShowCreateModal(true)}
              >
                + Criar Usuário
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Nenhum usuário encontrado</div>
          ) : (
            <>
              <div className="users-table">
                <table>
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
                              className="btn-view"
                              onClick={() => handleViewUser(u.id)}
                              title="Ver detalhes"
                            >
                              👁️
                            </button>
                            <button
                              className="btn-edit"
                              onClick={() => handleEditUser(u)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            {u.id !== user?.id && (
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Deletar"
                              >
                                🗑️
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
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
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
      </main>

      {/* Modal de Detalhes/Edição */}
      {showUserModal && (selectedUser || editingUser) && (
        <div className="modal-overlay" onClick={() => {
          setShowUserModal(false)
          setSelectedUser(null)
          setEditingUser(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuário' : 'Detalhes do Usuário'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                  setEditingUser(null)
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {editingUser ? (
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {['ADMIN', 'NUTRICIONISTA', 'PERSONAL', 'PACIENTE'].map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  
                  {/* Vínculos - para pacientes */}
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
                    <button className="btn-primary" onClick={handleSaveUser}>
                      Salvar
                    </button>
                    <button className="btn-secondary" onClick={handleResetPassword}>
                      Resetar Senha
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setShowUserModal(false)
                        setEditingUser(null)
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="user-details">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Nome:</span>
                    <span className="detail-value">{selectedUser.name || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className={getRoleBadgeClass(selectedUser.role)}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Criado em:</span>
                    <span className="detail-value">
                      {new Date(selectedUser.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {selectedUser._count && (
                    <div className="detail-section">
                      <h4>Estatísticas:</h4>
                      <div className="detail-row">
                        <span className="detail-label">Pacientes (Nutricionista):</span>
                        <span className="detail-value">{selectedUser._count.pacientesNutricionista || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Pacientes (Personal):</span>
                        <span className="detail-value">{selectedUser._count.pacientesPersonal || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Check-ins:</span>
                        <span className="detail-value">{selectedUser._count.dailyCheckIns || 0}</span>
                      </div>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={() => handleEditUser(selectedUser)}>
                      Editar
                    </button>
                    {selectedUser.id !== user?.id && (
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteUser(selectedUser.id)}
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setNewUser({
            email: '',
            password: '',
            name: '',
            role: 'PACIENTE'
          })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Usuário</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewUser({
                    email: '',
                    password: '',
                    name: '',
                    role: 'PACIENTE'
                  })
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>Email: *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label>Nome: *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="form-group">
                  <label>Senha: *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
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
                  <button
                    className="btn-primary"
                    onClick={handleCreateUser}
                    disabled={creating}
                  >
                    {creating ? 'Criando...' : 'Criar Usuário'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewUser({
                        email: '',
                        password: '',
                        name: '',
                        role: 'PACIENTE'
                      })
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vincular Usuário */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => {
          setShowLinkModal(false)
          setLinkUserData({
            userId: '',
            nutricionistaId: '',
            personalId: ''
          })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vincular Usuário Existente</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowLinkModal(false)
                  setLinkUserData({
                    userId: '',
                    nutricionistaId: '',
                    personalId: ''
                  })
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Usuário (Paciente/Aluno):</label>
                <select
                  value={linkUserData.userId}
                  onChange={(e) => setLinkUserData({ ...linkUserData, userId: e.target.value })}
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
                <button className="btn-primary" onClick={handleLinkUser}>
                  Vincular
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowLinkModal(false)
                    setLinkUserData({
                      userId: '',
                      nutricionistaId: '',
                      personalId: ''
                    })
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin

