import express from 'express'
import multer from 'multer'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { normalizeQuestionnaireData } from '../utils/questionnaireNormalizer.js'

const router = express.Router()

// Configurar multer para upload de fotos (memória)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Apenas imagens são permitidas'), false)
    }
  }
})

// Aplicar verificação de assinatura em todas as rotas
router.use(authenticate)
router.use(requireActiveSubscription)

// Função auxiliar para normalizar URLs de webhook
const normalizeWebhookUrl = (url) => {
  if (!url) return ''
  return url.replace(/\/webhook-test\//g, '/webhook/')
}

// Função para extrair URL base do N8N_WEBHOOK_URL e construir getExercises URL
const getExercisesUrl = () => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || ''
  console.log('🔍 N8N_WEBHOOK_URL do .env:', webhookUrl ? 'Configurado' : 'NÃO CONFIGURADO')
  
  if (!webhookUrl) {
    console.error('❌ N8N_WEBHOOK_URL não está configurado no .env')
    return ''
  }
  
  const normalized = normalizeWebhookUrl(webhookUrl)
  console.log('🔍 URL normalizada:', normalized)
  
  // Extrair a base URL (antes de /webhook/...)
  const baseMatch = normalized.match(/^(https?:\/\/[^\/]+)/)
  if (!baseMatch) {
    console.error('❌ Não foi possível extrair a base URL de:', normalized)
    return ''
  }
  
  const baseUrl = baseMatch[1]
  const finalUrl = `${baseUrl}/webhook/getExercises`
  console.log('✅ URL final construída:', finalUrl)
  return finalUrl
}

const N8N_GET_EXERCISES_URL = getExercisesUrl()
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Log da URL ao iniciar o servidor
if (N8N_GET_EXERCISES_URL) {
  console.log('✅ N8N GetExercises URL configurada:', N8N_GET_EXERCISES_URL)
} else {
  console.error('❌ N8N GetExercises URL NÃO configurada! Verifique N8N_WEBHOOK_URL no .env')
}

// Função auxiliar para converter Buffer para base64
const bufferToBase64 = (buffer) => {
  return buffer.toString('base64')
}

// Rota para gerar treino (com upload de fotos)
router.post('/generate', upload.fields([
  { name: 'fotoFrente', maxCount: 1 },
  { name: 'fotoCostas', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🏋️ === INÍCIO: Gerar treino ===')
    console.log('📦 Request files:', req.files ? Object.keys(req.files) : 'Nenhum arquivo')
    console.log('👤 User ID:', req.user?.userId)
    
    // Verificar se N8N está configurado
    if (!N8N_GET_EXERCISES_URL) {
      console.error('❌ N8N_GET_EXERCISES_URL está vazio!')
      console.error('   N8N_WEBHOOK_URL do .env:', process.env.N8N_WEBHOOK_URL || 'NÃO DEFINIDO')
      return res.status(500).json({ 
        error: 'Serviço de geração de treino não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env. A URL deve ser algo como: https://seu-n8n.com/webhook/...'
      })
    }
    
    console.log('✅ N8N está configurado, URL:', N8N_GET_EXERCISES_URL)

    const userId = req.user.userId
    console.log('🏋️ Gerando treino para userId:', userId)

    // Verificar se as fotos foram enviadas
    const files = req.files
    if (!files || !files.fotoFrente || !files.fotoCostas) {
      return res.status(400).json({ 
        error: 'Por favor, faça upload das duas fotos (frente e costas)' 
      })
    }

    const fotoFrente = files.fotoFrente[0]
    const fotoCostas = files.fotoCostas[0]

    // Converter fotos para base64
    const fotoFrenteBase64 = bufferToBase64(fotoFrente.buffer)
    const fotoCostasBase64 = bufferToBase64(fotoCostas.buffer)

    // Buscar dados do questionário
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    if (!questionnaireData) {
      return res.status(400).json({ 
        error: 'Complete o questionário antes de gerar o treino' 
      })
    }

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        personalId: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    // Normalizar dados do questionário antes de usar
    const normalized = normalizeQuestionnaireData(questionnaireData)
    
    if (!normalized) {
      return res.status(400).json({ error: 'Erro ao normalizar dados do questionário' })
    }

    console.log('✅ Dados do questionário normalizados para treino')
    console.log('   - Treina atualmente:', normalized.derived.treinaAtualmente)
    console.log('   - Tem limitação física:', normalized.derived.temLimitacaoFisica)
    console.log('   - Tem restrição médica exercício:', normalized.derived.temRestricaoMedicaExercicio)

    // Preparar payload para N8N usando dados normalizados
    const payload = {
      userId: user.id,
      userName: user.name || user.email,
      // Dados básicos do questionário (usar clean)
      idade: normalized.clean.idade,
      sexo: normalized.clean.sexo,
      altura: normalized.clean.altura,
      pesoAtual: normalized.clean.pesoAtual,
      objetivo: normalized.clean.objetivo,
      // Dados de atividade física
      frequenciaAtividade: normalized.clean.frequenciaAtividade,
      tipoAtividade: normalized.clean.tipoAtividade || null,
      horarioTreino: normalized.clean.horarioTreino,
      rotinaDiaria: normalized.clean.rotinaDiaria,
      // Campos derivados (booleanos explícitos)
      derived: normalized.derived,
      // Dados adicionais que podem ser úteis para o treino
      confortoPesar: normalized.clean.confortoPesar,
      tempoPreparacao: normalized.clean.tempoPreparacao,
      // Dados de limitações e restrições (se houver)
      limitacoesFisicas: normalized.clean.limitacoesFisicas,
      detalhesLimitacao: normalized.clean.detalhesLimitacao || null,
      restricoesMedicasExercicio: normalized.clean.restricoesMedicasExercicio,
      movimentosEvitar: normalized.clean.movimentosEvitar || null,
      // Dados de preferências de treino (se houver)
      relacaoEmocionalTreino: normalized.clean.relacaoEmocionalTreino || null,
      preferenciaDificuldadeTreino: normalized.clean.preferenciaDificuldadeTreino || null,
      barreirasTreino: normalized.clean.barreirasTreino || null,
      // Fotos em base64
      fotos: {
        frente: {
          data: fotoFrenteBase64,
          mimeType: fotoFrente.mimetype,
          filename: fotoFrente.originalname
        },
        costas: {
          data: fotoCostasBase64,
          mimeType: fotoCostas.mimetype,
          filename: fotoCostas.originalname
        }
      }
    }

    // Validar campos essenciais antes de enviar
    const requiredFields = ['idade', 'altura', 'pesoAtual', 'objetivo', 'frequenciaAtividade']
    const missingFields = requiredFields.filter(field => !payload[field] && payload[field] !== 0)
    if (missingFields.length > 0) {
      console.error('❌ Campos obrigatórios faltando no payload:', missingFields)
      return res.status(400).json({
        error: 'Dados incompletos',
        details: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      })
    }

    // Validar fotos
    if (!fotoFrenteBase64 || !fotoCostasBase64) {
      console.error('❌ Fotos não foram convertidas corretamente')
      return res.status(400).json({
        error: 'Erro ao processar fotos',
        details: 'As fotos não puderam ser processadas'
      })
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    console.log('📤 Enviando requisição para N8N (getExercises)...')
    console.log('   URL:', N8N_GET_EXERCISES_URL)
    console.log('   Payload (sem fotos):', JSON.stringify({ ...payload, fotos: { frente: '[base64 data]', costas: '[base64 data]' } }, null, 2))

    // Timeout configurável (padrão 10 minutos)
    const timeoutMs = parseInt(process.env.N8N_TIMEOUT) || 600000

    // #region agent log
    const payloadForLog = { ...payload, fotos: { frente: { data: '[base64]', mimeType: payload.fotos.frente.mimeType }, costas: { data: '[base64]', mimeType: payload.fotos.costas.mimeType } } }
    fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H23',location:'server/routes/workout.js:payloadBeforeN8N',message:'Payload antes de enviar para N8N',data:{payloadKeys:Object.keys(payload),hasFotos:Boolean(payload.fotos),fotoFrenteSize:payload.fotos?.frente?.data?.length,fotoCostasSize:payload.fotos?.costas?.data?.length,payloadSample:JSON.stringify(payloadForLog).substring(0,500)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    // Fazer requisição para N8N
    let response
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H19',location:'server/routes/workout.js:n8nFetchStart',message:'Iniciando fetch para N8N',data:{url:N8N_GET_EXERCISES_URL,timeoutMs},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      response = await fetch(N8N_GET_EXERCISES_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs)
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H20',location:'server/routes/workout.js:n8nFetchSuccess',message:'Fetch para N8N completado',data:{status:response.status,ok:response.ok},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    } catch (fetchErr) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H21',location:'server/routes/workout.js:n8nFetchError',message:'Erro no fetch para N8N',data:{errorName:fetchErr.name,errorMessage:fetchErr.message,isTimeout:fetchErr.name==='TimeoutError',isAborted:fetchErr.name==='AbortError'},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      console.error('❌ Erro de rede ao chamar N8N:', fetchErr)
      throw new Error(`Erro ao conectar com o serviço de geração de treino: ${fetchErr.message}`)
    }

    console.log('📥 Resposta recebida do N8N, status:', response.status)

    if (!response.ok) {
      const responseText = await response.text()
      console.error('❌ Erro do N8N:', response.status, responseText)
      // #region agent log
      let errorData = {}
      try {
        errorData = JSON.parse(responseText)
      } catch (e) {
        errorData = { raw: responseText.substring(0, 200) }
      }
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H24',location:'server/routes/workout.js:n8nErrorResponse',message:'N8N retornou erro',data:{status:response.status,errorData},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      const errorMessage = errorData.message || errorData.error || 'Workflow execution failed'
      throw new Error(`Erro ao gerar treino: ${response.status} ${errorMessage}`)
    }

    // Parse da resposta do N8N
    let responseData
    try {
      const responseText = await response.text()
      responseData = JSON.parse(responseText)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H1',location:'server/routes/workout.js:parseResponse',message:'Parsed N8N response',data:{status:response.status,hasWorkouts:Array.isArray(responseData?.workouts),hasDivisoes:Array.isArray(responseData?.divisoes)},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta do N8N:', parseError)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H2',location:'server/routes/workout.js:parseResponse',message:'Failed to parse N8N response',data:{error:String(parseError)},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
      throw new Error('Resposta do N8N não contém JSON válido')
    }

    // N8N pode retornar em diferentes formatos
    let workoutData = null

    // Formato 1: Array direto
    if (Array.isArray(responseData) && responseData.length > 0) {
      workoutData = responseData[0]
    }
    // Formato 2: Objeto com output
    else if (responseData.output) {
      workoutData = responseData.output
    }
    // Formato 3: Objeto direto
    else if (responseData.treino || responseData.workout || responseData.divisoes) {
      workoutData = responseData
    }
    // Formato 4: String JSON dentro do objeto
    else if (typeof responseData === 'object') {
      workoutData = responseData
    }

    if (!workoutData) {
      throw new Error('Resposta do N8N não contém dados de treino válidos')
    }

    console.log('✅ Treino recebido do N8N:', JSON.stringify(workoutData, null, 2))

    // Verificar se o usuário tem personalId (se não tiver, criar um personal virtual)
    let personalId = user.personalId

    if (!personalId) {
      // Criar um personal trainer virtual para treinos gerados por IA
      const virtualPersonal = await prisma.user.findFirst({
        where: {
          email: 'ia@lifefit.com',
          role: 'PERSONAL'
        }
      })

      if (virtualPersonal) {
        personalId = virtualPersonal.id
      } else {
        // Criar personal virtual se não existir
        const newVirtualPersonal = await prisma.user.create({
          data: {
            email: 'ia@lifefit.com',
            name: 'LifeFit IA',
            password: 'virtual', // Senha não será usada
            role: 'PERSONAL'
          }
        })
        personalId = newVirtualPersonal.id
      }

      // Vincular usuário ao personal virtual
      await prisma.user.update({
        where: { id: userId },
        data: { personalId }
      })
    }

    // Processar e salvar o treino
    // O formato esperado do N8N pode variar:
    // - responseData.output pode vir como string JSON; se existir, tentar parsear
    // - workoutData.treino / workoutData.workout com campo divisoes
    // - workoutData.workouts (novo formato) com exercises
    let workoutDataParsed = workoutData
    if (workoutData && typeof workoutData.output === 'string') {
      try {
        workoutDataParsed = JSON.parse(workoutData.output)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'H6',location:'server/routes/workout.js:outputParse',message:'Parsed output string to object',data:{hasWorkouts:Array.isArray(workoutDataParsed?.workouts),hasDivisoes:Array.isArray(workoutDataParsed?.divisoes)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'H7',location:'server/routes/workout.js:outputParse',message:'Failed to parse output string',data:{error:String(err)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
      }
    } else if (workoutData && typeof workoutData.output === 'object') {
      workoutDataParsed = workoutData.output
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'H8',location:'server/routes/workout.js:outputObject',message:'Using output object directly',data:{hasWorkouts:Array.isArray(workoutDataParsed?.workouts),hasDivisoes:Array.isArray(workoutDataParsed?.divisoes)},timestamp:Date.now()})}).catch(()=>{})
      // #endregion
    }

    // O JSON parseado pode ter workouts diretamente ou dentro de treino/workout
    const treinoData = workoutDataParsed.treino || workoutDataParsed.workout || workoutDataParsed
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H3',location:'server/routes/workout.js:treinoData',message:'Treino data sources',data:{divisoesCount:Array.isArray(treinoData?.divisoes)?treinoData.divisoes.length:null,workoutsCount:Array.isArray(treinoData?.workouts)?treinoData.workouts.length:null,hasWorkoutsDirect:Array.isArray(workoutDataParsed?.workouts)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    console.log('📋 Processando dados do treino recebido do N8N')
    console.log('   - Nome:', treinoData.nome || workoutDataParsed.meta?.generator || 'Treino gerado por IA')
    console.log('   - Divisões:', treinoData.divisoes?.length || treinoData.workouts?.length || workoutDataParsed.workouts?.length || 0)

    // Escolher fonte de divisões (divisoes ou workouts)
    // Pode estar em treinoData ou diretamente em workoutDataParsed
    const rawDivisoes = treinoData.divisoes || treinoData.workouts || workoutDataParsed.workouts || []
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H4',location:'server/routes/workout.js:rawDivisoes',message:'Raw divisions length',data:{len:Array.isArray(rawDivisoes)?rawDivisoes.length:null},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    // Validar e processar divisões
    const divisoesParaCriar = []
    
    for (const [index, divisao] of rawDivisoes.entries()) {
      const itensParaCriar = []
      
      const exerciciosDivisao = divisao.itens || divisao.exercicios || divisao.exercises || []
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-1',hypothesisId:'H5',location:'server/routes/workout.js:divisao',message:'Division exercises length',data:{divIndex:index,exLen:Array.isArray(exerciciosDivisao)?exerciciosDivisao.length:null},timestamp:Date.now()})}).catch(()=>{})
      // #endregion

      for (const [itemIndex, item] of exerciciosDivisao.entries()) {
        // Se o exercício não tem ID, tentar buscar por nome ou criar um exercício genérico
        let exercicioId = item.exercicioId || item.id || item.exercicio?.id
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'H13',location:'server/routes/workout.js:itemRaw',message:'Item objeto completo',data:{divIndex:index,itemIndex,itemKeys:Object.keys(item),itemSample:JSON.stringify(item).substring(0,200)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion
        
        const nomeExercicio = item.nome || item.name || item.exercicio?.nome || item.exercicio?.name
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'H9',location:'server/routes/workout.js:itemStart',message:'Item recebido',data:{divIndex:index,itemIndex,nomeExercicio,hasId:Boolean(exercicioId),muscleGroup:item.muscleGroup,hasNome:Boolean(item.nome),hasName:Boolean(item.name)},timestamp:Date.now()})}).catch(()=>{})
        // #endregion

        if (!exercicioId && nomeExercicio) {
          // Tentar buscar exercício por nome
          const exercicioExistente = await prisma.exercicio.findFirst({
            where: {
              OR: [
                {
                  nome: {
                    contains: nomeExercicio,
                    mode: 'insensitive'
                  }
                },
                {
                  descricao: {
                    contains: nomeExercicio,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          })
          
          if (exercicioExistente) {
            exercicioId = exercicioExistente.id
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'H10',location:'server/routes/workout.js:itemFound',message:'Exercício encontrado por nome',data:{divIndex:index,itemIndex,nomeExercicio,exercicioId},timestamp:Date.now()})}).catch(()=>{})
            // #endregion
          } else {
            // Criar exercício genérico se não existir
            const nomeExercicioFinal = nomeExercicio || `Exercício ${itemIndex + 1}`
            const novoExercicio = await prisma.exercicio.create({
              data: {
                nome: nomeExercicioFinal, // Campo obrigatório
                descricao: nomeExercicioFinal, // Usar o mesmo nome como descrição
                categoria: item.categoria || item.muscleGroup || item.exercicio?.categoria || 'Outros',
                personalId: personalId
              }
            })
            exercicioId = novoExercicio.id
            console.log('✅ Exercício criado:', novoExercicio.descricao)
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'H11',location:'server/routes/workout.js:itemCreated',message:'Exercício criado',data:{divIndex:index,itemIndex,nomeExercicio,exercicioId},timestamp:Date.now()})}).catch(()=>{})
            // #endregion
          }
        }
        
        if (!exercicioId) {
          console.warn(`⚠️ Item ${itemIndex + 1} da divisão ${index + 1} não tem exercício válido, pulando...`)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'H12',location:'server/routes/workout.js:itemSkip',message:'Item sem exercicioId após tentativa',data:{divIndex:index,itemIndex,nomeExercicio},timestamp:Date.now()})}).catch(()=>{})
          // #endregion
          continue
        }
        
        // Converter descanso para string se for número
        let descansoValue = item.descanso || item.rest || '60s'
        if (item.restSeconds && typeof item.restSeconds === 'number') {
          descansoValue = `${item.restSeconds}s`
        }
        
        itensParaCriar.push({
          exercicioId: exercicioId,
          series: item.series || 3,
          repeticoes: item.repeticoes || item.repetitions || '10-12',
          carga: item.carga || null,
          descanso: descansoValue,
          observacoes: item.observacoes || item.observations || item.technicalNotes || null,
          ordem: item.ordem || itemIndex + 1
        })
      }
      
      if (itensParaCriar.length === 0) {
        console.warn(`⚠️ Divisão ${index + 1} não tem itens válidos, pulando...`)
        continue
      }
      
      divisoesParaCriar.push({
        nome: divisao.nome || divisao.dayName || divisao.dayLabel || `Divisão ${index + 1}`,
        ordem: divisao.ordem || index + 1,
        grupoMuscularPrincipal: divisao.grupoMuscularPrincipal || null,
        grupoMuscularSecundario: divisao.grupoMuscularSecundario || null,
        diaSemana: divisao.diaSemana || divisao.dayLabel || null,
        itens: {
          create: itensParaCriar
        }
      })
    }
    
    if (divisoesParaCriar.length === 0) {
      throw new Error('Nenhuma divisão válida encontrada no treino retornado pelo N8N')
    }

    console.log(`✅ Criando prescrição com ${divisoesParaCriar.length} divisões`)

    // Gerar nome do treino baseado no split ou divisões
    const splitName = workoutDataParsed.strategy?.split || treinoData.split || 'ABCD'
    const treinoNome = treinoData.nome || `Treino ${splitName}` || 'Treino Personalizado'
    
    // Criar prescrição de treino
    const prescricao = await prisma.prescricaoTreino.create({
      data: {
        pacienteId: userId,
        personalId: personalId,
        nome: treinoNome,
        observacoes: treinoData.observacoes || workoutDataParsed.strategy?.generalNotes?.join(' ') || 'Treino gerado por IA',
        analysisJson: JSON.stringify(workoutDataParsed), // armazenar análise completa (visual + plano)
        ativo: true,
        divisoes: {
          create: divisoesParaCriar
        }
      },
      include: {
        divisoes: {
          include: {
            itens: {
              include: {
                exercicio: true
              }
            }
          }
        }
      }
    })

    console.log('✅ Treino criado com sucesso! ID:', prescricao.id)

    res.status(201).json({
      message: 'Treino gerado com sucesso',
      treino: prescricao
    })

  } catch (error) {
    console.error('❌ Erro ao gerar treino:', error)
    console.error('❌ Stack trace:', error.stack)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error code:', error.code)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e595e1f3-6537-49d9-9d78-60c318943485',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-4',hypothesisId:'H22',location:'server/routes/workout.js:catchError',message:'Erro capturado no catch da rota',data:{errorName:error.name,errorMessage:error.message,errorCode:error.code,stack:error.stack?.substring(0,300)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      const timeoutMinutes = (parseInt(process.env.N8N_TIMEOUT) || 600000) / 60000
      return res.status(504).json({
        error: 'Tempo limite excedido',
        details: `A geração do treino está demorando mais que ${timeoutMinutes} minutos. Tente novamente.`
      })
    }

    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: 'Serviço indisponível',
        details: 'Não foi possível conectar ao N8N. Verifique se o serviço está rodando.'
      })
    }

    // Erro do N8N (workflow execution failed)
    if (error.message.includes('Erro ao gerar treino: 500') || error.message.includes('Workflow execution failed')) {
      return res.status(500).json({
        error: 'Erro ao gerar treino',
        details: 'O serviço de geração de treino falhou. Por favor, tente novamente ou entre em contato com o suporte.'
      })
    }

    // Erros do Prisma
    if (error.code && error.code.startsWith('P')) {
      console.error('❌ Erro do Prisma:', error.code, error.meta)
      return res.status(500).json({
        error: 'Erro no banco de dados',
        details: error.message,
        code: error.code
      })
    }

    res.status(500).json({
      error: 'Erro ao gerar treino',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// ============================================================
// ROTAS DE EXECUÇÃO DE TREINO
// ============================================================

// Helper para obter dia da semana em português
const getDiaSemana = (date) => {
  const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']
  return dias[date.getDay()]
}

// Helper para obter início da semana (domingo)
const getStartOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper para obter fim da semana (sábado)
const getEndOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  d.setHours(23, 59, 59, 999)
  return d
}

// GET /api/workout/week - Buscar calendário semanal de treinos
router.get('/week', async (req, res) => {
  try {
    const userId = req.user.userId
    const now = new Date()
    const startOfWeek = getStartOfWeek(now)
    const endOfWeek = getEndOfWeek(now)

    // Buscar treinos executados na semana
    const treinosExecutados = await prisma.treinoExecutado.findMany({
      where: {
        pacienteId: userId,
        dataExecucao: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      include: {
        divisao: true,
        feedback: true
      },
      orderBy: { dataExecucao: 'asc' }
    })

    // Montar array de dias da semana
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const weekData = dias.map((dia, idx) => {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + idx)
      
      const treinosDoDia = treinosExecutados.filter(t => {
        const execDate = new Date(t.dataExecucao)
        return execDate.toDateString() === date.toDateString()
      })

      const completedWorkout = treinosDoDia.find(t => t.finalizado)
      
      return {
        day: dia,
        date: date.toISOString(),
        isToday: date.toDateString() === now.toDateString(),
        completed: !!completedWorkout,
        workoutName: completedWorkout?.divisao?.nome || null,
        duration: completedWorkout?.duracaoMinutos || null
      }
    })

    // Calcular streak (quantos treinos finalizados na semana)
    const streak = treinosExecutados.filter(t => t.finalizado).length

    res.json({
      weekData,
      streak,
      totalWorkouts: treinosExecutados.length,
      completedWorkouts: treinosExecutados.filter(t => t.finalizado).length
    })

  } catch (error) {
    console.error('Erro ao buscar calendário semanal:', error)
    res.status(500).json({ error: 'Erro ao buscar calendário semanal' })
  }
})

// POST /api/workout/start - Iniciar um treino
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.userId
    const { prescricaoId, divisaoId } = req.body

    if (!prescricaoId || !divisaoId) {
      return res.status(400).json({ error: 'prescricaoId e divisaoId são obrigatórios' })
    }

    // Verificar se a prescrição e divisão existem e pertencem ao usuário
    const prescricao = await prisma.prescricaoTreino.findFirst({
      where: {
        id: prescricaoId,
        pacienteId: userId
      }
    })

    if (!prescricao) {
      return res.status(404).json({ error: 'Prescrição não encontrada' })
    }

    const divisao = await prisma.prescricaoTreinoDivisao.findFirst({
      where: {
        id: divisaoId,
        prescricaoId
      }
    })

    if (!divisao) {
      return res.status(404).json({ error: 'Divisão não encontrada' })
    }

    // Verificar se já existe um treino em andamento (não finalizado) hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const fimHoje = new Date(hoje)
    fimHoje.setHours(23, 59, 59, 999)

    const treinoEmAndamento = await prisma.treinoExecutado.findFirst({
      where: {
        pacienteId: userId,
        finalizado: false,
        dataExecucao: {
          gte: hoje,
          lte: fimHoje
        }
      }
    })

    if (treinoEmAndamento) {
      return res.status(400).json({
        error: 'Você já tem um treino em andamento',
        treinoId: treinoEmAndamento.id
      })
    }

    // Criar novo treino executado
    const now = new Date()
    const treino = await prisma.treinoExecutado.create({
      data: {
        pacienteId: userId,
        prescricaoId,
        divisaoId,
        dataExecucao: now,
        diaSemana: getDiaSemana(now),
        finalizado: false
      },
      include: {
        divisao: true
      }
    })

    res.json({
      message: 'Treino iniciado com sucesso',
      treino: {
        id: treino.id,
        startTime: treino.dataExecucao,
        divisaoNome: treino.divisao.nome,
        diaSemana: treino.diaSemana
      }
    })

  } catch (error) {
    console.error('Erro ao iniciar treino:', error)
    res.status(500).json({ error: 'Erro ao iniciar treino' })
  }
})

// GET /api/workout/active - Buscar treino em andamento
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.userId

    const treino = await prisma.treinoExecutado.findFirst({
      where: {
        pacienteId: userId,
        finalizado: false
      },
      include: {
        divisao: {
          include: {
            itens: {
              include: {
                exercicio: true
              },
              orderBy: { ordem: 'asc' }
            }
          }
        },
        prescricao: true
      },
      orderBy: { dataExecucao: 'desc' }
    })

    if (!treino) {
      return res.json({ active: false, treino: null })
    }

    res.json({
      active: true,
      treino: {
        id: treino.id,
        startTime: treino.dataExecucao,
        divisaoNome: treino.divisao.nome,
        divisaoId: treino.divisaoId,
        prescricaoId: treino.prescricaoId,
        diaSemana: treino.diaSemana,
        exercicios: treino.divisao.itens
      }
    })

  } catch (error) {
    console.error('Erro ao buscar treino ativo:', error)
    res.status(500).json({ error: 'Erro ao buscar treino ativo' })
  }
})

// POST /api/workout/finish - Finalizar treino com feedback
router.post('/finish', async (req, res) => {
  try {
    const userId = req.user.userId
    const { treinoId, feedback } = req.body

    if (!treinoId) {
      return res.status(400).json({ error: 'treinoId é obrigatório' })
    }

    // Buscar treino
    const treino = await prisma.treinoExecutado.findFirst({
      where: {
        id: treinoId,
        pacienteId: userId,
        finalizado: false
      },
      include: {
        divisao: true,
        prescricao: true
      }
    })

    if (!treino) {
      return res.status(404).json({ error: 'Treino não encontrado ou já finalizado' })
    }

    // Calcular duração
    const startTime = new Date(treino.dataExecucao)
    const endTime = new Date()
    const duracaoMinutos = Math.round((endTime - startTime) / (1000 * 60))

    // Atualizar treino como finalizado
    const treinoAtualizado = await prisma.treinoExecutado.update({
      where: { id: treinoId },
      data: {
        finalizado: true,
        duracaoMinutos
      }
    })

    // Criar feedback se fornecido
    let feedbackCriado = null
    if (feedback) {
      feedbackCriado = await prisma.feedbackTreino.create({
        data: {
          treinoExecutadoId: treinoId,
          observacao: feedback.observacao || null,
          intensidade: feedback.intensidade || null,
          dificuldade: feedback.dificuldade || null,
          satisfacao: feedback.satisfacao || null,
          completouTreino: feedback.completouTreino !== false,
          motivoIncompleto: feedback.motivoIncompleto || null
        }
      })
    }

    // Buscar estatísticas da semana para o share card
    const startOfWeek = getStartOfWeek(new Date())
    const endOfWeek = getEndOfWeek(new Date())

    const weekStats = await prisma.treinoExecutado.findMany({
      where: {
        pacienteId: userId,
        finalizado: true,
        dataExecucao: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    })

    const streak = weekStats.length

    res.json({
      message: 'Treino finalizado com sucesso!',
      treino: {
        id: treinoAtualizado.id,
        divisaoNome: treino.divisao.nome,
        startTime: treino.dataExecucao,
        endTime: endTime,
        duracaoMinutos,
        diaSemana: treino.diaSemana
      },
      feedback: feedbackCriado,
      weekStats: {
        streak,
        completedThisWeek: streak
      }
    })

  } catch (error) {
    console.error('Erro ao finalizar treino:', error)
    res.status(500).json({ error: 'Erro ao finalizar treino' })
  }
})

// POST /api/workout/cancel - Cancelar treino em andamento
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.user.userId
    const { treinoId } = req.body

    if (!treinoId) {
      return res.status(400).json({ error: 'treinoId é obrigatório' })
    }

    // Deletar treino não finalizado
    await prisma.treinoExecutado.deleteMany({
      where: {
        id: treinoId,
        pacienteId: userId,
        finalizado: false
      }
    })

    res.json({ message: 'Treino cancelado' })

  } catch (error) {
    console.error('Erro ao cancelar treino:', error)
    res.status(500).json({ error: 'Erro ao cancelar treino' })
  }
})

export default router
