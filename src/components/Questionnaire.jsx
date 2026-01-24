import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import { Bread, Fish, Drop, Plant, Sparkle } from '@phosphor-icons/react'
import './Questionnaire.css'

function Questionnaire({ onComplete }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Dados Básicos
    nome: '',
    idade: '',
    sexo: '',
    altura: '',
    pesoAtual: '',
    objetivo: '',
    sentimentosCorpo: '',
    expectativaSucesso: '',
    
    // Rotina e Sono
    rotinaDiaria: '',
    sono: '',
    
    // Atividade Física
    frequenciaAtividade: '',
    barreirasTreino: '',
    tipoAtividade: [],
    rotinaAtividade: '',
    relacaoEmocionalTreino: '',
    preferenciaDificuldadeTreino: '',
    horarioTreino: '',
    
    // Estrutura da Dieta
    quantidadeRefeicoes: '',
    preferenciaRefeicoes: '',
    
    // Alimentos do Dia a Dia
    alimentosDoDiaADia: {
      carboidratos: [],
      proteinas: [],
      gorduras: [],
      verduras: [],
      legumes: [],
      frutas: []
    },
    
    // Preferências Alimentares
    alimentosGosta: '',
    alimentosEvita: '',
    tempoPreparacao: '',
    confortoPesar: '',
    preferenciaVariacao: '',
    alimentacaoFimSemana: '',
    
    // Restrições
    restricaoAlimentar: '',
    outraRestricao: '',
    
    // Flexibilidade
    opcoesSubstituicao: '',
    refeicoesLivres: '',
    
    // Saúde
    problemasSaude: '',
    quaisProblemasSaude: '',
    usoMedicacao: '',
    quaisMedicamentos: '',
    limitacoesFisicas: '',
    detalhesLimitacao: '',
    restricoesMedicasExercicio: '',
    movimentosEvitar: '',
    receiosSaude: ''
  })

  const totalSteps = 8

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleCheckboxGroup = (category, item) => {
    setFormData(prev => {
      const currentList = [...prev.alimentosDoDiaADia[category]]
      const index = currentList.indexOf(item)
      
      if (index > -1) {
        currentList.splice(index, 1)
      } else {
        currentList.push(item)
      }
      
      return {
        ...prev,
        alimentosDoDiaADia: {
          ...prev.alimentosDoDiaADia,
          [category]: currentList
        }
      }
    })
  }

  const handleTipoAtividadeToggle = (tipo) => {
    setFormData(prev => {
      const currentList = [...prev.tipoAtividade]
      const index = currentList.indexOf(tipo)
      
      if (index > -1) {
        currentList.splice(index, 1)
      } else {
        currentList.push(tipo)
      }
      
      // Se tiver apenas 1 ou nenhum selecionado, limpa a rotina
      const newList = currentList
      const rotinaAtividade = newList.length > 1 ? prev.rotinaAtividade : ''
      
      return {
        ...prev,
        tipoAtividade: newList,
        rotinaAtividade
      }
    })
    setError('')
  }

  const validateStep = (step) => {
    switch (step) {
      case 1: // Dados Básicos
        if (!formData.idade || !formData.sexo || !formData.altura || !formData.pesoAtual || !formData.objetivo) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        const age = parseInt(formData.idade)
        const height = parseFloat(formData.altura)
        const weight = parseFloat(formData.pesoAtual)
        if (isNaN(age) || age < 1 || age > 150) {
          setError('Idade deve estar entre 1 e 150 anos')
          return false
        }
        if (isNaN(height) || height < 50 || height > 250) {
          setError('Altura deve estar entre 50 e 250 cm')
          return false
        }
        if (isNaN(weight) || weight < 20 || weight > 300) {
          setError('Peso deve estar entre 20 e 300 kg')
          return false
        }
        return true
      
      case 2: // Rotina e Sono
        if (!formData.rotinaDiaria || !formData.sono) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 3: // Atividade Física
        if (!formData.frequenciaAtividade || !formData.horarioTreino) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        if (formData.frequenciaAtividade !== 'Não pratico atualmente') {
          if (!formData.tipoAtividade || formData.tipoAtividade.length === 0 || !formData.relacaoEmocionalTreino) {
            setError('Por favor, preencha todos os campos obrigatórios')
            return false
          }
          // Se mais de um tipo de atividade selecionado, rotina é obrigatória
          if (formData.tipoAtividade.length > 1 && !formData.rotinaAtividade.trim()) {
            setError('Por favor, descreva sua rotina semanal de exercícios')
            return false
          }
        }
        return true
      
      case 4: // Estrutura da Dieta
        if (!formData.quantidadeRefeicoes || !formData.preferenciaRefeicoes) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 5: // Alimentos do Dia a Dia
        // Opcional
        return true
      
      case 6: // Preferências e Preparação
        if (!formData.tempoPreparacao || !formData.confortoPesar || !formData.preferenciaVariacao || !formData.alimentacaoFimSemana) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        return true
      
      case 7: // Restrições e Flexibilidade
        if (!formData.restricaoAlimentar || !formData.opcoesSubstituicao || !formData.refeicoesLivres) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        if (formData.restricaoAlimentar === 'Outra' && !formData.outraRestricao.trim()) {
          setError('Por favor, especifique qual é a restrição alimentar')
          return false
        }
        return true
      
      case 8: // Saúde
        if (!formData.problemasSaude || !formData.usoMedicacao || !formData.limitacoesFisicas || !formData.restricoesMedicasExercicio) {
          setError('Por favor, preencha todos os campos obrigatórios')
          return false
        }
        if (formData.problemasSaude === 'Sim' && !formData.quaisProblemasSaude.trim()) {
          setError('Por favor, especifique quais são os problemas de saúde')
          return false
        }
        if (formData.usoMedicacao === 'Sim' && !formData.quaisMedicamentos.trim()) {
          setError('Por favor, especifique quais medicamentos você utiliza')
          return false
        }
        if (formData.limitacoesFisicas === 'Sim' && !formData.detalhesLimitacao.trim()) {
          setError('Por favor, descreva a limitação física')
          return false
        }
        if (formData.restricoesMedicasExercicio === 'Sim' && !formData.movimentosEvitar.trim()) {
          setError('Por favor, especifique quais movimentos evitar')
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
        setError('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      const payload = {
        // Dados básicos
        idade: parseInt(formData.idade),
        sexo: formData.sexo === 'Prefiro não informar' ? null : formData.sexo,
        altura: parseFloat(formData.altura),
        pesoAtual: parseFloat(formData.pesoAtual),
        objetivo: formData.objetivo,
        sentimentosCorpo: formData.sentimentosCorpo || '',
        expectativaSucesso: formData.expectativaSucesso || '',
        
        // Rotina e sono
        rotinaDiaria: formData.rotinaDiaria,
        sono: formData.sono,
        
        // Atividade física
        frequenciaAtividade: formData.frequenciaAtividade,
        barreirasTreino: formData.barreirasTreino || '',
        tipoAtividade: Array.isArray(formData.tipoAtividade) 
          ? formData.tipoAtividade.join(', ') 
          : (formData.tipoAtividade || ''),
        rotinaTreinoDetalhada: formData.rotinaAtividade || '',
        relacaoEmocionalTreino: formData.relacaoEmocionalTreino || '',
        preferenciaDificuldadeTreino: formData.preferenciaDificuldadeTreino || '',
        horarioTreino: formData.horarioTreino,
        
        // Estrutura da dieta
        quantidadeRefeicoes: formData.quantidadeRefeicoes,
        preferenciaRefeicoes: formData.preferenciaRefeicoes,
        
        // Alimentos do dia a dia
        alimentosDoDiaADia: formData.alimentosDoDiaADia,
        
        // Preferências alimentares
        alimentosGosta: formData.alimentosGosta || '',
        alimentosEvita: formData.alimentosEvita || '',
        tempoPreparacao: formData.tempoPreparacao,
        confortoPesar: formData.confortoPesar,
        preferenciaVariacao: formData.preferenciaVariacao,
        alimentacaoFimSemana: formData.alimentacaoFimSemana,
        
        // Restrições
        restricaoAlimentar: formData.restricaoAlimentar,
        outraRestricao: formData.restricaoAlimentar === 'Outra' ? formData.outraRestricao : '',
        
        // Flexibilidade
        opcoesSubstituicao: formData.opcoesSubstituicao,
        refeicoesLivres: formData.refeicoesLivres,
        
        // Saúde
        problemasSaude: formData.problemasSaude,
        quaisProblemasSaude: formData.problemasSaude === 'Sim' ? formData.quaisProblemasSaude : '',
        usoMedicacao: formData.usoMedicacao,
        quaisMedicamentos: formData.usoMedicacao === 'Sim' ? formData.quaisMedicamentos : '',
        limitacoesFisicas: formData.limitacoesFisicas,
        detalhesLimitacao: formData.limitacoesFisicas === 'Sim' ? formData.detalhesLimitacao : '',
        restricoesMedicasExercicio: formData.restricoesMedicasExercicio,
        movimentosEvitar: formData.restricoesMedicasExercicio === 'Sim' ? formData.movimentosEvitar : '',
        receiosSaude: formData.receiosSaude || ''
      }

      const response = await fetch(`${API_URL}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Resposta não é JSON:', text)
        throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`)
      }

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

      if (onComplete) {
        onComplete()
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role === 'PACIENTE') {
          navigate('/paciente/dashboard')
        }
      }

    } catch (err) {
      console.error('Erro ao enviar questionário:', err)
      setError(err.message || 'Erro ao salvar questionário')
    } finally {
      setLoading(false)
    }
  }

  const foodCategories = {
    proteinas: {
      title: 'Proteínas',
      icon: Fish,
      items: [
        'Ovo', 'Peito de frango', 'Coxa/sobrecoxa de frango', 'Carne moída (patinho, acém)',
        'Carne bovina em bife (patinho, coxão mole)', 'Peixe (tilápia, sardinha, merluza)',
        'Atum em lata', 'Sardinha em lata', 'Presunto magro', 'Queijo branco (minas, ricota, cottage)',
        'Leite', 'Iogurte natural', 'Feijão (preto, carioca, vermelho)', 'Lentilha',
        'Grão-de-bico', 'Ervilha', 'Soja', 'Proteína de soja texturizada (PTS)'
      ]
    },
    carboidratos: {
      title: 'Carboidratos',
      icon: Bread,
      items: [
        'Arroz branco', 'Arroz integral', 'Feijão', 'Macarrão', 'Pão francês', 'Pão de forma',
        'Tapioca', 'Cuscuz (milho)', 'Batata inglesa', 'Batata-doce', 'Mandioca (aipim/macaxeira)',
        'Inhame', 'Mandioquinha', 'Aveia', 'Milho', 'Farinha de milho', 'Farinha de mandioca'
      ]
    },
    gorduras: {
      title: 'Gorduras',
      icon: Drop,
      items: [
        'Azeite de oliva', 'Óleo de soja', 'Óleo de girassol', 'Manteiga', 'Margarina',
        'Maionese', 'Abacate', 'Amendoim', 'Castanha de caju', 'Castanha-do-pará',
        'Amendoim (pasta ou in natura)', 'Sementes (linhaça, chia)'
      ]
    },
    verduras: {
      title: 'Verduras',
      icon: Plant,
      items: ['Alface', 'Rúcula', 'Agrião', 'Couve', 'Espinafre', 'Repolho']
    },
    legumes: {
      title: 'Legumes',
      icon: Plant,
      items: [
        'Tomate', 'Cebola', 'Alho', 'Cenoura', 'Beterraba', 'Abobrinha',
        'Chuchu', 'Berinjela', 'Pepino', 'Pimentão'
      ]
    },
    frutas: {
      title: 'Frutas',
      icon: Sparkle,
      items: [
        'Banana', 'Maçã', 'Laranja', 'Mamão', 'Manga', 'Melancia',
        'Abacaxi', 'Pera', 'Morango', 'Melão', 'Kiwi', 'Uva'
      ]
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Dados Básicos</h2>
            <p className="questionnaire-step-description">
              Essas informações nos ajudam a calcular suas necessidades nutricionais
            </p>

            <div className="questionnaire-form-group">
              <label htmlFor="idade">Idade *</label>
              <input
                type="number"
                id="idade"
                value={formData.idade}
                onChange={(e) => handleChange('idade', e.target.value)}
                min="1"
                max="150"
                placeholder="Ex: 28"
                required
              />
            </div>

            <div className="questionnaire-form-group">
              <label>Sexo *</label>
              <div className="questionnaire-radio-group">
                {['Feminino', 'Masculino', 'Prefiro não informar'].map(sexo => (
                  <label key={sexo} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="sexo"
                      value={sexo}
                      checked={formData.sexo === sexo}
                      onChange={(e) => handleChange('sexo', e.target.value)}
                    />
                    <span>{sexo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="questionnaire-form-group">
              <label htmlFor="altura">Altura (cm) *</label>
              <input
                type="number"
                id="altura"
                value={formData.altura}
                onChange={(e) => handleChange('altura', e.target.value)}
                min="50"
                max="250"
                placeholder="Ex: 170"
                required
              />
            </div>

            <div className="questionnaire-form-group">
              <label htmlFor="pesoAtual">Peso atual (kg) *</label>
              <input
                type="number"
                id="pesoAtual"
                value={formData.pesoAtual}
                onChange={(e) => handleChange('pesoAtual', e.target.value)}
                min="20"
                max="300"
                step="0.1"
                placeholder="Ex: 75.5"
                required
              />
            </div>

            <div className="questionnaire-form-group">
              <label>Objetivo principal *</label>
              <div className="questionnaire-radio-group">
                {['Emagrecer', 'Manter o peso', 'Ganhar massa muscular', 'Ganhar peso de forma geral'].map(obj => (
                  <label key={obj} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label htmlFor="sentimentosCorpo">Como você se sente em relação ao seu corpo hoje? (opcional)</label>
              <textarea
                id="sentimentosCorpo"
                value={formData.sentimentosCorpo}
                onChange={(e) => handleChange('sentimentosCorpo', e.target.value)}
                placeholder="O que mais gostaria de mudar ou melhorar?"
                rows="3"
              />
            </div>

            <div className="questionnaire-form-group">
              <label htmlFor="expectativaSucesso">Daqui a 30 dias, o que faria você olhar pra esse plano e pensar: "Esse plano valeu a pena"? (opcional)</label>
              <textarea
                id="expectativaSucesso"
                value={formData.expectativaSucesso}
                onChange={(e) => handleChange('expectativaSucesso', e.target.value)}
                placeholder="Descreva suas expectativas..."
                rows="3"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Rotina e Sono</h2>
            <p className="questionnaire-step-description">
              Conte-nos sobre seu dia a dia e qualidade do sono
            </p>

            <div className="questionnaire-form-group">
              <label htmlFor="rotinaDiaria">Me conta como é um dia típico pra você *</label>
              <textarea
                id="rotinaDiaria"
                value={formData.rotinaDiaria}
                onChange={(e) => handleChange('rotinaDiaria', e.target.value)}
                placeholder="Trabalha mais sentado, em pé, se movimenta bastante? Seus horários são mais certinhos ou bem bagunçados?"
                rows="4"
                required
              />
            </div>

            <div className="questionnaire-form-group">
              <label>E seu sono, como anda hoje? *</label>
              <div className="questionnaire-radio-group">
                {['Durmo bem', 'Durmo mal e acordo cansado', 'Varia muito'].map(sono => (
                  <label key={sono} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="sono"
                      value={sono}
                      checked={formData.sono === sono}
                      onChange={(e) => handleChange('sono', e.target.value)}
                    />
                    <span>{sono}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Atividade Física</h2>
            <p className="questionnaire-step-description">
              Informações sobre sua relação com exercícios e treinos
            </p>

            <div className="questionnaire-form-group">
              <label>Hoje, como está sua relação com atividade física? *</label>
              <div className="questionnaire-radio-group">
                {['Não pratico atualmente', '1–2x por semana', '3–4x por semana', '5x ou mais por semana'].map(freq => (
                  <label key={freq} className="questionnaire-radio-label">
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

            {formData.frequenciaAtividade === 'Não pratico atualmente' && (
              <div className="questionnaire-form-group">
                <label>O que mais te impede de treinar hoje? (opcional)</label>
                <div className="questionnaire-radio-group">
                  {['Falta de tempo', 'Falta de motivação', 'Cansaço excessivo', 'Dor ou desconforto físico', 'Nunca gostei de treinar', 'Outro motivo'].map(barreira => (
                    <label key={barreira} className="questionnaire-radio-label">
                      <input
                        type="radio"
                        name="barreirasTreino"
                        value={barreira}
                        checked={formData.barreirasTreino === barreira}
                        onChange={(e) => handleChange('barreirasTreino', e.target.value)}
                      />
                      <span>{barreira}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.frequenciaAtividade !== 'Não pratico atualmente' && (
              <>
                <div className="questionnaire-form-group">
                  <label>Qual tipo de atividade você pratica ou mais gosta? *</label>
                  <div className="questionnaire-radio-group">
                    {['Musculação', 'Caminhada', 'Corrida', 'Ciclismo', 'Crossfit', 'Lutas', 'Yoga / Pilates', 'Dança', 'Esportes coletivos', 'Musculação + cardio', 'Outro'].map(tipo => (
                      <label key={tipo} className="questionnaire-checkbox-label">
                        <input
                          type="checkbox"
                          name="tipoAtividade"
                          value={tipo}
                          checked={formData.tipoAtividade.includes(tipo)}
                          onChange={() => handleTipoAtividadeToggle(tipo)}
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.tipoAtividade.length > 1 && (
                  <div className="questionnaire-form-group">
                    <label htmlFor="rotinaAtividade">Descreva sua rotina semanal de exercícios *</label>
                    <textarea
                      id="rotinaAtividade"
                      value={formData.rotinaAtividade}
                      onChange={(e) => handleChange('rotinaAtividade', e.target.value)}
                      placeholder="Ex: 3 dias de musculação e 2 dias de luta"
                      rows="3"
                      required
                    />
                  </div>
                )}

                <div className="questionnaire-form-group">
                  <label>Qual dessas frases mais parece com você hoje? *</label>
                  <div className="questionnaire-radio-group">
                    {['Gosto de treinar e me sinto bem', 'Treino mais por obrigação', 'Treino, mas sempre acabo parando'].map(relacao => (
                      <label key={relacao} className="questionnaire-radio-label">
                        <input
                          type="radio"
                          name="relacaoEmocionalTreino"
                          value={relacao}
                          checked={formData.relacaoEmocionalTreino === relacao}
                          onChange={(e) => handleChange('relacaoEmocionalTreino', e.target.value)}
                        />
                        <span>{relacao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.relacaoEmocionalTreino && (
                  <div className="questionnaire-form-group">
                    <label htmlFor="preferenciaDificuldadeTreino">
                      {formData.relacaoEmocionalTreino === 'Gosto de treinar e me sinto bem'
                        ? 'Tem algum exercício ou tipo de treino que você gosta mais ou sente que funciona melhor pra você? (opcional)'
                        : 'O que mais te atrapalha em manter o treino? (opcional)'}
                    </label>
                    <textarea
                      id="preferenciaDificuldadeTreino"
                      value={formData.preferenciaDificuldadeTreino}
                      onChange={(e) => handleChange('preferenciaDificuldadeTreino', e.target.value)}
                      placeholder="Descreva..."
                      rows="3"
                    />
                  </div>
                )}
              </>
            )}

            <div className="questionnaire-form-group">
              <label>Qual horário seria mais fácil pra você treinar, pensando na sua rotina real? *</label>
              <div className="questionnaire-radio-group">
                {['Manhã', 'Tarde', 'Noite', 'Varia muito'].map(horario => (
                  <label key={horario} className="questionnaire-radio-label">
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
          </div>
        )

      case 4:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Estrutura da Dieta</h2>
            <p className="questionnaire-step-description">
              Defina quantas refeições você consegue fazer e seu estilo preferido
            </p>

            <div className="questionnaire-form-group">
              <label>Na prática, quantas refeições você consegue fazer por dia? *</label>
              <div className="questionnaire-radio-group">
                {['3', '4', '5', 'Mais de 5'].map(qtd => (
                  <label key={qtd} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label>Você prefere refeições mais simples ou mais completas e variadas? *</label>
              <div className="questionnaire-radio-group">
                {['Mais simples', 'Um equilíbrio', 'Mais completas e variadas'].map(pref => (
                  <label key={pref} className="questionnaire-radio-label">
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

      case 5:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Alimentos do Dia a Dia</h2>
            <p className="questionnaire-step-description">
              Selecione os alimentos que você costuma consumir (opcional)
            </p>

            <div className="questionnaire-food-categories">
              {Object.entries(foodCategories).map(([key, category]) => {
                const Icon = category.icon
                return (
                  <div key={key} className="questionnaire-food-category">
                    <div className="questionnaire-food-category-header">
                      <Icon size={20} weight="fill" />
                      <h3>{category.title}</h3>
                    </div>
                    <div className="questionnaire-food-items-grid">
                      {category.items.map((item) => {
                        const isSelected = formData.alimentosDoDiaADia[key].includes(item)
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`questionnaire-food-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCheckboxGroup(key, item)}
                          >
                            <span className="questionnaire-food-item-label">{item}</span>
                            {isSelected && <span className="questionnaire-food-item-check">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="questionnaire-form-group">
              <label htmlFor="alimentosGosta">Quais alimentos você mais gosta de comer? (opcional)</label>
              <textarea
                id="alimentosGosta"
                value={formData.alimentosGosta}
                onChange={(e) => handleChange('alimentosGosta', e.target.value)}
                placeholder="Vale tudo: arroz, feijão, pizza, doce, lanche…"
                rows="2"
              />
            </div>

            <div className="questionnaire-form-group">
              <label htmlFor="alimentosEvita">E tem algum alimento que você não gosta ou costuma evitar? (opcional)</label>
              <textarea
                id="alimentosEvita"
                value={formData.alimentosEvita}
                onChange={(e) => handleChange('alimentosEvita', e.target.value)}
                placeholder="Liste os alimentos que você evita..."
                rows="2"
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Preferências e Preparação</h2>
            <p className="questionnaire-step-description">
              Como você prefere preparar e organizar suas refeições
            </p>

            <div className="questionnaire-form-group">
              <label>Quanto tempo você costuma ter pra preparar suas refeições? *</label>
              <div className="questionnaire-radio-group">
                {['Até 10 minutos', '10–30 minutos', 'Tenho tempo e gosto de cozinhar'].map(tempo => (
                  <label key={tempo} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label>Você se sente confortável em pesar alimentos? *</label>
              <div className="questionnaire-radio-group">
                {['Sim', 'Às vezes', 'Prefiro medidas caseiras'].map(conf => (
                  <label key={conf} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label>Você prefere repetir refeições ao longo da semana ou variar bastante? *</label>
              <div className="questionnaire-radio-group">
                {['Prefiro repetir', 'Um pouco de repetição é ok', 'Prefiro muita variedade'].map(var_pref => (
                  <label key={var_pref} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label>E no final de semana, como costuma ser sua alimentação? *</label>
              <div className="questionnaire-radio-group">
                {['Parecida com a semana', 'Um pouco mais solta', 'Sai totalmente do controle'].map(fimSemana => (
                  <label key={fimSemana} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="alimentacaoFimSemana"
                      value={fimSemana}
                      checked={formData.alimentacaoFimSemana === fimSemana}
                      onChange={(e) => handleChange('alimentacaoFimSemana', e.target.value)}
                    />
                    <span>{fimSemana}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Restrições e Flexibilidade</h2>
            <p className="questionnaire-step-description">
              Informe suas restrições e preferências de flexibilidade
            </p>

            <div className="questionnaire-form-group">
              <label>Você tem alguma restrição alimentar? *</label>
              <div className="questionnaire-radio-group">
                {['Nenhuma', 'Intolerância à lactose', 'Intolerância ao glúten', 'Outra'].map(restricao => (
                  <label key={restricao} className="questionnaire-radio-label">
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
              <div className="questionnaire-form-group">
                <label htmlFor="outraRestricao">Pode me contar qual é essa restrição? *</label>
                <textarea
                  id="outraRestricao"
                  value={formData.outraRestricao}
                  onChange={(e) => handleChange('outraRestricao', e.target.value)}
                  placeholder="Descreva a restrição alimentar..."
                  rows="3"
                  required
                />
              </div>
            )}

            <div className="questionnaire-form-group">
              <label>Você gostaria de ter opções de substituição nas refeições? *</label>
              <div className="questionnaire-radio-group">
                {['Sim, gosto de opções', 'Algumas opções já são suficientes', 'Prefiro algo mais fixo'].map(opcao => (
                  <label key={opcao} className="questionnaire-radio-label">
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

            <div className="questionnaire-form-group">
              <label>Você gostaria de ter algumas refeições mais livres ao longo da semana? *</label>
              <div className="questionnaire-radio-group">
                {['Sim', 'Talvez', 'Prefiro seguir o plano à risca'].map(livre => (
                  <label key={livre} className="questionnaire-radio-label">
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

      case 8:
        return (
          <div className="questionnaire-step-content">
            <h2 className="questionnaire-step-title">Saúde e Limitações</h2>
            <p className="questionnaire-step-description">
              Informações importantes sobre sua saúde para criar um plano seguro
            </p>

            <div className="questionnaire-form-group">
              <label>Você tem algum problema de saúde diagnosticado por médico? *</label>
              <div className="questionnaire-radio-group">
                {['Não', 'Sim'].map(problema => (
                  <label key={problema} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="problemasSaude"
                      value={problema}
                      checked={formData.problemasSaude === problema}
                      onChange={(e) => handleChange('problemasSaude', e.target.value)}
                    />
                    <span>{problema}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.problemasSaude === 'Sim' && (
              <div className="questionnaire-form-group">
                <label htmlFor="quaisProblemasSaude">Pode me contar quais são essas condições? *</label>
                <textarea
                  id="quaisProblemasSaude"
                  value={formData.quaisProblemasSaude}
                  onChange={(e) => handleChange('quaisProblemasSaude', e.target.value)}
                  placeholder="Ex: diabetes, pressão alta, tireoide, lipedema, SOP, ansiedade…"
                  rows="3"
                  required
                />
              </div>
            )}

            <div className="questionnaire-form-group">
              <label>Você faz uso de alguma medicação contínua atualmente? *</label>
              <div className="questionnaire-radio-group">
                {['Não', 'Sim'].map(medicacao => (
                  <label key={medicacao} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="usoMedicacao"
                      value={medicacao}
                      checked={formData.usoMedicacao === medicacao}
                      onChange={(e) => handleChange('usoMedicacao', e.target.value)}
                    />
                    <span>{medicacao}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.usoMedicacao === 'Sim' && (
              <div className="questionnaire-form-group">
                <label htmlFor="quaisMedicamentos">Quais medicamentos você utiliza? *</label>
                <textarea
                  id="quaisMedicamentos"
                  value={formData.quaisMedicamentos}
                  onChange={(e) => handleChange('quaisMedicamentos', e.target.value)}
                  placeholder="Ex: Ozempic, Mounjaro, Saxenda, insulina, anticoncepcional, antidepressivo…"
                  rows="3"
                  required
                />
              </div>
            )}

            <div className="questionnaire-form-group">
              <label>Você tem alguma dor, limitação física ou lesão que eu precise considerar? *</label>
              <div className="questionnaire-radio-group">
                {['Não', 'Sim'].map(limitacao => (
                  <label key={limitacao} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="limitacoesFisicas"
                      value={limitacao}
                      checked={formData.limitacoesFisicas === limitacao}
                      onChange={(e) => handleChange('limitacoesFisicas', e.target.value)}
                    />
                    <span>{limitacao}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.limitacoesFisicas === 'Sim' && (
              <div className="questionnaire-form-group">
                <label htmlFor="detalhesLimitacao">Me conta onde é essa dor ou limitação e o que costuma piorar ou melhorar. *</label>
                <textarea
                  id="detalhesLimitacao"
                  value={formData.detalhesLimitacao}
                  onChange={(e) => handleChange('detalhesLimitacao', e.target.value)}
                  placeholder="Descreva a limitação física..."
                  rows="3"
                  required
                />
              </div>
            )}

            <div className="questionnaire-form-group">
              <label>Algum médico já te orientou a evitar certos exercícios ou movimentos? *</label>
              <div className="questionnaire-radio-group">
                {['Não', 'Sim'].map(restricao => (
                  <label key={restricao} className="questionnaire-radio-label">
                    <input
                      type="radio"
                      name="restricoesMedicasExercicio"
                      value={restricao}
                      checked={formData.restricoesMedicasExercicio === restricao}
                      onChange={(e) => handleChange('restricoesMedicasExercicio', e.target.value)}
                    />
                    <span>{restricao}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.restricoesMedicasExercicio === 'Sim' && (
              <div className="questionnaire-form-group">
                <label htmlFor="movimentosEvitar">Quais movimentos ou atividades você foi orientado a evitar? *</label>
                <textarea
                  id="movimentosEvitar"
                  value={formData.movimentosEvitar}
                  onChange={(e) => handleChange('movimentosEvitar', e.target.value)}
                  placeholder="Descreva os movimentos a evitar..."
                  rows="3"
                  required
                />
              </div>
            )}

            <div className="questionnaire-form-group">
              <label htmlFor="receiosSaude">Existe algo relacionado à sua saúde que te preocupa quando pensa em dieta ou treino? (opcional)</label>
              <textarea
                id="receiosSaude"
                value={formData.receiosSaude}
                onChange={(e) => handleChange('receiosSaude', e.target.value)}
                placeholder="Compartilhe seus receios..."
                rows="3"
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
      <div className="questionnaire-header">
        <h1 className="questionnaire-title">Questionário de Anamnese</h1>
        <p className="questionnaire-subtitle">Vamos criar um plano personalizado para você</p>
      </div>

      <div className="questionnaire-card">
        <div className="questionnaire-progress">
          <div className="questionnaire-progress-bar">
            <div 
              className="questionnaire-progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="questionnaire-progress-text">
            Etapa {currentStep} de {totalSteps}
          </div>
        </div>

        {error && (
          <div className="questionnaire-error">
            {error}
          </div>
        )}

        {renderStepContent()}

        <div className="questionnaire-actions">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="questionnaire-btn questionnaire-btn-secondary"
              disabled={loading}
            >
              Voltar
            </button>
          )}
          
          <button
            type="button"
            onClick={handleNext}
            className="questionnaire-btn questionnaire-btn-primary"
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
