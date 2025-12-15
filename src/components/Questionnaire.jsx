import { useState } from 'react'
import './Questionnaire.css'

const API_URL = 'http://localhost:5000/api'

function Questionnaire({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    // Etapa 1
    idade: '',
    sexo: '',
    altura: '',
    pesoAtual: '',
    
    // Etapa 2
    objetivo: '',
    nivelAtividade: '',
    refeicoesDia: '',
    
    // Etapa 3
    restricoes: [],
    outraRestricao: '',
    alimentosNaoGosta: '',
    preferenciaAlimentacao: '',
    
    // Etapa 4
    costumaCozinhar: '',
    observacoes: ''
  })

  const totalSteps = 4

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleRestricaoChange = (restricao) => {
    setFormData(prev => {
      let restricoes = [...prev.restricoes]
      const index = restricoes.indexOf(restricao)
      
      if (restricao === 'Nenhuma') {
        // Se clicou em "Nenhuma"
        if (index > -1) {
          // Se já está selecionada, desmarcar
          restricoes = []
        } else {
          // Se não está selecionada, selecionar e limpar todas as outras
          restricoes = ['Nenhuma']
        }
      } else {
        // Se clicou em qualquer outra opção
        if (index > -1) {
          // Desmarcar a opção
          restricoes.splice(index, 1)
        } else {
          // Marcar a opção e remover "Nenhuma" se estiver selecionada
          restricoes = restricoes.filter(r => r !== 'Nenhuma')
          restricoes.push(restricao)
        }
      }
      
      return { ...prev, restricoes }
    })
  }

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.idade || !formData.sexo || !formData.altura || !formData.pesoAtual) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        if (formData.idade < 1 || formData.idade > 150) {
          setError('Idade deve estar entre 1 e 150 anos')
          return false
        }
        return true
      
      case 2:
        if (!formData.objetivo || !formData.nivelAtividade || !formData.refeicoesDia) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 3:
        if (!formData.preferenciaAlimentacao) {
          setError('Por favor, selecione sua preferência alimentar')
          return false
        }
        // Se selecionou "Outra" restrição, verificar se preencheu o campo
        if (formData.restricoes.includes('Outra') && !formData.outraRestricao.trim()) {
          setError('Por favor, especifique a restrição alimentar')
          return false
        }
        return true
      
      case 4:
        if (!formData.costumaCozinhar) {
          setError('Por favor, selecione se costuma cozinhar')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      // Preparar restrições (filtrar "Nenhuma" e incluir "Outra" se preenchida)
      let restricoes = formData.restricoes.filter(r => r !== 'Nenhuma')
      if (formData.restricoes.includes('Outra') && formData.outraRestricao.trim()) {
        restricoes = restricoes.filter(r => r !== 'Outra')
        restricoes.push(formData.outraRestricao.trim())
      }

      const payload = {
        idade: parseInt(formData.idade),
        sexo: formData.sexo,
        altura: parseFloat(formData.altura),
        pesoAtual: parseFloat(formData.pesoAtual),
        objetivo: formData.objetivo,
        nivelAtividade: formData.nivelAtividade,
        refeicoesDia: formData.refeicoesDia, // Já vem como string do select, será convertido no backend
        restricoes: restricoes.length > 0 ? restricoes : [], // Garantir que seja array
        alimentosNaoGosta: formData.alimentosNaoGosta || '',
        preferenciaAlimentacao: formData.preferenciaAlimentacao,
        costumaCozinhar: formData.costumaCozinhar,
        observacoes: formData.observacoes || ''
      }

      const response = await fetch(`${API_URL}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        // Se houver detalhes de validação, mostrar mais informações
        if (data.details) {
          if (Array.isArray(data.details)) {
            const errorMessages = data.details.map(err => {
              const path = Array.isArray(err.path) ? err.path.join('.') : err.path
              return err.message || path
            }).join(', ')
            throw new Error(`Erro de validação: ${errorMessages}`)
          } else if (typeof data.details === 'string') {
            throw new Error(`${data.error || 'Erro'}: ${data.details}`)
          }
        }
        const errorMsg = data.error || 'Erro ao salvar questionário'
        const detailsMsg = data.details ? ` (${data.details})` : ''
        throw new Error(`${errorMsg}${detailsMsg}`)
      }

      // Chamar callback de conclusão
      if (onComplete) {
        onComplete()
      }

    } catch (err) {
      console.error('Erro ao enviar questionário:', err)
      setError(err.message || 'Erro ao salvar questionário. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Dados Básicos</h2>
            <p className="step-description">Vamos começar com algumas informações básicas sobre você</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="idade">Idade *</label>
                <input
                  type="number"
                  id="idade"
                  value={formData.idade}
                  onChange={(e) => handleChange('idade', e.target.value)}
                  placeholder="Ex: 28"
                  min="1"
                  max="150"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sexo">Sexo *</label>
                <select
                  id="sexo"
                  value={formData.sexo}
                  onChange={(e) => handleChange('sexo', e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="altura">Altura (cm) *</label>
                <input
                  type="number"
                  id="altura"
                  value={formData.altura}
                  onChange={(e) => handleChange('altura', e.target.value)}
                  placeholder="Ex: 175"
                  min="50"
                  max="300"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pesoAtual">Peso atual (kg) *</label>
                <input
                  type="number"
                  id="pesoAtual"
                  value={formData.pesoAtual}
                  onChange={(e) => handleChange('pesoAtual', e.target.value)}
                  placeholder="Ex: 82"
                  min="1"
                  max="500"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2>Objetivo e Rotina</h2>
            <p className="step-description">Conte-nos sobre seus objetivos e estilo de vida</p>
            
            <div className="form-group">
              <label htmlFor="objetivo">Qual é seu principal objetivo agora? *</label>
              <select
                id="objetivo"
                value={formData.objetivo}
                onChange={(e) => handleChange('objetivo', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Emagrecer">Emagrecer</option>
                <option value="Manter peso">Manter peso</option>
                <option value="Ganhar massa muscular">Ganhar massa muscular</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nivelAtividade">Seu nível de atividade física *</label>
              <select
                id="nivelAtividade"
                value={formData.nivelAtividade}
                onChange={(e) => handleChange('nivelAtividade', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Sedentário (não treino)">Sedentário (não treino)</option>
                <option value="Levemente ativo (1–2x por semana)">Levemente ativo (1–2x por semana)</option>
                <option value="Moderadamente ativo (3–4x por semana)">Moderadamente ativo (3–4x por semana)</option>
                <option value="Muito ativo (5x ou mais por semana)">Muito ativo (5x ou mais por semana)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="refeicoesDia">Quantas refeições você prefere fazer por dia? *</label>
              <select
                id="refeicoesDia"
                value={formData.refeicoesDia}
                onChange={(e) => handleChange('refeicoesDia', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h2>Alimentação e Restrições</h2>
            <p className="step-description">Ajude-nos a personalizar sua dieta</p>
            
            <div className="form-group">
              <label>Você tem alguma restrição alimentar ou alergia?</label>
              <div className="checkbox-group">
                {['Nenhuma', 'Lactose', 'Glúten', 'Ovo', 'Peixe', 'Outra'].map(restricao => (
                  <label key={restricao} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.restricoes.includes(restricao)}
                      onChange={() => handleRestricaoChange(restricao)}
                      disabled={restricao !== 'Nenhuma' && formData.restricoes.includes('Nenhuma')}
                    />
                    <span>{restricao}</span>
                  </label>
                ))}
              </div>
              {formData.restricoes.includes('Outra') && (
                <input
                  type="text"
                  className="mt-2"
                  placeholder="Especifique a restrição"
                  value={formData.outraRestricao}
                  onChange={(e) => handleChange('outraRestricao', e.target.value)}
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="alimentosNaoGosta">Tem algum alimento que você não gosta ou não come de jeito nenhum?</label>
              <textarea
                id="alimentosNaoGosta"
                value={formData.alimentosNaoGosta}
                onChange={(e) => handleChange('alimentosNaoGosta', e.target.value)}
                placeholder="Ex: fígado, sardinha, berinjela…"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferenciaAlimentacao">Como você prefere sua alimentação no dia a dia? *</label>
              <select
                id="preferenciaAlimentacao"
                value={formData.preferenciaAlimentacao}
                onChange={(e) => handleChange('preferenciaAlimentacao', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Simples e rápida">Simples e rápida</option>
                <option value="Caseira tradicional">Caseira tradicional</option>
                <option value="Mais fitness">Mais fitness</option>
                <option value="Tanto faz">Tanto faz</option>
              </select>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h2>Finalizando</h2>
            <p className="step-description">Últimas informações para completar seu perfil</p>
            
            <div className="form-group">
              <label htmlFor="costumaCozinhar">Você costuma cozinhar? *</label>
              <select
                id="costumaCozinhar"
                value={formData.costumaCozinhar}
                onChange={(e) => handleChange('costumaCozinhar', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Sim, quase sempre">Sim, quase sempre</option>
                <option value="Às vezes">Às vezes</option>
                <option value="Quase nunca">Quase nunca</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="observacoes">Alguma observação importante para sua dieta?</label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                placeholder="Ex: almoço fora, pouco tempo, orçamento baixo…"
                rows="4"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-card">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="step-indicator">
          <span>Etapa {currentStep} de {totalSteps}</span>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {renderStep()}

        <div className="form-actions">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary"
              disabled={loading}
            >
              Voltar
            </button>
          )}
          
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Questionnaire

