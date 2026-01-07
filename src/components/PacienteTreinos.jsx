import { useState, useEffect } from 'react'
import { API_URL } from '../config/api'
import { useBranding } from '../hooks/useBranding'
import RestTimer from './RestTimer'
import WorkoutShareImage from './WorkoutShareImage'
import WeeklyWorkoutCalendar from './WeeklyWorkoutCalendar'
import './PacienteTreinos.css'

const DIAS_SEMANA = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']
const DIAS_SEMANA_LABELS = {
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sáb',
  DOMINGO: 'Dom'
}

function PacienteTreinos({ refreshTrigger }) {
  const [prescricoes, setPrescricoes] = useState([])
  const [treinosExecutados, setTreinosExecutados] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [treinoParaFinalizar, setTreinoParaFinalizar] = useState(null)
  const [showSolicitacaoModal, setShowSolicitacaoModal] = useState(false)
  const [prescricaoParaSolicitar, setPrescricaoParaSolicitar] = useState(null)
  const [personalInfo, setPersonalInfo] = useState(null)
  const [personalId, setPersonalId] = useState(null)
  const { branding, loading: brandingLoading } = useBranding(personalId)
  const [divisaoVisualizando, setDivisaoVisualizando] = useState(null) // Divisão sendo visualizada (sem iniciar)
  const [showShareImage, setShowShareImage] = useState(false)
  const [treinoFinalizadoData, setTreinoFinalizadoData] = useState(null) // Dados do treino finalizado para compartilhar
  const [treinosSemanaData, setTreinosSemanaData] = useState(null) // Dados dos treinos da semana para o calendário
  const [expandedDivisoes, setExpandedDivisoes] = useState(new Set()) // Divisões expandidas (collapse)
  
  // Estados do formulário de feedback
  const [feedbackForm, setFeedbackForm] = useState({
    observacao: '',
    intensidade: 5,
    dificuldade: 5,
    satisfacao: 5,
    completouTreino: true,
    motivoIncompleto: ''
  })
  
  // Estados do formulário de solicitação
  const [solicitacaoForm, setSolicitacaoForm] = useState({
    titulo: '',
    mensagem: ''
  })

  useEffect(() => {
    loadPersonalInfo()
    loadTreinos()
    loadTreinosExecutados()
    loadTreinosSemana()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  // Expandir primeira divisão por padrão quando carregar treinos
  useEffect(() => {
    if (prescricoes.length > 0) {
      const rotinaAtiva = prescricoes.find(p => p.ativo) || prescricoes[0] || null
      if (rotinaAtiva && rotinaAtiva.divisoes?.length > 0 && expandedDivisoes.size === 0) {
        const primeiraDivisaoId = rotinaAtiva.divisoes[0].id
        setExpandedDivisoes(new Set([primeiraDivisaoId]))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescricoes])

  const loadPersonalInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user?.personalId) {
          setPersonalId(data.user.personalId)
          // Tentar buscar informações do personal através da rota de admin
          try {
            const personalResponse = await fetch(`${API_URL}/admin/users/${data.user.personalId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            if (personalResponse.ok) {
              const personalData = await personalResponse.json()
              setPersonalInfo(personalData)
            } else {
              // Se não conseguir, usar dados básicos do perfil
              setPersonalInfo({ name: null, email: null })
            }
          } catch (err) {
            // Se não conseguir buscar, usar dados básicos
            console.warn('Não foi possível buscar dados completos do personal:', err)
            setPersonalInfo({ name: null, email: null })
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar informações do personal:', err)
    }
  }

  const loadTreinos = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/prescricoes-treino`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        setError('Erro ao carregar seus treinos')
        setPrescricoes([])
        return
      }

      const data = await response.json()
      const lista = Array.isArray(data.prescricoes) ? data.prescricoes : []
      const ativos = lista.filter((p) => p.ativo !== false)
      setPrescricoes(ativos)
    } catch (err) {
      console.error('Erro ao carregar treinos do paciente:', err)
      setError('Erro ao carregar seus treinos')
      setPrescricoes([])
    } finally {
      setLoading(false)
    }
  }

  const loadTreinosExecutados = async () => {
    try {
      const token = localStorage.getItem('token')
      const hoje = new Date().toISOString().split('T')[0]
      const response = await fetch(`${API_URL}/treinos-executados/semana/${hoje}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Organizar por prescricaoId e divisaoId
        // Agora armazenamos todos os treinos em um array, não apenas por dia
        const treinosMap = {}
        Object.keys(data.treinosPorDia || {}).forEach(dia => {
          data.treinosPorDia[dia].forEach(treino => {
            const key = `${treino.prescricaoId}-${treino.divisaoId}`
            if (!treinosMap[key]) {
              treinosMap[key] = []
            }
            // Adicionar o treino ao array (pode ter múltiplos treinos da mesma divisão na semana)
            // Garantir que o campo finalizado está presente e é boolean
            const treinoCompleto = {
              ...treino,
              finalizado: treino.finalizado === true || treino.finalizado === 'true' || treino.finalizado === 1,
              dataExecucao: treino.dataExecucao || treino.createdAt || new Date().toISOString()
            }
            treinosMap[key].push(treinoCompleto)
          })
        })
        setTreinosExecutados(treinosMap)
      }
    } catch (err) {
      console.error('Erro ao carregar treinos executados:', err)
    }
  }

  const loadTreinosSemana = async () => {
    try {
      const token = localStorage.getItem('token')
      const hoje = new Date().toISOString().split('T')[0]
      const response = await fetch(`${API_URL}/treinos-executados/semana/${hoje}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTreinosSemanaData(data)
      }
    } catch (err) {
      console.error('Erro ao carregar treinos da semana:', err)
    }
  }

  const handleDayClick = async (treinoExecutado) => {
    try {
      const token = localStorage.getItem('token')
      
      // Buscar dados completos do treino
      const treinoData = await fetch(`${API_URL}/treinos-executados/${treinoExecutado.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const treinoInfo = treinoData.ok ? await treinoData.json() : null
      
      // Buscar estatísticas da semana
      const hoje = new Date().toISOString().split('T')[0]
      const semanaResponse = await fetch(`${API_URL}/treinos-executados/semana/${hoje}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const semanaData = semanaResponse.ok ? await semanaResponse.json() : null
      
      // Calcular estatísticas
      const treinosSemana = semanaData?.treinosPorDia ? 
        Object.values(semanaData.treinosPorDia).flat().filter(t => t.finalizado) : []
      
      // Usar duração salva quando o treino foi finalizado, ou calcular se não tiver salvo (fallback)
      let duracaoTreino = treinoInfo?.treinoExecutado?.duracaoMinutos
      
      // Se não tiver duração salva (treino antigo ou erro), calcular como fallback
      if (!duracaoTreino && treinoInfo?.treinoExecutado?.dataExecucao) {
        const dataInicio = new Date(treinoInfo.treinoExecutado.dataExecucao)
        duracaoTreino = Math.max(1, Math.round((new Date() - dataInicio) / 1000 / 60))
      }
      
      // Garantir que tenha pelo menos 1 minuto
      if (!duracaoTreino || duracaoTreino < 1) {
        duracaoTreino = 1
      }
      
      // Mapear dias treinados da semana
      const diasTreinados = {
        SEGUNDA: false,
        TERCA: false,
        QUARTA: false,
        QUINTA: false,
        SEXTA: false,
        SABADO: false,
        DOMINGO: false
      }
      
      if (semanaData?.treinosPorDia) {
        Object.keys(semanaData.treinosPorDia).forEach(dia => {
          if (semanaData.treinosPorDia[dia]?.length > 0) {
            diasTreinados[dia] = true
          }
        })
      }
      
      // Buscar quantidade de exercícios e informações adicionais
      let quantidadeExercicios = treinoInfo?.treinoExecutado?.divisao?.itens?.length || 0
      let totalSeries = 0
      let gruposMusculares = []
      let exerciciosRealizados = []
      
      // Primeiro, tentar usar dados do treino executado (se disponível)
      if (treinoInfo?.treinoExecutado?.divisao?.itens && treinoInfo.treinoExecutado.divisao.itens.length > 0) {
        exerciciosRealizados = treinoInfo.treinoExecutado.divisao.itens.map(item => ({
          nome: item.exercicio?.nome || 'Exercício',
          categoria: item.exercicio?.categoria || '',
          series: item.series || 0,
          repeticoes: item.repeticoes || '',
          ordem: item.ordem || 0
        }))
        quantidadeExercicios = exerciciosRealizados.length
        totalSeries = exerciciosRealizados.reduce((sum, item) => sum + (item.series || 0), 0)
        gruposMusculares = exerciciosRealizados
          .map(item => item.categoria)
          .filter(cat => cat)
          .filter((cat, index, arr) => arr.indexOf(cat) === index)
      }
      
      // Se não tiver dados completos, buscar da prescrição
      if (exerciciosRealizados.length === 0) {
        const prescricao = prescricoes.find(p => p.id === treinoExecutado.prescricaoId)
        if (prescricao?.divisoes) {
          const divisao = prescricao.divisoes.find(d => d.id === treinoInfo?.treinoExecutado?.divisaoId)
          if (divisao?.itens) {
            exerciciosRealizados = divisao.itens.map(item => ({
              nome: item.exercicio?.nome || 'Exercício',
              categoria: item.exercicio?.categoria || '',
              series: item.series || 0,
              repeticoes: item.repeticoes || '',
              ordem: item.ordem || 0
            }))
            if (quantidadeExercicios === 0) {
              quantidadeExercicios = exerciciosRealizados.length
            }
            
            // Calcular total de séries
            totalSeries = exerciciosRealizados.reduce((sum, item) => sum + (item.series || 0), 0)
            
            // Extrair grupos musculares das categorias dos exercícios
            gruposMusculares = exerciciosRealizados
              .map(item => item.categoria)
              .filter(cat => cat)
              .filter((cat, index, arr) => arr.indexOf(cat) === index)
          }
        }
      }
      
      // Extrair grupo muscular do nome da divisão se não tiver categorias
      let grupoMuscular = ''
      const nomeDivisao = treinoInfo?.treinoExecutado?.divisao?.nome || ''
      
      // Se tiver categorias dos exercícios, usar elas
      if (gruposMusculares.length > 0) {
        grupoMuscular = gruposMusculares.slice(0, 2).join(' & ')
      } else {
        // Tentar extrair do nome da divisão (formato: "A - Peito e Tríceps" ou "Peito & Tríceps")
        // Remover prefixo como "A -", "B -", etc.
        let nomeLimpo = nomeDivisao.replace(/^[A-Z]\s*-\s*/i, '').trim()
        
        // Se contém " e " ou " & ", usar isso
        if (nomeLimpo.includes(' e ')) {
          const partes = nomeLimpo.split(' e ')
          grupoMuscular = partes.slice(0, 2).map(p => p.trim()).join(' & ')
        } else if (nomeLimpo.includes(' & ')) {
          grupoMuscular = nomeLimpo
        } else {
          // Tentar extrair palavras capitalizadas
          const match = nomeLimpo.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)
          if (match && match.length > 0) {
            grupoMuscular = match.slice(0, 2).join(' & ')
          } else {
            grupoMuscular = nomeLimpo
          }
        }
      }
      
      // Calcular intensidade baseado em duração e volume
      let intensidade = 'Moderado'
      const volumeTotal = totalSeries * quantidadeExercicios
      if (duracaoTreino > 90 || volumeTotal > 30) {
        intensidade = 'Intenso'
      } else if (duracaoTreino < 45 || volumeTotal < 15) {
        intensidade = 'Leve'
      }
      
      // Tag emocional baseada na constância
      let tagEmocional = 'Feito'
      if (treinosSemana.length >= 5) {
        tagEmocional = 'Constante'
      } else if (treinosSemana.length >= 3) {
        tagEmocional = 'Focado'
      }
      
      // Calcular tempo médio por exercício
      const tempoMedioPorExercicio = quantidadeExercicios > 0 
        ? Math.round(duracaoTreino / quantidadeExercicios) 
        : 0
      
      // Preparar dados para imagem compartilhável
      setTreinoFinalizadoData({
        treinoNome: treinoInfo?.treinoExecutado?.divisao?.nome || 'Treino',
        grupoMuscular: grupoMuscular || treinoInfo?.treinoExecutado?.divisao?.nome || 'Treino',
        duracaoMinutos: duracaoTreino,
        quantidadeExercicios: quantidadeExercicios,
        totalSeries: totalSeries,
        intensidade: intensidade,
        tagEmocional: tagEmocional,
        exercicios: exerciciosRealizados,
        tempoMedioPorExercicio: tempoMedioPorExercicio,
        treinosSemana: treinosSemana.length,
        diasTreinados: diasTreinados,
        data: new Date(treinoExecutado.dataExecucao).toLocaleDateString('pt-BR')
      })
      setShowShareImage(true)
    } catch (err) {
      console.error('Erro ao carregar dados do treino:', err)
      alert('Erro ao carregar dados do treino')
    }
  }

  const getDiaSemanaAtual = () => {
    const hoje = new Date()
    const dia = hoje.getDay()
    const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
    return dias[dia]
  }

  const handleVerTreino = (divisao) => {
    setDivisaoVisualizando(divisao)
  }

  const handleFecharVisualizacao = () => {
    setDivisaoVisualizando(null)
  }

  const toggleDivisaoCollapse = (divisaoId) => {
    setExpandedDivisoes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(divisaoId)) {
        newSet.delete(divisaoId)
      } else {
        newSet.add(divisaoId)
      }
      return newSet
    })
  }

  const isDivisaoExpanded = (divisaoId) => {
    return expandedDivisoes.has(divisaoId)
  }

  const handleIniciarTreino = async (prescricaoId, divisaoId) => {
    try {
      const token = localStorage.getItem('token')
      const diaSemana = getDiaSemanaAtual()
      
      const response = await fetch(`${API_URL}/treinos-executados/iniciar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescricaoId,
          divisaoId,
          diaSemana
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao iniciar treino')
        return
      }

      await loadTreinosExecutados()
      // Não mostrar alert, apenas atualizar a interface
    } catch (err) {
      console.error('Erro ao iniciar treino:', err)
      alert('Erro ao iniciar treino')
    }
  }

  const handleFinalizarTreino = (treinoExecutado) => {
    setTreinoParaFinalizar(treinoExecutado)
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async () => {
    if (!treinoParaFinalizar) return

    try {
      const token = localStorage.getItem('token')
      
      // Garantir que todos os valores sejam válidos antes de enviar
      const feedbackData = {
        treinoExecutadoId: treinoParaFinalizar.id,
        observacao: feedbackForm.observacao && feedbackForm.observacao.trim() !== '' ? feedbackForm.observacao.trim() : undefined,
        intensidade: feedbackForm.intensidade && !isNaN(parseInt(feedbackForm.intensidade)) ? parseInt(feedbackForm.intensidade) : undefined,
        dificuldade: feedbackForm.dificuldade && !isNaN(parseInt(feedbackForm.dificuldade)) ? parseInt(feedbackForm.dificuldade) : undefined,
        satisfacao: feedbackForm.satisfacao && !isNaN(parseInt(feedbackForm.satisfacao)) ? parseInt(feedbackForm.satisfacao) : undefined,
        completouTreino: feedbackForm.completouTreino === true || feedbackForm.completouTreino === 'true' || feedbackForm.completouTreino === true,
        motivoIncompleto: feedbackForm.motivoIncompleto && feedbackForm.motivoIncompleto.trim() !== '' ? feedbackForm.motivoIncompleto.trim() : undefined
      }
      
      console.log('Enviando feedback:', feedbackData)
      
      const response = await fetch(`${API_URL}/treinos-executados/finalizar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro ao finalizar treino:', errorData)
        alert(errorData.error || errorData.details || 'Erro ao finalizar treino. Verifique o console para mais detalhes.')
        return
      }

      // Calcular duração do treino
      const treinoData = await fetch(`${API_URL}/treinos-executados/${treinoParaFinalizar.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const treinoInfo = treinoData.ok ? await treinoData.json() : null
      
      // Buscar estatísticas da semana
      const hoje = new Date().toISOString().split('T')[0]
      const semanaResponse = await fetch(`${API_URL}/treinos-executados/semana/${hoje}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const semanaData = semanaResponse.ok ? await semanaResponse.json() : null
      
      // Calcular estatísticas
      const treinosSemana = semanaData?.treinosPorDia ? 
        Object.values(semanaData.treinosPorDia).flat().filter(t => t.finalizado) : []
      
      // Usar duração salva quando o treino foi finalizado, ou calcular se não tiver salvo (fallback)
      let duracaoTreino = treinoInfo?.treinoExecutado?.duracaoMinutos
      
      // Se não tiver duração salva (treino antigo ou erro), calcular como fallback
      if (!duracaoTreino && treinoInfo?.treinoExecutado?.dataExecucao) {
        const dataInicio = new Date(treinoInfo.treinoExecutado.dataExecucao)
        duracaoTreino = Math.max(1, Math.round((new Date() - dataInicio) / 1000 / 60))
      }
      
      // Garantir que tenha pelo menos 1 minuto
      if (!duracaoTreino || duracaoTreino < 1) {
        duracaoTreino = 1
      }
      
      setShowFeedbackModal(false)
      setTreinoParaFinalizar(null)
      setFeedbackForm({
        observacao: '',
        intensidade: 5,
        dificuldade: 5,
        satisfacao: 5,
        completouTreino: true,
        motivoIncompleto: ''
      })
      await loadTreinosExecutados()
      await loadTreinosSemana()
      
      // Preparar dados para imagem compartilhável
      // Mapear dias treinados da semana
      const diasTreinados = {
        SEGUNDA: false,
        TERCA: false,
        QUARTA: false,
        QUINTA: false,
        SEXTA: false,
        SABADO: false,
        DOMINGO: false
      }
      
      if (semanaData?.treinosPorDia) {
        Object.keys(semanaData.treinosPorDia).forEach(dia => {
          if (semanaData.treinosPorDia[dia]?.length > 0) {
            diasTreinados[dia] = true
          }
        })
      }
      
      // Buscar quantidade de exercícios e informações adicionais
      let quantidadeExercicios = treinoInfo?.treinoExecutado?.divisao?.itens?.length || 0
      let totalSeries = 0
      let gruposMusculares = []
      let exerciciosRealizados = []
      
      // Primeiro, tentar usar dados do treino executado (se disponível)
      if (treinoInfo?.treinoExecutado?.divisao?.itens && treinoInfo.treinoExecutado.divisao.itens.length > 0) {
        exerciciosRealizados = treinoInfo.treinoExecutado.divisao.itens.map(item => ({
          nome: item.exercicio?.nome || 'Exercício',
          categoria: item.exercicio?.categoria || '',
          series: item.series || 0,
          repeticoes: item.repeticoes || '',
          ordem: item.ordem || 0
        }))
        quantidadeExercicios = exerciciosRealizados.length
        totalSeries = exerciciosRealizados.reduce((sum, item) => sum + (item.series || 0), 0)
        gruposMusculares = exerciciosRealizados
          .map(item => item.categoria)
          .filter(cat => cat)
          .filter((cat, index, arr) => arr.indexOf(cat) === index)
      }
      
      // Se não tiver dados completos, buscar da prescrição
      if (exerciciosRealizados.length === 0) {
        const prescricao = prescricoes.find(p => p.id === treinoParaFinalizar.prescricaoId)
        if (prescricao?.divisoes) {
          const divisao = prescricao.divisoes.find(d => d.id === treinoInfo?.treinoExecutado?.divisaoId)
          if (divisao?.itens) {
            exerciciosRealizados = divisao.itens.map(item => ({
              nome: item.exercicio?.nome || 'Exercício',
              categoria: item.exercicio?.categoria || '',
              series: item.series || 0,
              repeticoes: item.repeticoes || '',
              ordem: item.ordem || 0
            }))
            if (quantidadeExercicios === 0) {
              quantidadeExercicios = exerciciosRealizados.length
            }
            
            // Calcular total de séries
            totalSeries = exerciciosRealizados.reduce((sum, item) => sum + (item.series || 0), 0)
            
            // Extrair grupos musculares das categorias dos exercícios
            gruposMusculares = exerciciosRealizados
              .map(item => item.categoria)
              .filter(cat => cat)
              .filter((cat, index, arr) => arr.indexOf(cat) === index)
          }
        }
      }
      
      // Extrair grupo muscular do nome da divisão se não tiver categorias
      let grupoMuscular = ''
      const nomeDivisao = treinoInfo?.treinoExecutado?.divisao?.nome || ''
      
      // Se tiver categorias dos exercícios, usar elas
      if (gruposMusculares.length > 0) {
        grupoMuscular = gruposMusculares.slice(0, 2).join(' & ')
      } else {
        // Tentar extrair do nome da divisão (formato: "A - Peito e Tríceps" ou "Peito & Tríceps")
        // Remover prefixo como "A -", "B -", etc.
        let nomeLimpo = nomeDivisao.replace(/^[A-Z]\s*-\s*/i, '').trim()
        
        // Se contém " e " ou " & ", usar isso
        if (nomeLimpo.includes(' e ')) {
          const partes = nomeLimpo.split(' e ')
          grupoMuscular = partes.slice(0, 2).map(p => p.trim()).join(' & ')
        } else if (nomeLimpo.includes(' & ')) {
          grupoMuscular = nomeLimpo
        } else {
          // Tentar extrair palavras capitalizadas
          const match = nomeLimpo.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)
          if (match && match.length > 0) {
            grupoMuscular = match.slice(0, 2).join(' & ')
          } else {
            grupoMuscular = nomeLimpo
          }
        }
      }
      
      // Calcular intensidade baseado em duração e volume
      let intensidade = 'Moderado'
      const volumeTotal = totalSeries * quantidadeExercicios
      if (duracaoTreino > 90 || volumeTotal > 30) {
        intensidade = 'Intenso'
      } else if (duracaoTreino < 45 || volumeTotal < 15) {
        intensidade = 'Leve'
      }
      
      // Tag emocional baseada na constância
      let tagEmocional = 'Feito'
      if (treinosSemana.length >= 5) {
        tagEmocional = 'Constante'
      } else if (treinosSemana.length >= 3) {
        tagEmocional = 'Focado'
      }
      
      // Calcular tempo médio por exercício
      const tempoMedioPorExercicio = quantidadeExercicios > 0 
        ? Math.round(duracaoTreino / quantidadeExercicios) 
        : 0
      
      // Preparar dados para imagem compartilhável
      setTreinoFinalizadoData({
        treinoNome: treinoInfo?.treinoExecutado?.divisao?.nome || 'Treino',
        grupoMuscular: grupoMuscular || treinoInfo?.treinoExecutado?.divisao?.nome || 'Treino',
        duracaoMinutos: duracaoTreino,
        quantidadeExercicios: quantidadeExercicios,
        totalSeries: totalSeries,
        intensidade: intensidade,
        tagEmocional: tagEmocional,
        exercicios: exerciciosRealizados,
        tempoMedioPorExercicio: tempoMedioPorExercicio,
        treinosSemana: treinosSemana.length,
        diasTreinados: diasTreinados,
        data: new Date().toLocaleDateString('pt-BR')
      })
      setShowShareImage(true)
    } catch (err) {
      console.error('Erro ao finalizar treino:', err)
      alert('Erro ao finalizar treino')
    }
  }

  const handleAbrirSolicitacao = (prescricao) => {
    setPrescricaoParaSolicitar(prescricao)
    setShowSolicitacaoModal(true)
  }

  const handleSubmitSolicitacao = async () => {
    if (!prescricaoParaSolicitar || !solicitacaoForm.titulo || !solicitacaoForm.mensagem) {
      alert('Preencha todos os campos')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/solicitacoes-mudanca`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalId: prescricaoParaSolicitar.personalId,
          prescricaoId: prescricaoParaSolicitar.id,
          titulo: solicitacaoForm.titulo,
          mensagem: solicitacaoForm.mensagem
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao enviar solicitação')
        return
      }

      setShowSolicitacaoModal(false)
      setPrescricaoParaSolicitar(null)
      setSolicitacaoForm({ titulo: '', mensagem: '' })
      alert('Solicitação enviada com sucesso! O personal será notificado.')
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err)
      alert('Erro ao enviar solicitação')
    }
  }

  const getTreinoExecutado = (prescricaoId, divisaoId, diaSemana) => {
    const key = `${prescricaoId}-${divisaoId}`
    const treinos = treinosExecutados[key] || []
    // Buscar treino do dia específico que não foi finalizado (em execução)
    return treinos.find(t => t.diaSemana === diaSemana && !t.finalizado) || null
  }

  // Função auxiliar para calcular início e fim da semana atual (segunda a domingo)
  const getSemanaAtual = () => {
    try {
      const hoje = new Date()
      const diaSemana = hoje.getDay() // 0 = Domingo, 1 = Segunda, etc.
      
      // Calcular início da semana (segunda-feira)
      const inicioSemana = new Date(hoje)
      // Se for domingo (0), voltar 6 dias; caso contrário, voltar (diaSemana - 1) dias
      const diasParaVoltar = diaSemana === 0 ? 6 : diaSemana - 1
      inicioSemana.setDate(hoje.getDate() - diasParaVoltar)
      inicioSemana.setHours(0, 0, 0, 0)
      
      // Fim da semana (domingo à meia-noite)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 7)
      
      return { inicioSemana, fimSemana }
    } catch (error) {
      console.error('Erro ao calcular semana atual:', error)
      // Fallback: retornar semana atual aproximada
      const hoje = new Date()
      const inicioSemana = new Date(hoje)
      inicioSemana.setHours(0, 0, 0, 0)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(inicioSemana.getDate() + 7)
      return { inicioSemana, fimSemana }
    }
  }

  // Função para obter último treino executado de uma divisão (da semana atual)
  const getUltimoTreino = (prescricaoId, divisaoId) => {
    try {
      const key = `${prescricaoId}-${divisaoId}`
      const treinos = treinosExecutados[key]
      
      // Verificar se treinos é um array válido
      if (!Array.isArray(treinos) || treinos.length === 0) {
        return null
      }
      
      const { inicioSemana, fimSemana } = getSemanaAtual()
      
      // Filtrar apenas treinos finalizados da semana atual
      const treinosFinalizados = treinos.filter(t => {
        if (!t) return false
        
        // Verificar se está finalizado (aceitar true, 'true', ou 1)
        const estaFinalizado = t.finalizado === true || t.finalizado === 'true' || t.finalizado === 1
        if (!estaFinalizado) return false
        
        try {
          // Verificar se o treino é da semana atual usando dataExecucao
          const dataTreino = new Date(t.dataExecucao)
          // Normalizar para comparar apenas datas (sem hora)
          const dataTreinoNormalizada = new Date(dataTreino.getFullYear(), dataTreino.getMonth(), dataTreino.getDate())
          const inicioSemanaNormalizada = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate())
          const fimSemanaNormalizada = new Date(fimSemana.getFullYear(), fimSemana.getMonth(), fimSemana.getDate())
          
          return dataTreinoNormalizada >= inicioSemanaNormalizada && dataTreinoNormalizada < fimSemanaNormalizada
        } catch (error) {
          console.error('Erro ao processar data do treino:', error, t)
          return false
        }
      })
      
      if (treinosFinalizados.length === 0) return null
      return treinosFinalizados.sort((a, b) => new Date(b.dataExecucao) - new Date(a.dataExecucao))[0]
    } catch (error) {
      console.error('Erro ao obter último treino:', error)
      return null
    }
  }

  // Função para contar quantos treinos de uma divisão foram realizados na semana atual
  const getContagemTreinosSemana = (prescricaoId, divisaoId) => {
    try {
      const key = `${prescricaoId}-${divisaoId}`
      const treinos = treinosExecutados[key]
      
      // Verificar se treinos é um array válido
      if (!Array.isArray(treinos) || treinos.length === 0) {
        return 0
      }
      
      const { inicioSemana, fimSemana } = getSemanaAtual()
      
      // Filtrar apenas treinos finalizados da semana atual
      const treinosFinalizados = treinos.filter(t => {
        if (!t) return false
        
        // Verificar se está finalizado (aceitar true, 'true', ou 1)
        const estaFinalizado = t.finalizado === true || t.finalizado === 'true' || t.finalizado === 1
        if (!estaFinalizado) return false
        
        try {
          // Verificar se o treino é da semana atual usando dataExecucao
          const dataTreino = new Date(t.dataExecucao)
          // Normalizar para comparar apenas datas (sem hora)
          const dataTreinoNormalizada = new Date(dataTreino.getFullYear(), dataTreino.getMonth(), dataTreino.getDate())
          const inicioSemanaNormalizada = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate())
          const fimSemanaNormalizada = new Date(fimSemana.getFullYear(), fimSemana.getMonth(), fimSemana.getDate())
          
          return dataTreinoNormalizada >= inicioSemanaNormalizada && dataTreinoNormalizada < fimSemanaNormalizada
        } catch (error) {
          console.error('Erro ao processar data do treino:', error, t)
          return false
        }
      })
      
      return treinosFinalizados.length
    } catch (error) {
      console.error('Erro ao contar treinos da semana:', error)
      return 0
    }
  }

  // Função para obter próximo treino recomendado
  const getProximoTreino = (prescricao) => {
    if (!prescricao.divisoes || prescricao.divisoes.length === 0) return null
    
    // Ordenar divisões por ordem
    const divisoesOrdenadas = [...prescricao.divisoes].sort((a, b) => a.ordem - b.ordem)
    
    // Encontrar a primeira divisão que não foi executada hoje ou que não foi finalizada
    const hoje = getDiaSemanaAtual()
    for (const divisao of divisoesOrdenadas) {
      const treinoHoje = getTreinoExecutado(prescricao.id, divisao.id, hoje)
      if (!treinoHoje || !treinoHoje.finalizado) {
        return divisao
      }
    }
    
    // Se todas foram executadas hoje, retornar a primeira da ordem
    return divisoesOrdenadas[0]
  }

  // Função para obter rotina ativa
  const getRotinaAtiva = () => {
    return prescricoes.find(p => p.ativo) || prescricoes[0] || null
  }

  const parseRestTime = (descanso) => {
    if (!descanso) return 60 // Default 60 segundos
    
    const descansoStr = descanso.toString().toLowerCase().trim()
    
    // Se for apenas número, assume segundos
    if (/^\d+$/.test(descansoStr)) {
      return parseInt(descansoStr)
    }
    
    // Se termina com 's', remove e converte
    if (descansoStr.endsWith('s')) {
      const seconds = parseInt(descansoStr.replace('s', ''))
      return isNaN(seconds) ? 60 : seconds
    }
    
    // Se contém 'min', converte minutos para segundos
    if (descansoStr.includes('min')) {
      const minutes = parseFloat(descansoStr.replace(/min.*/, ''))
      return isNaN(minutes) ? 60 : Math.round(minutes * 60)
    }
    
    // Tentar extrair número
    const number = parseInt(descansoStr.replace(/\D/g, ''))
    return isNaN(number) ? 60 : number
  }

  if (loading) {
    return (
      <section className="treinos-section">
        <div className="section-header">
          <h2>Seus Treinos</h2>
          <span className="badge badge-personal">Personal</span>
        </div>
        <div className="treinos-loading">Carregando treinos...</div>
      </section>
    )
  }

  if (!prescricoes.length && !loading && personalId && !brandingLoading) {
    // Mostrar aviso quando não há treinos mas há personal vinculado
    const personalName = personalInfo?.name || personalInfo?.email || 'seu personal trainer'
    const teamName = branding?.brandName || (branding?.patientSettings && typeof branding.patientSettings === 'object' ? branding.patientSettings.teamName : null) || null
    
    return (
      <section className="treinos-section">
        <div className="section-header">
          <h2>Seus Treinos</h2>
          <span className="badge badge-personal">Personal</span>
        </div>
        
        <div className="no-treinos-message" style={{
          background: branding?.accentColor ? `${branding.accentColor}15` : 'var(--bg-secondary)',
          borderColor: branding?.accentColor || 'var(--border-color)',
          borderLeftColor: branding?.accentColor || 'var(--accent-color)'
        }}>
          {branding?.logoUrl && (
            <div className="personal-logo-container">
              <img 
                src={branding.logoUrl} 
                alt={teamName || personalName}
                className="personal-logo"
              />
            </div>
          )}
          
          <div className="no-treinos-content">
            <h3 className="no-treinos-title">
              {teamName ? (
                <>
                  O time <strong style={{ color: branding?.accentColor || 'var(--accent-color)' }}>{teamName}</strong>
                  {personalName && personalName !== teamName && (
                    <> do personal <strong>{personalName}</strong></>
                  )}
                </>
              ) : (
                <>
                  O personal <strong style={{ color: branding?.accentColor || 'var(--accent-color)' }}>{personalName}</strong>
                </>
              )}
            </h3>
            
            <p className="no-treinos-message-text">
              ainda não criou seu treino personalizado, mas em breve você terá acesso!
            </p>
            
            <div className="no-treinos-hint">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>Seu treino será criado especialmente para você e aparecerá aqui assim que estiver pronto.</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const rotinaAtiva = getRotinaAtiva()

  return (
    <section className="treinos-section">
      <div className="treinos-section-content">
        <div className="section-header">
          <h2>Meus Treinos</h2>
        </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Calendário Semanal de Treinos */}
      {rotinaAtiva && treinosSemanaData && (
        <WeeklyWorkoutCalendar
          treinosSemana={treinosSemanaData}
          rotinaAtiva={rotinaAtiva}
          onDayClick={handleDayClick}
          branding={branding}
        />
      )}

      {/* Rotina Ativa - Card Principal */}
      {rotinaAtiva && (
        <div className="rotina-ativa-card">
          <div className="rotina-ativa-header">
            <div className="rotina-ativa-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="rotina-ativa-info">
              <div className="rotina-ativa-nome-row">
                <h3 className="rotina-ativa-nome">{rotinaAtiva.nome}</h3>
                <span className="rotina-ativa-badge">Ativo</span>
              </div>
              <p className="rotina-ativa-personal">
                Prescrito por {rotinaAtiva.personal?.name || rotinaAtiva.personal?.email || 'seu personal'}
              </p>
              {rotinaAtiva.dataInicio && rotinaAtiva.dataFim && (
                <div className="rotina-ativa-datas">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>
                    {new Date(rotinaAtiva.dataInicio).toLocaleDateString('pt-BR')} - {new Date(rotinaAtiva.dataFim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {rotinaAtiva.observacoes && (
            <div className="rotina-ativa-observacoes">
              <h4>Orientações gerais</h4>
              <p>{rotinaAtiva.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* Divisões de Treino - Cards Organizados */}
      {rotinaAtiva && rotinaAtiva.divisoes && Array.isArray(rotinaAtiva.divisoes) && (
        <div className="treinos-list">
          {rotinaAtiva.divisoes.map((divisao) => {
            try {
              const treinoHoje = getTreinoExecutado(rotinaAtiva.id, divisao.id, getDiaSemanaAtual())
              const treinoIniciado = treinoHoje && !treinoHoje.finalizado
              const ultimoTreino = getUltimoTreino(rotinaAtiva.id, divisao.id)
              const proximoTreino = getProximoTreino(rotinaAtiva)
              const isProximoTreino = proximoTreino?.id === divisao.id
              
              const isExpanded = isDivisaoExpanded(divisao.id)
            
              return (
              <article key={divisao.id} className={`treino-divisao-card-modern ${isProximoTreino ? 'proximo-treino' : ''}`}>
                {/* Botão de Collapse no canto superior direito */}
                <button
                  className="treino-divisao-collapse-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDivisaoCollapse(divisao.id)
                  }}
                  aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    className={isExpanded ? 'expanded' : ''}
                  >
                    <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <div className="treino-divisao-header-modern">
                  <div className="treino-divisao-title-modern">
                    <h4 className="treino-divisao-nome-modern">{divisao.nome}</h4>
                    <span className="treino-divisao-count-modern">
                      {divisao.itens.length} exercício{divisao.itens.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* Conteúdo colapsável */}
                {isExpanded && (
                  <>
                    {/* Status e Informações */}
                    <div className="treino-divisao-info-modern">
                      {(() => {
                        try {
                          const contagemSemana = getContagemTreinosSemana(rotinaAtiva.id, divisao.id)
                          const ultimoTreinoSemana = getUltimoTreino(rotinaAtiva.id, divisao.id)
                          
                          if (contagemSemana === 0) {
                            return (
                              <div className="treino-status-item-modern">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>Você ainda não realizou esse treino nesta semana</span>
                              </div>
                            )
                          } else if (ultimoTreinoSemana && ultimoTreinoSemana.dataExecucao) {
                            try {
                              const dataFormatada = new Date(ultimoTreinoSemana.dataExecucao).toLocaleDateString('pt-BR')
                              return (
                                <div className="treino-status-item-modern">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  <span>
                                    {contagemSemana === 1 
                                      ? `Você realizou esse treino ${contagemSemana} vez nesta semana (${dataFormatada})`
                                      : `Você realizou esse treino ${contagemSemana} vezes nesta semana (último: ${dataFormatada})`
                                    }
                                  </span>
                                </div>
                              )
                            } catch (dateError) {
                              console.error('Erro ao formatar data:', dateError)
                              return (
                                <div className="treino-status-item-modern">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  <span>Você realizou esse treino {contagemSemana} {contagemSemana === 1 ? 'vez' : 'vezes'} nesta semana</span>
                                </div>
                              )
                            }
                          }
                          return null
                        } catch (error) {
                          console.error('Erro ao renderizar status do treino:', error)
                          return null
                        }
                      })()}
                      {isProximoTreino && (
                        <div className="treino-proximo-badge-modern">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                          Próximo treino recomendado
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    {!treinoIniciado && divisaoVisualizando?.id !== divisao.id && (
                      <button
                        className={`btn-ver-treino-modern ${isProximoTreino ? 'btn-ver-treino-destaque' : ''}`}
                        onClick={() => handleVerTreino(divisao)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        VER TREINO
                      </button>
                    )}

                    {/* Exercícios - Mostrar quando está visualizando OU quando o treino foi iniciado */}
                    {(divisaoVisualizando?.id === divisao.id || treinoIniciado) && (
                  <>
                    {/* Header de Visualização - apenas quando está visualizando SEM ter iniciado */}
                    {divisaoVisualizando?.id === divisao.id && !treinoIniciado && (
                      <>
                        <div className="treino-visualizacao-header">
                          <h3 className="treino-visualizacao-titulo">Visualizando: {divisao.nome}</h3>
                          <button
                            className="btn-fechar-visualizacao"
                            onClick={handleFecharVisualizacao}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <button
                          className="btn-iniciar-treino-modern btn-iniciar-treino-destaque"
                          onClick={() => {
                            handleFecharVisualizacao()
                            handleIniciarTreino(rotinaAtiva.id, divisao.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                          INICIAR TREINO
                        </button>
                      </>
                    )}

                    {/* Header de Execução - apenas quando o treino foi realmente iniciado */}
                    {treinoIniciado && (
                      <div className="treino-em-execucao-header">
                        <div className="treino-tempo-info">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>Treino em execução</span>
                        </div>
                        <button
                          className="btn-finalizar-treino-modern"
                          onClick={() => handleFinalizarTreino(treinoHoje)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Finalizar Treino
                        </button>
                      </div>
                    )}

                  <div className="treino-exercicios-grid">
                    {divisao.itens.map((item, index) => (
                        <div key={item.id} className="exercicio-card">
                          <div className="exercicio-card-header">
                            <div className="exercicio-number">{index + 1}</div>
                            <div className="exercicio-title-section">
                              <div className="exercicio-title-row">
                                <h5 className="exercicio-nome">
                                  {item.exercicio?.nome || 'Exercício'}
                                </h5>
                                {item.exercicio?.videoUrl && (
                                  <button
                                    className="exercicio-video-icon"
                                    onClick={() => setSelectedVideo({
                                      url: item.exercicio.videoUrl,
                                      nome: item.exercicio.nome
                                    })}
                                    title="Ver vídeo demonstrativo"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {item.exercicio?.categoria && (
                                <span className="exercicio-categoria-badge">
                                  {item.exercicio.categoria}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="exercicio-specs">
                            <div className="spec-item">
                              <span className="spec-label">Séries</span>
                              <span className="spec-value">{item.series}x</span>
                            </div>
                            {item.repeticoes && (
                              <div className="spec-item">
                                <span className="spec-label">Repetições</span>
                                <span className="spec-value">{item.repeticoes}</span>
                              </div>
                            )}
                            {item.carga && (
                              <div className="spec-item">
                                <span className="spec-label">Carga</span>
                                <span className="spec-value">{item.carga}</span>
                              </div>
                            )}
                            {item.descanso && (
                              <div className="spec-item">
                                <span className="spec-label">Descanso</span>
                                <span className="spec-value">{item.descanso}</span>
                              </div>
                            )}
                          </div>

                          <div className={`exercicio-descricao ${!item.exercicio?.descricao ? 'exercicio-descricao-empty' : ''}`}>
                            {item.exercicio?.descricao ? (
                              <p>{item.exercicio.descricao}</p>
                            ) : (
                              <p className="exercicio-descricao-placeholder">Sem descrição adicional</p>
                            )}
                          </div>

                          {/* Cronômetro de descanso - sempre disponível */}
                          <div className="exercicio-rest-timer-wrapper">
                            <RestTimer 
                              suggestedTime={item.descanso ? parseRestTime(item.descanso) : 60}
                              onComplete={() => {
                                // Feedback silencioso - não precisa de ação
                              }}
                            />
                          </div>
                      </div>
                    ))}
                  </div>
                  </>
                    )}
                  </>
                )}
              </article>
            )
            } catch (error) {
              console.error('Erro ao renderizar divisão de treino:', error, divisao)
              return null
            }
          })}
        </div>
      )}
      </div>

      {/* Modal de Feedback - Design LifeFit Ultra com cores neon */}
      {showFeedbackModal && treinoParaFinalizar && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowFeedbackModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(11, 15, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '12px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="feedback-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #0B0F14 0%, #1A1F26 100%)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(185, 255, 44, 0.15), 0 20px 40px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(185, 255, 44, 0.2)'
            }}
          >
            {/* Header com gradiente neon */}
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(185, 255, 44, 0.1) 0%, rgba(54, 215, 255, 0.1) 100%)',
                padding: '20px',
                borderBottom: '1px solid rgba(185, 255, 44, 0.15)',
                textAlign: 'center',
                position: 'relative',
                flexShrink: 0
              }}
            >
              {/* Botão fechar */}
              <button 
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Ícone de sucesso */}
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 0 30px rgba(185, 255, 44, 0.4)'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0B0F14" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Treino Concluído!
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Como foi sua experiência hoje?
              </p>
            </div>
            
            {/* Body com scroll */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Pergunta: Completou o treino? */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                  Você completou todo o treino?
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, completouTreino: true })}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: feedbackForm.completouTreino ? '2px solid #B9FF2C' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: feedbackForm.completouTreino ? 'rgba(185, 255, 44, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: feedbackForm.completouTreino ? '#B9FF2C' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ✓ Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackForm({ ...feedbackForm, completouTreino: false })}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: !feedbackForm.completouTreino ? '2px solid #36D7FF' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: !feedbackForm.completouTreino ? 'rgba(54, 215, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: !feedbackForm.completouTreino ? '#36D7FF' : 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ✗ Não
                  </button>
                </div>
              </div>

              {!feedbackForm.completouTreino && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Motivo:
                  </label>
                  <textarea
                    value={feedbackForm.motivoIncompleto}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, motivoIncompleto: e.target.value })}
                    placeholder="Descreva o motivo..."
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>
              )}

              {/* Sliders com visual moderno */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Intensidade</label>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    background: 'linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>{feedbackForm.intensidade}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.intensidade}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, intensidade: parseInt(e.target.value) })}
                  style={{ 
                    width: '100%', 
                    height: '8px',
                    accentColor: '#B9FF2C',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Dificuldade</label>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    background: 'linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>{feedbackForm.dificuldade}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.dificuldade}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, dificuldade: parseInt(e.target.value) })}
                  style={{ 
                    width: '100%', 
                    height: '8px',
                    accentColor: '#36D7FF',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Satisfação</label>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    background: 'linear-gradient(135deg, #B9FF2C 0%, #36D7FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>{feedbackForm.satisfacao}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={feedbackForm.satisfacao}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, satisfacao: parseInt(e.target.value) })}
                  style={{ 
                    width: '100%', 
                    height: '8px',
                    accentColor: '#18E6A0',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                  Observações <span style={{ fontWeight: 400, color: 'rgba(255, 255, 255, 0.5)' }}>(opcional)</span>
                </label>
                <textarea
                  value={feedbackForm.observacao}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, observacao: e.target.value })}
                  placeholder="Como você se sentiu? Algo que queira destacar?"
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Footer com botões */}
            <div 
              style={{
                padding: '16px 20px 20px',
                background: 'linear-gradient(180deg, transparent 0%, rgba(11, 15, 20, 0.8) 100%)',
                borderTop: '1px solid rgba(185, 255, 44, 0.1)',
                display: 'flex',
                gap: '12px',
                flexShrink: 0
              }}
            >
              <button 
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Pular
              </button>
              <button 
                onClick={handleSubmitFeedback}
                style={{
                  flex: 2,
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #B9FF2C 0%, #8EEA00 100%)',
                  color: '#0B0F14',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(185, 255, 44, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s ease'
                }}
              >
                Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitação */}
      {showSolicitacaoModal && prescricaoParaSolicitar && (
        <div className="modal-overlay" onClick={() => setShowSolicitacaoModal(false)}>
          <div className="modal-content solicitacao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Solicitar Mudança</h3>
              <button className="modal-close" onClick={() => setShowSolicitacaoModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="solicitacao-intro">
                Envie uma solicitação ao seu personal trainer para ajustes no treino "{prescricaoParaSolicitar.nome}".
              </p>
              
              <div className="form-group">
                <label>Título da solicitação *</label>
                <input
                  type="text"
                  value={solicitacaoForm.titulo}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, titulo: e.target.value })}
                  placeholder="Ex: Ajustar carga do exercício X"
                />
              </div>

              <div className="form-group">
                <label>Mensagem detalhada *</label>
                <textarea
                  value={solicitacaoForm.mensagem}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, mensagem: e.target.value })}
                  placeholder="Descreva o que você gostaria de mudar ou solicitar..."
                  rows="6"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSolicitacaoModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSubmitSolicitacao}>
                Enviar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagem Compartilhável */}
      {showShareImage && treinoFinalizadoData && (
        <WorkoutShareImage
          data={treinoFinalizadoData}
          branding={branding}
          onClose={() => {
            setShowShareImage(false)
            setTreinoFinalizadoData(null)
          }}
        />
      )}

      {/* Modal de Vídeo - Melhorado */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{selectedVideo.nome}</h3>
              <button
                className="video-modal-close"
                onClick={() => setSelectedVideo(null)}
                aria-label="Fechar vídeo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="video-modal-body">
              <video
                controls
                autoPlay
                className="video-modal-player"
                playsInline
              >
                <source src={selectedVideo.url} type="video/mp4" />
                <source src={selectedVideo.url} type="video/webm" />
                <source src={selectedVideo.url} type="video/ogg" />
                Seu navegador não suporta vídeos HTML5.
              </video>
            </div>
            <div className="video-modal-footer">
              <p className="video-modal-hint">Assista à execução correta do exercício</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PacienteTreinos
