import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../config/api'
import './ConversationalQuestionnaire.css'

function ConversationalQuestionnaire({ onComplete }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({})
  const [isTyping, setIsTyping] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(73)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Persona do profissional (nutricionista/personal)
  const persona = {
    name: 'Dr. Ana Silva',
    role: 'Nutricionista',
    photo: '👩‍⚕️', // Pode ser substituído por URL de imagem
    status: 'Online'
  }

  // Perguntas conversacionais empáticas
  const questions = [
    {
      id: 'welcome',
      type: 'system',
      message: 'Olá! 👋 Que bom ter você aqui.\nEu sou o GIBA APP e vou te ajudar a criar um plano de dieta e treino que realmente funcione na sua vida real. Vai levar cerca de 5 minutos, combinado? 😊',
      skipInput: true,
      options: [
        { value: 'start', label: 'Vamos começar! 🚀' }
      ]
    },
    {
      id: 'name',
      type: 'text',
      message: 'Pra começar, como você gostaria que eu te chamasse? Pode ser seu nome ou um apelido.',
      field: 'nome',
      required: true
    },
    {
      id: 'age',
      type: 'number',
      message: 'Perfeito! Agora me diz: quantos anos você tem?',
      field: 'idade',
      required: true,
      validation: (val) => {
        const age = parseInt(val)
        if (isNaN(age) || age < 1 || age > 150) {
          return 'Por favor, me diga uma idade válida (entre 1 e 150 anos)'
        }
        return null
      }
    },
    {
      id: 'gender',
      type: 'choice',
      message: 'E qual é o seu sexo? Isso me ajuda a calcular tudo certinho.',
      field: 'sexo',
      options: [
        { value: 'Feminino', label: 'Feminino' },
        { value: 'Masculino', label: 'Masculino' },
        { value: 'Prefiro não informar', label: 'Prefiro não informar' }
      ],
      required: true
    },
    {
      id: 'height',
      type: 'number',
      message: 'Qual é a sua altura em centímetros?\nExemplo: se você tem 1,70m, digite 170.',
      field: 'altura',
      required: true,
      validation: (val) => {
        const height = parseFloat(val)
        if (isNaN(height) || height < 50 || height > 250) {
          return 'Por favor, digite uma altura válida (entre 50 e 250 cm)'
        }
        return null
      }
    },
    {
      id: 'weight',
      type: 'number',
      message: 'E seu peso atual, em quilos? Pode ser aproximado, sem pressão 😊',
      field: 'pesoAtual',
      required: true,
      validation: (val) => {
        const weight = parseFloat(val)
        if (isNaN(weight) || weight < 20 || weight > 300) {
          return 'Por favor, digite um peso válido (entre 20 e 300 kg)'
        }
        return null
      }
    },
    {
      id: 'goal',
      type: 'choice',
      message: 'Agora me conta: qual é o seu principal objetivo no momento?',
      field: 'objetivo',
      options: [
        { value: 'Emagrecer', label: 'Emagrecer' },
        { value: 'Manter o peso', label: 'Manter o peso' },
        { value: 'Ganhar massa muscular', label: 'Ganhar massa muscular' },
        { value: 'Ganhar peso de forma geral', label: 'Ganhar peso de forma geral' }
      ],
      required: true
    },
    {
      id: 'body_feelings',
      type: 'text',
      message: 'Como você se sente em relação ao seu corpo hoje?\nO que mais gostaria de mudar ou melhorar?',
      field: 'sentimentosCorpo',
      required: false
    },
    {
      id: 'success_expectation',
      type: 'text',
      message: 'Daqui a 30 dias, o que faria você olhar pra esse plano e pensar:\n"Esse plano valeu a pena"?',
      field: 'expectativaSucesso',
      required: false
    },
    {
      id: 'routine',
      type: 'text',
      message: 'Me conta como é um dia típico pra você.\nTrabalha mais sentado, em pé, se movimenta bastante? Seus horários são mais certinhos ou bem bagunçados?',
      field: 'rotinaDiaria',
      required: true
    },
    {
      id: 'sleep',
      type: 'choice',
      message: 'E seu sono, como anda hoje?',
      field: 'sono',
      options: [
        { value: 'Durmo bem', label: 'Durmo bem' },
        { value: 'Durmo mal e acordo cansado', label: 'Durmo mal e acordo cansado' },
        { value: 'Varia muito', label: 'Varia muito' }
      ],
      required: true
    },
    {
      id: 'activity_relationship',
      type: 'choice',
      message: 'Hoje, como está sua relação com atividade física?',
      field: 'frequenciaAtividade',
      options: [
        { value: 'Não pratico atualmente', label: 'Não pratico atualmente' },
        { value: '1–2x por semana', label: '1–2x por semana' },
        { value: '3–4x por semana', label: '3–4x por semana' },
        { value: '5x ou mais por semana', label: '5x ou mais por semana' }
      ],
      required: true
    },
    {
      id: 'workout_barriers',
      type: 'choice',
      message: 'O que mais te impede de treinar hoje?',
      field: 'barreirasTreino',
      options: [
        { value: 'Falta de tempo', label: 'Falta de tempo' },
        { value: 'Falta de motivação', label: 'Falta de motivação' },
        { value: 'Cansaço excessivo', label: 'Cansaço excessivo' },
        { value: 'Dor ou desconforto físico', label: 'Dor ou desconforto físico' },
        { value: 'Nunca gostei de treinar', label: 'Nunca gostei de treinar' },
        { value: 'Outro motivo', label: 'Outro motivo' }
      ],
      required: false,
      conditional: (data) => data.frequenciaAtividade === 'Não pratico atualmente',
      skipNext: 3 // Pular 3 perguntas (14, 15, 16) se esta for respondida
    },
    {
      id: 'activity_type',
      type: 'choice',
      message: 'Qual tipo de atividade você pratica ou mais gosta?',
      field: 'tipoAtividade',
      options: [
        { value: 'Musculação', label: 'Musculação' },
        { value: 'Caminhada', label: 'Caminhada' },
        { value: 'Corrida', label: 'Corrida' },
        { value: 'Ciclismo', label: 'Ciclismo' },
        { value: 'Crossfit', label: 'Crossfit' },
        { value: 'Lutas', label: 'Lutas' },
        { value: 'Yoga / Pilates', label: 'Yoga / Pilates' },
        { value: 'Dança', label: 'Dança' },
        { value: 'Esportes coletivos', label: 'Esportes coletivos' },
        { value: 'Musculação + cardio', label: 'Musculação + cardio' },
        { value: 'Outro', label: 'Outro' }
      ],
      required: false,
      conditional: (data) => data.frequenciaAtividade !== 'Não pratico atualmente'
    },
    {
      id: 'emotional_relationship_workout',
      type: 'choice',
      message: 'Qual dessas frases mais parece com você hoje?',
      field: 'relacaoEmocionalTreino',
      options: [
        { value: 'Gosto de treinar e me sinto bem', label: 'Gosto de treinar e me sinto bem' },
        { value: 'Treino mais por obrigação', label: 'Treino mais por obrigação' },
        { value: 'Treino, mas sempre acabo parando', label: 'Treino, mas sempre acabo parando' }
      ],
      required: false,
      conditional: (data) => data.frequenciaAtividade !== 'Não pratico atualmente'
    },
    {
      id: 'workout_preference_difficulty',
      type: 'text',
      message: '', // Será preenchida dinamicamente baseado na resposta anterior
      field: 'preferenciaDificuldadeTreino',
      required: false,
      conditional: (data) => data.frequenciaAtividade !== 'Não pratico atualmente' && data.relacaoEmocionalTreino,
      dynamicMessage: (data) => {
        if (data.relacaoEmocionalTreino === 'Gosto de treinar e me sinto bem') {
          return 'Tem algum exercício ou tipo de treino que você gosta mais ou sente que funciona melhor pra você?'
        } else {
          return 'O que mais te atrapalha em manter o treino?'
        }
      }
    },
    {
      id: 'workout_time',
      type: 'choice',
      message: 'Qual horário seria mais fácil pra você treinar, pensando na sua rotina real?',
      field: 'horarioTreino',
      options: [
        { value: 'Manhã', label: 'Manhã' },
        { value: 'Tarde', label: 'Tarde' },
        { value: 'Noite', label: 'Noite' },
        { value: 'Varia muito', label: 'Varia muito' }
      ],
      required: true
    },
    {
      id: 'meals_per_day',
      type: 'choice',
      message: 'Na prática, quantas refeições você consegue fazer por dia?',
      field: 'quantidadeRefeicoes',
      options: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: 'Mais de 5', label: 'Mais de 5' }
      ],
      required: true
    },
    {
      id: 'meal_style',
      type: 'choice',
      message: 'Você prefere refeições mais simples ou mais completas e variadas?',
      field: 'preferenciaRefeicoes',
      options: [
        { value: 'Mais simples', label: 'Mais simples' },
        { value: 'Um equilíbrio', label: 'Um equilíbrio' },
        { value: 'Mais completas e variadas', label: 'Mais completas e variadas' }
      ],
      required: true
    },
    {
      id: 'food_likes',
      type: 'text',
      message: 'Quais alimentos você mais gosta de comer? Vale tudo: arroz, feijão, pizza, doce, lanche…',
      field: 'alimentosGosta',
      required: false
    },
    {
      id: 'food_dislikes',
      type: 'text',
      message: 'E tem algum alimento que você não gosta ou costuma evitar?',
      field: 'alimentosEvita',
      required: false
    },
    {
      id: 'cooking_time',
      type: 'choice',
      message: 'Quanto tempo você costuma ter pra preparar suas refeições?',
      field: 'tempoPreparacao',
      options: [
        { value: 'Até 10 minutos', label: 'Até 10 minutos' },
        { value: '10–30 minutos', label: '10–30 minutos' },
        { value: 'Tenho tempo e gosto de cozinhar', label: 'Tenho tempo e gosto de cozinhar' }
      ],
      required: true
    },
    {
      id: 'weighing_comfort',
      type: 'choice',
      message: 'Você se sente confortável em pesar alimentos?',
      field: 'confortoPesar',
      options: [
        { value: 'Sim', label: 'Sim' },
        { value: 'Às vezes', label: 'Às vezes' },
        { value: 'Prefiro medidas caseiras', label: 'Prefiro medidas caseiras' }
      ],
      required: true
    },
    {
      id: 'variety_preference',
      type: 'choice',
      message: 'Você prefere repetir refeições ao longo da semana ou variar bastante?',
      field: 'preferenciaVariacao',
      options: [
        { value: 'Prefiro repetir', label: 'Prefiro repetir' },
        { value: 'Um pouco de repetição é ok', label: 'Um pouco de repetição é ok' },
        { value: 'Prefiro muita variedade', label: 'Prefiro muita variedade' }
      ],
      required: true
    },
    {
      id: 'restrictions',
      type: 'choice',
      message: 'Você tem alguma restrição alimentar?',
      field: 'restricaoAlimentar',
      options: [
        { value: 'Nenhuma', label: 'Nenhuma' },
        { value: 'Intolerância à lactose', label: 'Intolerância à lactose' },
        { value: 'Intolerância ao glúten', label: 'Intolerância ao glúten' },
        { value: 'Outra', label: 'Outra' }
      ],
      required: true
    },
    {
      id: 'other_restriction',
      type: 'text',
      message: 'Pode me contar qual é essa restrição pra eu criar algo seguro pra você?',
      field: 'outraRestricao',
      required: false,
      conditional: (data) => data.restricaoAlimentar === 'Outra'
    },
    {
      id: 'substitution_options',
      type: 'choice',
      message: 'Você gostaria de ter opções de substituição nas refeições?',
      field: 'opcoesSubstituicao',
      options: [
        { value: 'Sim, gosto de opções', label: 'Sim, gosto de opções' },
        { value: 'Algumas opções já são suficientes', label: 'Algumas opções já são suficientes' },
        { value: 'Prefiro algo mais fixo', label: 'Prefiro algo mais fixo' }
      ],
      required: true
    },
    {
      id: 'free_meals',
      type: 'choice',
      message: 'Você gostaria de ter algumas refeições mais livres ao longo da semana?',
      field: 'refeicoesLivres',
      options: [
        { value: 'Sim', label: 'Sim' },
        { value: 'Talvez', label: 'Talvez' },
        { value: 'Prefiro seguir o plano à risca', label: 'Prefiro seguir o plano à risca' }
      ],
      required: true
    },
    {
      id: 'weekend_food',
      type: 'choice',
      message: 'E no final de semana, como costuma ser sua alimentação?',
      field: 'alimentacaoFimSemana',
      options: [
        { value: 'Parecida com a semana', label: 'Parecida com a semana' },
        { value: 'Um pouco mais solta', label: 'Um pouco mais solta' },
        { value: 'Sai totalmente do controle', label: 'Sai totalmente do controle' }
      ],
      required: true
    },
    {
      id: 'health_problems',
      type: 'choice',
      message: 'Você tem algum problema de saúde diagnosticado por médico?',
      field: 'problemasSaude',
      options: [
        { value: 'Não', label: 'Não' },
        { value: 'Sim', label: 'Sim' }
      ],
      required: true
    },
    {
      id: 'which_health_problems',
      type: 'text',
      message: 'Pode me contar quais são essas condições? Ex: diabetes, pressão alta, tireoide, lipedema, SOP, ansiedade…',
      field: 'quaisProblemasSaude',
      required: false,
      conditional: (data) => data.problemasSaude === 'Sim'
    },
    {
      id: 'medication',
      type: 'choice',
      message: 'Você faz uso de alguma medicação contínua atualmente?',
      field: 'usoMedicacao',
      options: [
        { value: 'Não', label: 'Não' },
        { value: 'Sim', label: 'Sim' }
      ],
      required: true
    },
    {
      id: 'which_medications',
      type: 'text',
      message: 'Quais medicamentos você utiliza?\nEx: Ozempic, Mounjaro, Saxenda, insulina, anticoncepcional, antidepressivo…',
      field: 'quaisMedicamentos',
      required: false,
      conditional: (data) => data.usoMedicacao === 'Sim'
    },
    {
      id: 'physical_limitations',
      type: 'choice',
      message: 'Você tem alguma dor, limitação física ou lesão que eu precise considerar?',
      field: 'limitacoesFisicas',
      options: [
        { value: 'Não', label: 'Não' },
        { value: 'Sim', label: 'Sim' }
      ],
      required: true
    },
    {
      id: 'limitation_details',
      type: 'text',
      message: 'Me conta onde é essa dor ou limitação e o que costuma piorar ou melhorar.',
      field: 'detalhesLimitacao',
      required: false,
      conditional: (data) => data.limitacoesFisicas === 'Sim'
    },
    {
      id: 'exercise_restrictions',
      type: 'choice',
      message: 'Algum médico já te orientou a evitar certos exercícios ou movimentos?',
      field: 'restricoesMedicasExercicio',
      options: [
        { value: 'Não', label: 'Não' },
        { value: 'Sim', label: 'Sim' }
      ],
      required: true
    },
    {
      id: 'movements_to_avoid',
      type: 'text',
      message: 'Quais movimentos ou atividades você foi orientado a evitar?',
      field: 'movimentosEvitar',
      required: false,
      conditional: (data) => data.restricoesMedicasExercicio === 'Sim'
    },
    {
      id: 'health_concerns',
      type: 'text',
      message: 'Existe algo relacionado à sua saúde que te preocupa quando pensa em dieta ou treino?',
      field: 'receiosSaude',
      required: false
    },
    {
      id: 'complete',
      type: 'system',
      message: 'Perfeito! 🎉\nAgora já entendi sua rotina, seus objetivos, suas preferências e tudo que preciso considerar pra criar algo seguro e eficiente pra você.\nVou organizar todas essas informações e gerar seu plano de dieta e treino personalizados 💚',
      skipInput: true
    }
  ]

  useEffect(() => {
    // Desabilitar scroll do body quando o componente estiver ativo
    document.body.style.overflow = 'hidden'
    
    return () => {
      // Reabilitar scroll quando o componente desmontar
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    // Iniciar conversa com delay (apenas uma vez)
    if (messages.length === 0 && currentQuestionIndex === 0) {
      setIsTyping(true)
      const timer = setTimeout(() => {
        setIsTyping(false)
        addMessage('assistant', questions[0].message, questions[0].options)
        // Não avançar automaticamente - esperar o clique do botão
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    // Focar no input quando uma nova pergunta aparecer
    if (inputRef.current && currentQuestionIndex > 0) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [currentQuestionIndex])

  // Auto-submit quando chegar na mensagem final
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]
    const isFinalMessage = currentQuestion && currentQuestion.type === 'system' && currentQuestion.id === 'complete'
    
    // Verificar se a mensagem final já foi adicionada ao chat
    const finalMessageInChat = messages.some(msg => 
      msg.role === 'assistant' && 
      msg.content && 
      msg.content.includes('Perfeito! 🎉')
    )
    
    if (isFinalMessage && finalMessageInChat && !loading && !showSuccessAnimation) {
      console.log('🚀 Detectada mensagem final, aguardando 3 segundos para auto-submit...')
      console.log('🚀 Estado atual - loading:', loading, 'showSuccessAnimation:', showSuccessAnimation)
      // Aguardar 3 segundos após mostrar a mensagem final antes de submeter
      const timer = setTimeout(() => {
        console.log('🚀 Auto-submit após mensagem final - chamando handleSubmit')
        if (!loading && !showSuccessAnimation) {
          handleSubmit()
        } else {
          console.log('⚠️ handleSubmit não chamado - loading:', loading, 'showSuccessAnimation:', showSuccessAnimation)
        }
      }, 3000)
      
      return () => {
        console.log('🧹 Limpando timer de auto-submit')
        clearTimeout(timer)
      }
    }
  }, [currentQuestionIndex, messages, loading, showSuccessAnimation]) // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (role, content, options = null) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date(), options }])
  }

  const handleSend = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // Para perguntas do tipo choice, não verificar userInput (já foi processado pelo handleChoiceSelect)
    if (currentQuestion.type === 'choice') {
      return // Não processar, pois já foi processado pelo handleChoiceSelect
    }

    if (!userInput.trim() && currentQuestion.required) {
      setError('Por favor, responda a pergunta antes de continuar')
      return
    }

    setError('')

    // Adicionar mensagem do usuário
    if (userInput.trim()) {
      addMessage('user', userInput.trim())
    }

    // Processar resposta
    let value = userInput.trim()
    
    // Validação
    if (currentQuestion.validation) {
      const validationError = currentQuestion.validation(value)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Mapeamento de valores (para rotina diária, etc)
    if (currentQuestion.mapping) {
      const lowerValue = value.toLowerCase()
      for (const [key, mappedValue] of Object.entries(currentQuestion.mapping)) {
        if (lowerValue.includes(key)) {
          value = mappedValue
          break
        }
      }
    }

    // Salvar resposta
    if (currentQuestion.field) {
      setFormData(prev => ({
        ...prev,
        [currentQuestion.field]: value
      }))
    }

    // Limpar input
    setUserInput('')

    // Avançar para próxima pergunta com delay e indicador de "digitando..."
    advanceToNextQuestion(currentQuestion, value)
  }

  const advanceToNextQuestion = (currentQuestion, value) => {
    // Atualizar formData temporariamente para verificar condições
    const updatedFormData = { ...formData, [currentQuestion.field]: value }
    
    let nextIndex = currentQuestionIndex + 1
    
    // Verificar se precisa pular perguntas (ex: após responder barreiras de treino)
    if (currentQuestion.skipNext && currentQuestion.field) {
      nextIndex += currentQuestion.skipNext
    }
    
    if (nextIndex < questions.length) {
      let nextQuestion = questions[nextIndex]
      
      // Verificar condições e pular perguntas se necessário
      while (nextQuestion && nextQuestion.conditional) {
        const shouldShow = nextQuestion.conditional(updatedFormData)
        if (!shouldShow) {
          nextIndex++
          if (nextIndex >= questions.length) break
          nextQuestion = questions[nextIndex]
        } else {
          break
        }
      }
      
      if (nextIndex >= questions.length) {
        // Chegou ao final - mostrar mensagem final e depois submeter
        setIsTyping(true)
        const finalMessageDelay = 1500 + Math.random() * 1500
        
        setTimeout(() => {
          setIsTyping(false)
          // Adicionar mensagem final
          const finalQuestion = questions[questions.length - 1]
          if (finalQuestion && finalQuestion.type === 'system') {
            addMessage('assistant', finalQuestion.message)
            setCurrentQuestionIndex(questions.length - 1)
            
            // Após mostrar mensagem final, aguardar um pouco e submeter
            setTimeout(() => {
              handleSubmit()
            }, 2000) // 2 segundos após mostrar mensagem final
          } else {
            // Se não houver mensagem final, submeter imediatamente
            handleSubmit()
          }
        }, finalMessageDelay)
        return
      }
      
      nextQuestion = questions[nextIndex]
      
      // Preencher mensagem dinâmica se necessário
      if (nextQuestion.dynamicMessage) {
        nextQuestion.message = nextQuestion.dynamicMessage(updatedFormData)
      }
      
      // Se a próxima pergunta for a última (tipo system), mostrar e depois submeter
      if (nextQuestion.type === 'system' && nextQuestion.skipInput && nextIndex === questions.length - 1) {
        setIsTyping(true)
        const finalMessageDelay = 1500 + Math.random() * 1500
        
        setTimeout(() => {
          setIsTyping(false)
          setCurrentQuestionIndex(nextIndex)
          setTimeout(() => {
            addMessage('assistant', nextQuestion.message, nextQuestion.options)
            
            // Após mostrar mensagem final, aguardar e submeter
            setTimeout(() => {
              handleSubmit()
            }, 2000) // 2 segundos após mostrar mensagem final
          }, 300)
        }, finalMessageDelay)
        return
      }
      
      // Mostrar indicador de "digitando..."
      setIsTyping(true)
      
      // Delay aleatório entre 1.5s e 3s para simular resposta natural
      const typingDelay = 1500 + Math.random() * 1500
      
      setTimeout(() => {
        setIsTyping(false)
        setCurrentQuestionIndex(nextIndex)
        setTimeout(() => {
          addMessage('assistant', nextQuestion.message, nextQuestion.options)
        }, 300)
      }, typingDelay)
    } else {
      // Finalizar questionário - mostrar mensagem final se existir
      const finalQuestion = questions[questions.length - 1]
      if (finalQuestion && finalQuestion.type === 'system' && finalQuestion.skipInput) {
        setIsTyping(true)
        const finalMessageDelay = 1500 + Math.random() * 1500
        
        setTimeout(() => {
          setIsTyping(false)
          setCurrentQuestionIndex(questions.length - 1)
          setTimeout(() => {
            addMessage('assistant', finalQuestion.message)
            
            // Após mostrar mensagem final, aguardar e submeter
            setTimeout(() => {
              handleSubmit()
            }, 2000) // 2 segundos após mostrar mensagem final
          }, 300)
        }, finalMessageDelay)
      } else {
        // Se não houver mensagem final, submeter imediatamente
        setIsTyping(false)
        setTimeout(() => {
          handleSubmit()
        }, 1000)
      }
    }
  }

  const handleChoiceSelect = (value) => {
    // Limpar erro imediatamente
    setError('')
    
    // Processar a resposta diretamente sem depender do estado
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // Se for a mensagem inicial (welcome), apenas avançar sem salvar
    if (currentQuestion.id === 'welcome' && value === 'start') {
      addMessage('user', 'Vamos começar!')
      setUserInput('')
      
      // Avançar para próxima pergunta (índice 1)
      const nextIndex = 1
      if (nextIndex < questions.length) {
        const nextQuestion = questions[nextIndex]
        setIsTyping(true)
        const typingDelay = 1500 + Math.random() * 1500
        
        setTimeout(() => {
          setIsTyping(false)
          setCurrentQuestionIndex(nextIndex)
          setTimeout(() => {
            addMessage('assistant', nextQuestion.message, nextQuestion.options)
          }, 300)
        }, typingDelay)
      }
      return
    }

    // Para outras perguntas, processar normalmente
    // Definir o valor e processar imediatamente
    setUserInput(value)

    // Salvar resposta imediatamente
    if (currentQuestion.field) {
      setFormData(prev => ({
        ...prev,
        [currentQuestion.field]: value
      }))
    }

    // Adicionar mensagem do usuário
    addMessage('user', value)

    // Limpar input
    setUserInput('')

    // Avançar para próxima pergunta
    advanceToNextQuestion(currentQuestion, value)
  }

  const handleSubmit = async () => {
    console.log('📤 handleSubmit chamado')
    console.log('📤 showSuccessAnimation:', showSuccessAnimation)
    console.log('📤 loading:', loading)
    
    // Prevenir múltiplas chamadas
    if (loading || showSuccessAnimation) {
      console.log('⚠️ handleSubmit já em execução ou animação já mostrada, ignorando...')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      // Preparar dados no formato esperado pelo backend
      const payload = {
        // Dados básicos
        idade: parseInt(formData.idade),
        sexo: formData.sexo === 'Prefiro não informar' ? null : formData.sexo,
        altura: parseFloat(formData.altura),
        pesoAtual: parseFloat(formData.pesoAtual),
        objetivo: formData.objetivo,
        
        // Sentimentos e expectativas
        sentimentosCorpo: formData.sentimentosCorpo || '',
        expectativaSucesso: formData.expectativaSucesso || '',
        
        // Rotina e sono
        rotinaDiaria: formData.rotinaDiaria,
        sono: formData.sono,
        
        // Atividade física
        frequenciaAtividade: formData.frequenciaAtividade,
        barreirasTreino: formData.barreirasTreino || '',
        tipoAtividade: formData.tipoAtividade || '',
        relacaoEmocionalTreino: formData.relacaoEmocionalTreino || '',
        preferenciaDificuldadeTreino: formData.preferenciaDificuldadeTreino || '',
        horarioTreino: formData.horarioTreino,
        
        // Alimentação
        quantidadeRefeicoes: formData.quantidadeRefeicoes,
        preferenciaRefeicoes: formData.preferenciaRefeicoes,
        alimentosGosta: formData.alimentosGosta || '',
        alimentosEvita: formData.alimentosEvita || '',
        tempoPreparacao: formData.tempoPreparacao,
        confortoPesar: formData.confortoPesar,
        preferenciaVariacao: formData.preferenciaVariacao,
        restricaoAlimentar: formData.restricaoAlimentar,
        outraRestricao: formData.outraRestricao || '',
        opcoesSubstituicao: formData.opcoesSubstituicao,
        refeicoesLivres: formData.refeicoesLivres,
        alimentacaoFimSemana: formData.alimentacaoFimSemana,
        
        // Saúde e limitações
        problemasSaude: formData.problemasSaude,
        quaisProblemasSaude: formData.quaisProblemasSaude || '',
        usoMedicacao: formData.usoMedicacao,
        quaisMedicamentos: formData.quaisMedicamentos || '',
        limitacoesFisicas: formData.limitacoesFisicas,
        detalhesLimitacao: formData.detalhesLimitacao || '',
        restricoesMedicasExercicio: formData.restricoesMedicasExercicio,
        movimentosEvitar: formData.movimentosEvitar || '',
        receiosSaude: formData.receiosSaude || '',
        
        // Campos legados para compatibilidade (mapear quando necessário)
        rotinaTreinoDetalhada: formData.preferenciaDificuldadeTreino || '',
        outraAtividade: '',
        
        // Alimentos do dia a dia (vazio por padrão)
        alimentosDoDiaADia: {
          carboidratos: [],
          proteinas: [],
          gorduras: [],
          frutas: []
        }
      }

      // Validar campos obrigatórios antes de enviar
      const requiredFields = [
        'idade', 'altura', 'pesoAtual', 'objetivo', 'rotinaDiaria', 'sono',
        'frequenciaAtividade', 'horarioTreino', 'quantidadeRefeicoes',
        'preferenciaRefeicoes', 'tempoPreparacao', 'confortoPesar',
        'preferenciaVariacao', 'restricaoAlimentar', 'opcoesSubstituicao',
        'refeicoesLivres', 'problemasSaude', 'usoMedicacao',
        'limitacoesFisicas', 'restricoesMedicasExercicio'
      ]
      
      const missingFields = requiredFields.filter(field => {
        const value = payload[field]
        return value === undefined || value === null || value === ''
      })
      
      if (missingFields.length > 0) {
        console.error('❌ Campos obrigatórios faltando:', missingFields)
        console.error('📦 Payload completo:', payload)
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`)
      }

      console.log('📤 Enviando questionário para o backend...')
      console.log('📦 Payload:', JSON.stringify(payload, null, 2))

      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      let data
      try {
        const responseText = await response.text()
        if (!responseText) {
          throw new Error('Resposta vazia do servidor')
        }
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta:', parseError)
        throw new Error(`Erro ao processar resposta do servidor: ${parseError.message}`)
      }

      if (!response.ok) {
        console.error('❌ Erro do servidor:', response.status, data)
        const errorMessage = data.error || 'Erro ao salvar questionário'
        const errorDetails = data.details ? `: ${data.details}` : ''
        const validationErrors = data.validationErrors ? `\nErros de validação: ${JSON.stringify(data.validationErrors, null, 2)}` : ''
        throw new Error(`${errorMessage}${errorDetails}${validationErrors}`)
      }

      console.log('✅ Questionário salvo com sucesso no backend')

      // Chamar callback ANTES da animação para atualizar o estado no componente pai
      // Isso garante que o estado seja atualizado antes de redirecionar
      if (onComplete) {
        onComplete()
      }

      // Mostrar animação de sucesso
      setShowSuccessAnimation(true)
      
      // Após a animação, redirecionar para dashboard do paciente (tela principal)
      setTimeout(() => {
        navigate('/paciente/dashboard', { replace: true })
      }, 3500) // 3.5 segundos para a animação

    } catch (err) {
      console.error('Erro ao enviar questionário:', err)
      setError(err.message || 'Erro ao salvar questionário')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isComplete = currentQuestionIndex >= questions.length - 1
  const isFinalMessage = currentQuestion && currentQuestion.type === 'system' && currentQuestion.id === 'complete'
  const showInput = currentQuestion && !currentQuestion.skipInput && !isComplete && !isFinalMessage

  // Preencher mensagem dinâmica se necessário
  if (currentQuestion && currentQuestion.dynamicMessage) {
    currentQuestion.message = currentQuestion.dynamicMessage(formData)
  }

  // #region agent log
  useEffect(() => {
    const updateHeaderHeight = () => {
      const pacienteHeader = document.querySelector('.paciente-header')
      if (pacienteHeader) {
        const height = pacienteHeader.getBoundingClientRect().height
        setHeaderHeight(height)
        
        // Aplicar altura dinamicamente ao elemento
        const convQuestionnaire = document.querySelector('.conversational-questionnaire')
        if (convQuestionnaire) {
          convQuestionnaire.style.top = `${height}px`
          convQuestionnaire.style.height = `calc(100vh - ${height}px)`
        }
        
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'ConversationalQuestionnaire.jsx:updateHeaderHeight',
            message: 'Setting dynamic header height - POST FIX',
            data: {
              headerHeight: height,
              appliedTop: height,
              appliedHeight: `calc(100vh - ${height}px)`
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'post-fix',
            hypothesisId: 'A'
          })
        }).catch(() => {})
      }
    }
    
    updateHeaderHeight()
    
    // Observar mudanças no header (resize, etc)
    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    const pacienteHeader = document.querySelector('.paciente-header')
    if (pacienteHeader) {
      resizeObserver.observe(pacienteHeader)
    }
    
    window.addEventListener('resize', updateHeaderHeight)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
    }
  }, [])
  // #endregion

  // Se mostrar animação de sucesso, renderizar apenas ela
  if (showSuccessAnimation) {
    return (
      <div className="conversational-questionnaire success-animation-container" data-page="questionnaire">
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="checkmark-circle">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
          </div>
          <div className="success-content">
            <h2 className="success-title">Questionário Concluído! 🎉</h2>
            <p className="success-message">
              Parabéns! Você completou todas as perguntas com sucesso.
            </p>
            <p className="success-submessage">
              Agora vamos criar seu plano personalizado de dieta e treino!
            </p>
          </div>
          <div className="success-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="conversational-questionnaire" data-page="questionnaire">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-back">
            <button 
              onClick={() => navigate(-1)}
              className="back-button"
              aria-label="Voltar"
            >
              ←
            </button>
          </div>
          <div className="chat-header-avatar">
            <div className="persona-avatar">
              {persona.photo}
            </div>
          </div>
          <div className="chat-header-info">
            <h2>{persona.name}</h2>
            <p className="persona-status">{persona.status}</p>
          </div>
          <div className="chat-header-actions">
            <button className="header-action-button" aria-label="Mais opções">
              ⋮
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="message-avatar">💚</div>
              )}
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                {msg.options && (
                  <div className="message-options">
                    {msg.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        className="option-button"
                        onClick={() => handleChoiceSelect(option.value)}
                        disabled={loading || isTyping}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Indicador de "digitando..." */}
          {isTyping && (
            <div className="message assistant typing-indicator">
              <div className="message-avatar">💚</div>
              <div className="message-content">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        {showInput && !isTyping && (
          <div className="chat-input-container">
            {currentQuestion.type === 'text' || currentQuestion.type === 'number' ? (
              <input
                ref={inputRef}
                type={currentQuestion.type === 'number' ? 'number' : 'text'}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua resposta..."
                disabled={loading || isTyping}
                className="chat-input"
              />
            ) : null}
            <button
              onClick={handleSend}
              disabled={loading || isTyping || (!userInput.trim() && currentQuestion.required)}
              className="chat-send-button"
              aria-label="Enviar mensagem"
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        )}

        {loading && isComplete && (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <p>Processando suas respostas...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationalQuestionnaire
