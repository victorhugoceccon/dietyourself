import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './Questionnaire.css'

function Questionnaire({ onComplete }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('📝 Componente Questionnaire montado!')
  }, [])
  
  const [formData, setFormData] = useState({
    // Bloco 1: Dados Básicos
    idade: '',
    sexo: '',
    altura: '',
    pesoAtual: '',
    objetivo: '',
    
    // Bloco 2: Rotina e Atividade
    frequenciaAtividade: '',
    tipoAtividade: '',
    horarioTreino: '',
    rotinaDiaria: '',
    
    // Bloco 3: Estrutura da Dieta
    quantidadeRefeicoes: '',
    preferenciaRefeicoes: '',
    
    // Bloco 4: Complexidade e Adesão
    confortoPesar: '',
    tempoPreparacao: '',
    preferenciaVariacao: '',
    
    // Bloco 5: Alimentos do Dia a Dia
    carboidratos: [],
    proteinas: [],
    gorduras: [],
    frutas: [],
    
    // Bloco 6: Restrições
    restricaoAlimentar: '',
    outraRestricao: '',
    alimentosEvita: '',
    
    // Bloco 7: Flexibilidade Real
    opcoesSubstituicao: '',
    refeicoesLivres: ''
  })

  const totalSteps = 7

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleCheckboxGroup = (category, item) => {
    setFormData(prev => {
      const currentList = [...prev[category]]
      const index = currentList.indexOf(item)
      
      if (index > -1) {
        currentList.splice(index, 1)
      } else {
        currentList.push(item)
      }
      
      return { ...prev, [category]: currentList }
    })
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: // Dados Básicos
        if (!formData.idade || !formData.sexo || !formData.altura || !formData.pesoAtual || !formData.objetivo) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        if (formData.idade < 1 || formData.idade > 150) {
          setError('Idade deve estar entre 1 e 150 anos')
          return false
        }
        if (formData.altura < 50 || formData.altura > 250) {
          setError('Altura deve estar entre 50 e 250 cm')
          return false
        }
        if (formData.pesoAtual < 20 || formData.pesoAtual > 300) {
          setError('Peso deve estar entre 20 e 300 kg')
          return false
        }
        return true
      
      case 2: // Rotina e Atividade
        if (!formData.frequenciaAtividade || !formData.tipoAtividade || !formData.horarioTreino || !formData.rotinaDiaria) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 3: // Estrutura da Dieta
        if (!formData.quantidadeRefeicoes || !formData.preferenciaRefeicoes) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 4: // Complexidade e Adesão
        if (!formData.confortoPesar || !formData.tempoPreparacao || !formData.preferenciaVariacao) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 5: // Alimentos do Dia a Dia
        // Opcional - pode não ter nenhum selecionado
        return true
      
      case 6: // Restrições
        if (!formData.restricaoAlimentar) {
          setError('Por favor, selecione se tem alguma restrição alimentar')
          return false
        }
        // Se selecionou "Outra", verificar se preencheu o campo
        if (formData.restricaoAlimentar === 'Outra' && !formData.outraRestricao.trim()) {
          setError('Por favor, especifique qual é a restrição alimentar')
          return false
        }
        return true
      
      case 7: // Flexibilidade Real
        if (!formData.opcoesSubstituicao || !formData.refeicoesLivres) {
          setError('Por favor, preencha todos os campos obrigatórios')
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      const payload = {
        // Bloco 1
        idade: parseInt(formData.idade),
        sexo: formData.sexo,
        altura: parseFloat(formData.altura),
        pesoAtual: parseFloat(formData.pesoAtual),
        objetivo: formData.objetivo,
        
        // Bloco 2
        frequenciaAtividade: formData.frequenciaAtividade,
        tipoAtividade: formData.tipoAtividade,
        horarioTreino: formData.horarioTreino,
        rotinaDiaria: formData.rotinaDiaria,
        
        // Bloco 3
        quantidadeRefeicoes: formData.quantidadeRefeicoes,
        preferenciaRefeicoes: formData.preferenciaRefeicoes,
        
        // Bloco 4
        confortoPesar: formData.confortoPesar,
        tempoPreparacao: formData.tempoPreparacao,
        preferenciaVariacao: formData.preferenciaVariacao,
        
        // Bloco 5
        alimentosDoDiaADia: {
          carboidratos: formData.carboidratos,
          proteinas: formData.proteinas,
          gorduras: formData.gorduras,
          frutas: formData.frutas
        },
        
        // Bloco 6
        restricaoAlimentar: formData.restricaoAlimentar,
        outraRestricao: formData.restricaoAlimentar === 'Outra' ? formData.outraRestricao : '',
        alimentosEvita: formData.alimentosEvita || '',
        
        // Bloco 7
        opcoesSubstituicao: formData.opcoesSubstituicao,
        refeicoesLivres: formData.refeicoesLivres
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
      } else {
        // Redirecionar para a página principal
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role === 'PACIENTE') {
          navigate('/paciente')
        }
      }

    } catch (err) {
      console.error('Erro ao enviar questionário:', err)
      setError(err.message || 'Erro ao salvar questionário')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Dados Básicos</h2>
            <p className="step-description">
              Essas informações nos ajudam a calcular suas necessidades nutricionais
            </p>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="idade">Idade *</label>
                <input
                  type="number"
                  id="idade"
                  value={formData.idade}
                  onChange={(e) => handleChange('idade', e.target.value)}
                  min="1"
                  max="150"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="altura">Altura (cm) *</label>
                <input
                  type="number"
                  id="altura"
                  value={formData.altura}
                  onChange={(e) => handleChange('altura', e.target.value)}
                  min="50"
                  max="250"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sexo *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sexo"
                    value="Feminino"
                    checked={formData.sexo === 'Feminino'}
                    onChange={(e) => handleChange('sexo', e.target.value)}
                  />
                  <span>Feminino</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sexo"
                    value="Masculino"
                    checked={formData.sexo === 'Masculino'}
                    onChange={(e) => handleChange('sexo', e.target.value)}
                  />
                  <span>Masculino</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pesoAtual">Peso atual (kg) *</label>
              <input
                type="number"
                id="pesoAtual"
                value={formData.pesoAtual}
                onChange={(e) => handleChange('pesoAtual', e.target.value)}
                min="20"
                max="300"
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label>Objetivo principal *</label>
              <div className="radio-group">
                {['Emagrecer', 'Manter o peso', 'Ganhar massa muscular', 'Ganhar peso de forma geral'].map(obj => (
                  <label key={obj} className="radio-label">
                    <input
                      type="radio"
                      name="objetivo"
                      value={obj}
                      checked={formData.objetivo === obj}
                      onChange={(e) => handleChange('objetivo', e.target.value)}
                    />
                    <span>{obj}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2>Rotina e Atividade</h2>
            <p className="step-description">
              Essas informações definem a distribuição de refeições e carboidratos
            </p>

            <div className="form-group">
              <label>Você pratica atividade física regularmente? *</label>
              <div className="radio-group">
                {[
                  'Não pratico',
                  'Sim, 1–2x por semana',
                  'Sim, 3–4x por semana',
                  'Sim, 5x ou mais por semana'
                ].map(freq => (
                  <label key={freq} className="radio-label">
                    <input
                      type="radio"
                      name="frequenciaAtividade"
                      value={freq}
                      checked={formData.frequenciaAtividade === freq}
                      onChange={(e) => handleChange('frequenciaAtividade', e.target.value)}
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Qual tipo de atividade você pratica com mais frequência? *</label>
              <div className="radio-group">
                {[
                  'Musculação',
                  'Cardio (caminhada, corrida, bike)',
                  'Ambos',
                  'Outro'
                ].map(tipo => (
                  <label key={tipo} className="radio-label">
                    <input
                      type="radio"
                      name="tipoAtividade"
                      value={tipo}
                      checked={formData.tipoAtividade === tipo}
                      onChange={(e) => handleChange('tipoAtividade', e.target.value)}
                    />
                    <span>{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Horário em que normalmente treina (se treina): *</label>
              <div className="radio-group">
                {['Manhã', 'Tarde', 'Noite', 'Varia muito'].map(horario => (
                  <label key={horario} className="radio-label">
                    <input
                      type="radio"
                      name="horarioTreino"
                      value={horario}
                      checked={formData.horarioTreino === horario}
                      onChange={(e) => handleChange('horarioTreino', e.target.value)}
                    />
                    <span>{horario}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Sua rotina diária é mais: *</label>
              <div className="radio-group">
                {[
                  'Sedentária (trabalho sentado, pouco movimento)',
                  'Moderada (anda bastante, se movimenta no dia)',
                  'Ativa (trabalho físico ou muito movimento)'
                ].map(rotina => (
                  <label key={rotina} className="radio-label">
                    <input
                      type="radio"
                      name="rotinaDiaria"
                      value={rotina}
                      checked={formData.rotinaDiaria === rotina}
                      onChange={(e) => handleChange('rotinaDiaria', e.target.value)}
                    />
                    <span>{rotina}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h2>Estrutura da Dieta</h2>
            <p className="step-description">
              Essas informações definem a quantidade de alimentos por refeição
            </p>

            <div className="form-group">
              <label>Quantas refeições você consegue fazer por dia, na prática? *</label>
              <div className="radio-group">
                {['3 refeições', '4 refeições', '5 refeições', 'Mais de 5'].map(qtd => (
                  <label key={qtd} className="radio-label">
                    <input
                      type="radio"
                      name="quantidadeRefeicoes"
                      value={qtd}
                      checked={formData.quantidadeRefeicoes === qtd}
                      onChange={(e) => handleChange('quantidadeRefeicoes', e.target.value)}
                    />
                    <span>{qtd}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Você prefere refeições: *</label>
              <div className="radio-group">
                {[
                  'Mais simples, com poucos alimentos',
                  'Um equilíbrio entre simples e variadas',
                  'Mais completas e variadas'
                ].map(pref => (
                  <label key={pref} className="radio-label">
                    <input
                      type="radio"
                      name="preferenciaRefeicoes"
                      value={pref}
                      checked={formData.preferenciaRefeicoes === pref}
                      onChange={(e) => handleChange('preferenciaRefeicoes', e.target.value)}
                    />
                    <span>{pref}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h2>Complexidade e Adesão</h2>
            <p className="step-description">
              Essas informações nos ajudam a personalizar sua dieta
            </p>

            <div className="form-group">
              <label>Você se sente confortável em pesar alimentos? *</label>
              <div className="radio-group">
                {['Sim, sem problemas', 'Às vezes', 'Prefiro medidas caseiras'].map(conf => (
                  <label key={conf} className="radio-label">
                    <input
                      type="radio"
                      name="confortoPesar"
                      value={conf}
                      checked={formData.confortoPesar === conf}
                      onChange={(e) => handleChange('confortoPesar', e.target.value)}
                    />
                    <span>{conf}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Quanto tempo você costuma ter para preparar refeições? *</label>
              <div className="radio-group">
                {[
                  'Muito pouco (até 10 min)',
                  'Médio (10–30 min)',
                  'Tenho tempo e gosto de cozinhar'
                ].map(tempo => (
                  <label key={tempo} className="radio-label">
                    <input
                      type="radio"
                      name="tempoPreparacao"
                      value={tempo}
                      checked={formData.tempoPreparacao === tempo}
                      onChange={(e) => handleChange('tempoPreparacao', e.target.value)}
                    />
                    <span>{tempo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Você prefere repetir refeições ou variar ao longo da semana? *</label>
              <div className="radio-group">
                {[
                  'Prefiro repetir',
                  'Um pouco de repetição é ok',
                  'Prefiro variedade'
                ].map(var_pref => (
                  <label key={var_pref} className="radio-label">
                    <input
                      type="radio"
                      name="preferenciaVariacao"
                      value={var_pref}
                      checked={formData.preferenciaVariacao === var_pref}
                      onChange={(e) => handleChange('preferenciaVariacao', e.target.value)}
                    />
                    <span>{var_pref}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h2>Alimentos do Dia a Dia</h2>
            <p className="step-description">
              Marque os alimentos que você costuma consumir (opcional)
            </p>

            <div className="alimentos-section">
              <div className="alimento-category">
                <h3>Carboidratos</h3>
                <div className="checkbox-group">
                  {[
                    'Arroz', 'Feijão', 'Batata', 'Macarrão', 'Pão francês', 
                    'Aveia', 'Flocos de milho / sucrilhos sem açúcar', 
                    'Farinha de arroz', 'Milho', 'Tapioca'
                  ].map(item => (
                    <label key={item} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.carboidratos.includes(item)}
                        onChange={() => handleCheckboxGroup('carboidratos', item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="alimento-category">
                <h3>Proteínas</h3>
                <div className="checkbox-group">
                  {[
                    'Frango', 'Carne bovina', 'Ovos', 'Peixe', 
                    'Queijo', 'Iogurte', 'Whey protein'
                  ].map(item => (
                    <label key={item} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.proteinas.includes(item)}
                        onChange={() => handleCheckboxGroup('proteinas', item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="alimento-category">
                <h3>Gorduras / Complementos</h3>
                <div className="checkbox-group">
                  {[
                    'Azeite', 'Pasta de amendoim', 'Castanhas', 'Manteiga'
                  ].map(item => (
                    <label key={item} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.gorduras.includes(item)}
                        onChange={() => handleCheckboxGroup('gorduras', item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="alimento-category">
                <h3>Frutas</h3>
                <div className="checkbox-group">
                  {[
                    'Banana', 'Maçã', 'Mamão', 'Melão', 'Morango', 
                    'Uva', 'Manga', 'Abacaxi'
                  ].map(item => (
                    <label key={item} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.frutas.includes(item)}
                        onChange={() => handleCheckboxGroup('frutas', item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="step-content">
            <h2>Restrições Alimentares</h2>
            <p className="step-description">
              Informe suas restrições para que possamos personalizar sua dieta
            </p>

            <div className="form-group">
              <label>Você tem alguma restrição alimentar? *</label>
              <div className="radio-group">
                {[
                  'Nenhuma',
                  'Intolerância à lactose',
                  'Glúten',
                  'Outra'
                ].map(restricao => (
                  <label key={restricao} className="radio-label">
                    <input
                      type="radio"
                      name="restricaoAlimentar"
                      value={restricao}
                      checked={formData.restricaoAlimentar === restricao}
                      onChange={(e) => handleChange('restricaoAlimentar', e.target.value)}
                    />
                    <span>{restricao}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.restricaoAlimentar === 'Outra' && (
              <div className="form-group">
                <label htmlFor="outraRestricao">Especifique a restrição *</label>
                <input
                  type="text"
                  id="outraRestricao"
                  value={formData.outraRestricao}
                  onChange={(e) => handleChange('outraRestricao', e.target.value)}
                  placeholder="Ex: intolerância a frutos do mar"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="alimentosEvita">Existe algum alimento que você não gosta ou evita?</label>
              <textarea
                id="alimentosEvita"
                value={formData.alimentosEvita}
                onChange={(e) => handleChange('alimentosEvita', e.target.value)}
                placeholder="Ex: cebola crua, pimentão, brócolis..."
                rows="4"
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="step-content">
            <h2>Flexibilidade da Dieta</h2>
            <p className="step-description">
              Defina o quanto de flexibilidade você deseja na sua dieta
            </p>

            <div className="form-group">
              <label>Você gostaria de ter opções de substituição nas refeições? *</label>
              <div className="radio-group">
                {[
                  'Sim, gosto de ter opções',
                  'Algumas opções já são suficientes',
                  'Prefiro algo mais fixo'
                ].map(opcao => (
                  <label key={opcao} className="radio-label">
                    <input
                      type="radio"
                      name="opcoesSubstituicao"
                      value={opcao}
                      checked={formData.opcoesSubstituicao === opcao}
                      onChange={(e) => handleChange('opcoesSubstituicao', e.target.value)}
                    />
                    <span>{opcao}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Você gostaria de ter refeições mais "livres" ao longo da semana? *</label>
              <div className="radio-group">
                {['Sim', 'Talvez', 'Não'].map(livre => (
                  <label key={livre} className="radio-label">
                    <input
                      type="radio"
                      name="refeicoesLivres"
                      value={livre}
                      checked={formData.refeicoesLivres === livre}
                      onChange={(e) => handleChange('refeicoesLivres', e.target.value)}
                    />
                    <span>{livre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <h1 className="questionnaire-title">LifeFit</h1>
        <button 
          onClick={handleLogout}
          className="questionnaire-logout-btn"
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sair
        </button>
      </div>

      <div className="questionnaire-card">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="step-indicator">
          Etapa {currentStep} de {totalSteps}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {renderStepContent()}

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
            {loading ? 'Processando...' : currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Questionnaire
