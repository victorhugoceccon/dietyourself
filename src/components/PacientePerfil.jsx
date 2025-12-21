import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import './PacientePerfil.css'

function PacientePerfil() {
  const [user, setUser] = useState(null)
  const [questionnaireData, setQuestionnaireData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingQuestionnaire, setEditingQuestionnaire] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [questionnaireForm, setQuestionnaireForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [hasDiet, setHasDiet] = useState(false)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setProfileForm({
          name: userData.name || '',
          email: userData.email || ''
        })
      }

      // Carregar questionário
      const questionnaireResponse = await fetch(`${API_URL}/questionnaire/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (questionnaireResponse.ok) {
        const data = await questionnaireResponse.json()
        if (data.hasCompleted && data.data) {
          setQuestionnaireData(data.data)
          // Parse alimentosDoDiaADia se for string
          if (data.data.alimentosDoDiaADia && typeof data.data.alimentosDoDiaADia === 'string') {
            try {
              data.data.alimentosDoDiaADia = JSON.parse(data.data.alimentosDoDiaADia)
            } catch (e) {
              data.data.alimentosDoDiaADia = { carboidratos: [], proteinas: [], gorduras: [], frutas: [] }
            }
          }
        }
      }

      // Verificar se tem dieta
      const dietResponse = await fetch(`${API_URL}/diet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dietResponse.ok) {
        const dietData = await dietResponse.json()
        setHasDiet(!!dietData.dieta)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileForm.name
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar localStorage
        const updatedUser = { ...user, name: data.user?.name || profileForm.name }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setEditingProfile(false)
        alert('Perfil atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao salvar perfil')
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleResetDietAndQuestionnaire = async () => {
    if (!confirm('Tem certeza que deseja resetar sua dieta e questionário? Esta ação não pode ser desfeita e você precisará preencher o questionário novamente.')) {
      return
    }

    setResetting(true)
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/user/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        alert('Dieta e questionário resetados com sucesso! Você será redirecionado para preencher o questionário novamente.')
        // Limpar dados locais
        setQuestionnaireData(null)
        setHasDiet(false)
        // Recarregar página para forçar preenchimento do questionário
        window.location.href = '/paciente/dashboard'
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao resetar')
      }
    } catch (error) {
      console.error('Erro ao resetar:', error)
      alert('Erro ao resetar dieta e questionário')
    } finally {
      setResetting(false)
    }
  }

  const formatAlimentos = (alimentos) => {
    if (!alimentos || (Array.isArray(alimentos) && alimentos.length === 0)) {
      return 'Nenhum selecionado'
    }
    if (Array.isArray(alimentos)) {
      return alimentos.join(', ')
    }
    return 'Nenhum selecionado'
  }

  if (loading) {
    return (
      <div className="paciente-perfil">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="paciente-perfil">
      <div className="perfil-container">
        {/* Seção de Informações Básicas */}
        <section className="perfil-section">
          <div className="section-header">
            <h2>Informações Básicas</h2>
            <button
              className="edit-btn"
              onClick={() => setEditingProfile(!editingProfile)}
            >
              {editingProfile ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editingProfile ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="disabled-input"
                />
                <small>O email não pode ser alterado</small>
              </div>
              <div className="form-actions">
                <button
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <div className="info-item">
                <span className="info-label">Nome:</span>
                <span className="info-value">{user?.name || 'Não informado'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>
          )}
        </section>

        {/* Seção de Questionário */}
        <section className="perfil-section">
          <div className="section-header">
            <h2>Questionário de Perfil</h2>
            {questionnaireData && (
              <span className="status-badge completed">Completo</span>
            )}
          </div>

          {questionnaireData ? (
            <div className="questionnaire-summary">
              <p className="summary-text">
                Seu questionário foi preenchido com sucesso. Clique no botão abaixo para visualizar todas as suas respostas.
              </p>
              <button
                className="view-questionnaire-btn"
                onClick={() => setShowQuestionnaireModal(true)}
              >
                Ver Questionário Completo
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhum questionário preenchido ainda.</p>
              <p className="hint">Preencha o questionário para começar a usar o sistema.</p>
            </div>
          )}
        </section>

        {/* Modal do Questionário */}
        {showQuestionnaireModal && questionnaireData && (
          <div className="questionnaire-modal-overlay" onClick={() => setShowQuestionnaireModal(false)}>
            <div className="questionnaire-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="questionnaire-modal-header">
                <h2>Seu Questionário</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowQuestionnaireModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="questionnaire-modal-body">
                {/* Bloco 1: Dados Básicos */}
                <div className="questionnaire-block">
                  <h3 className="block-title">📋 Dados Básicos</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Idade:</span>
                      <span className="question-value">{questionnaireData.idade} anos</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Sexo:</span>
                      <span className="question-value">{questionnaireData.sexo}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Altura:</span>
                      <span className="question-value">{questionnaireData.altura} cm</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Peso Atual:</span>
                      <span className="question-value">{questionnaireData.pesoAtual} kg</span>
                    </div>
                    <div className="questionnaire-item full-width">
                      <span className="question-label">Objetivo:</span>
                      <span className="question-value">{questionnaireData.objetivo}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Rotina e Atividade */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🏃 Rotina e Atividade</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Frequência de Atividade:</span>
                      <span className="question-value">{questionnaireData.frequenciaAtividade}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Tipo de Atividade:</span>
                      <span className="question-value">{questionnaireData.tipoAtividade}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Horário de Treino:</span>
                      <span className="question-value">{questionnaireData.horarioTreino}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Rotina Diária:</span>
                      <span className="question-value">{questionnaireData.rotinaDiaria}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Estrutura da Dieta */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🍽️ Estrutura da Dieta</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Quantidade de Refeições:</span>
                      <span className="question-value">{questionnaireData.quantidadeRefeicoes}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Preferência de Refeições:</span>
                      <span className="question-value">{questionnaireData.preferenciaRefeicoes}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 4: Complexidade e Adesão */}
                <div className="questionnaire-block">
                  <h3 className="block-title">⚖️ Complexidade e Adesão</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Conforto em Pesar:</span>
                      <span className="question-value">{questionnaireData.confortoPesar}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Tempo de Preparação:</span>
                      <span className="question-value">{questionnaireData.tempoPreparacao}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Preferência de Variação:</span>
                      <span className="question-value">{questionnaireData.preferenciaVariacao}</span>
                    </div>
                  </div>
                </div>

                {/* Bloco 5: Alimentos do Dia a Dia */}
                {questionnaireData.alimentosDoDiaADia && (
                  <div className="questionnaire-block">
                    <h3 className="block-title">🥗 Alimentos do Dia a Dia</h3>
                    <div className="alimentos-categories">
                      {questionnaireData.alimentosDoDiaADia.carboidratos?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Carboidratos:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.carboidratos)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.proteinas?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Proteínas:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.proteinas)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.gorduras?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Gorduras:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.gorduras)}</span>
                        </div>
                      )}
                      {questionnaireData.alimentosDoDiaADia.frutas?.length > 0 && (
                        <div className="alimentos-category">
                          <span className="category-label">Frutas:</span>
                          <span className="category-value">{formatAlimentos(questionnaireData.alimentosDoDiaADia.frutas)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bloco 6: Restrições */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🚫 Restrições</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Restrição Alimentar:</span>
                      <span className="question-value">{questionnaireData.restricaoAlimentar}</span>
                    </div>
                    {questionnaireData.restricaoAlimentar === 'Outra' && questionnaireData.outraRestricao && (
                      <div className="questionnaire-item">
                        <span className="question-label">Especifique:</span>
                        <span className="question-value">{questionnaireData.outraRestricao}</span>
                      </div>
                    )}
                    {questionnaireData.alimentosEvita && (
                      <div className="questionnaire-item full-width">
                        <span className="question-label">Alimentos que Evita:</span>
                        <span className="question-value">{questionnaireData.alimentosEvita}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco 7: Flexibilidade */}
                <div className="questionnaire-block">
                  <h3 className="block-title">🔄 Flexibilidade</h3>
                  <div className="questionnaire-grid">
                    <div className="questionnaire-item">
                      <span className="question-label">Opções de Substituição:</span>
                      <span className="question-value">{questionnaireData.opcoesSubstituicao}</span>
                    </div>
                    <div className="questionnaire-item">
                      <span className="question-label">Refeições Livres:</span>
                      <span className="question-value">{questionnaireData.refeicoesLivres}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Reset */}
        <section className="perfil-section danger-section">
          <div className="section-header">
            <h2>Começar do zero</h2>
          </div>
          <div className="reset-content">
            <p className="reset-description">
              Se você mudou de objetivo ou deseja recomeçar, você pode resetar sua dieta e questionário.
              Esta ação irá:
            </p>
            <ul className="reset-list">
              <li>Limpar sua dieta atual</li>
              <li>Limpar seu questionário</li>
              <li>Limpar todos os check-ins e histórico</li>
            </ul>
            <p className="reset-warning">
              Esta ação não pode ser desfeita. Você precisará preencher o questionário novamente.
            </p>
            <button
              className="reset-btn"
              onClick={handleResetDietAndQuestionnaire}
              disabled={resetting || (!hasDiet && !questionnaireData)}
            >
              {resetting ? 'Resetando...' : 'Começar do zero'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default PacientePerfil




