import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/subscription.js'
import { calcularNutricao } from '../utils/nutrition.js'
import { normalizeQuestionnaireData } from '../utils/questionnaireNormalizer.js'
import { canGenerate, recordDietGeneration } from '../utils/generationControl.js'
// Sistema de ajuste automático removido - usando output direto do agente

const router = express.Router()

// Aplicar verificação de assinatura em todas as rotas (exceto para nutricionistas)
router.use(authenticate)
router.use(requireActiveSubscription)

// Função auxiliar para normalizar URLs de webhook (substitui webhook-test por webhook)
const normalizeWebhookUrl = (url) => {
  if (!url) return ''
  // Substituir webhook-test por webhook na URL
  return url.replace(/\/webhook-test\//g, '/webhook/')
}

// Função para extrair URL base do N8N_WEBHOOK_URL e construir getDiet URL
const getDietUrl = () => {
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
  const finalUrl = `${baseUrl}/webhook/getDiet`
  console.log('✅ URL final construída:', finalUrl)
  return finalUrl
}

const N8N_GET_DIET_URL = getDietUrl()
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Log da URL ao iniciar o servidor
if (N8N_GET_DIET_URL) {
  console.log('✅ N8N GetDiet URL configurada:', N8N_GET_DIET_URL)
} else {
  console.error('❌ N8N GetDiet URL NÃO configurada! Verifique N8N_WEBHOOK_URL no .env')
}

// Rota para gerar dieta
router.post('/generate', authenticate, async (req, res) => {
  // Variável para armazenar as necessidades nutricionais calculadas (para validação posterior)
  let nutricaoCalculadaBackup = null
  
  try {
    // Verificar se N8N está configurado
    if (!N8N_GET_DIET_URL) {
      console.error('❌ N8N_GET_DIET_URL está vazio!')
      console.error('   N8N_WEBHOOK_URL do .env:', process.env.N8N_WEBHOOK_URL || 'NÃO DEFINIDO')
      return res.status(500).json({ 
        error: 'Serviço de geração de dieta não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env. A URL deve ser algo como: https://seu-n8n.com/webhook/...'
      })
    }
    
    console.log('✅ N8N está configurado, URL:', N8N_GET_DIET_URL)

    const userId = req.user.userId
    console.log('Gerando dieta para userId:', userId)

    // TEMPORÁRIO: Verificação de limite desabilitada para testes
    // TODO: Reativar após testes
    /*
    // Verificar se pode gerar dieta
    const generationCheck = await canGenerate(userId)
    if (!generationCheck.canGenerate) {
      return res.status(403).json({
        error: generationCheck.reason,
        nextAllowedDate: generationCheck.nextAllowedDate
      })
    }
    */

    // Buscar dados do questionário
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    if (!questionnaireData) {
      return res.status(400).json({ error: 'Complete o questionário antes de gerar a dieta' })
    }

    console.log('📋 Dados do questionário encontrados')
    console.log('   - Idade:', questionnaireData.idade)
    console.log('   - Sexo:', questionnaireData.sexo)
    console.log('   - Objetivo:', questionnaireData.objetivo)
    console.log('   - Frequência Atividade:', questionnaireData.frequenciaAtividade)
    console.log('   - Quantidade Refeições:', questionnaireData.quantidadeRefeicoes)

    // Parse dos alimentos do dia a dia (novo formato)
    let alimentosDoDiaADia = null
    if (questionnaireData.alimentosDoDiaADia) {
      try {
        alimentosDoDiaADia = typeof questionnaireData.alimentosDoDiaADia === 'string' 
          ? JSON.parse(questionnaireData.alimentosDoDiaADia)
          : questionnaireData.alimentosDoDiaADia
      } catch (e) {
        console.error('Erro ao fazer parse dos alimentos do dia a dia:', e)
        alimentosDoDiaADia = { carboidratos: [], proteinas: [], gorduras: [], frutas: [] }
      }
    }

    // CALCULAR NECESSIDADES NUTRICIONAIS ANTES DE ENVIAR PARA O N8N
    // Isso ajuda o agente a respeitar os valores e reduz o tempo de processamento
    console.log('📊 Calculando necessidades nutricionais...')
    nutricaoCalculadaBackup = calcularNutricao({
      idade: questionnaireData.idade,
      pesoAtual: questionnaireData.pesoAtual,
      altura: questionnaireData.altura,
      sexo: questionnaireData.sexo,
      objetivo: questionnaireData.objetivo,
      frequenciaAtividade: questionnaireData.frequenciaAtividade,
      rotinaDiaria: questionnaireData.rotinaDiaria
    })
    
    if (nutricaoCalculadaBackup) {
      console.log('✅ Necessidades nutricionais calculadas:')
      console.log('   - Calorias:', nutricaoCalculadaBackup.calorias, 'kcal')
      console.log('   - Proteína:', nutricaoCalculadaBackup.macros.proteina, 'g')
      console.log('   - Carboidrato:', nutricaoCalculadaBackup.macros.carboidrato, 'g')
      console.log('   - Gordura:', nutricaoCalculadaBackup.macros.gordura, 'g')
    } else {
      console.warn('⚠️  Não foi possível calcular necessidades nutricionais')
    }

    // Normalizar dados do questionário antes de usar
    const normalized = normalizeQuestionnaireData(questionnaireData)
    
    if (!normalized) {
      return res.status(400).json({ error: 'Erro ao normalizar dados do questionário' })
    }

    console.log('✅ Dados do questionário normalizados')
    console.log('   - Treina atualmente:', normalized.derived.treinaAtualmente)
    console.log('   - Tem restrição clínica:', normalized.derived.temRestricaoClinica)

    // Converter quantidadeRefeicoes para número
    let numRefeicoes = 5 // padrão
    const quantidadeRefeicoes = normalized.clean.quantidadeRefeicoes || normalized.quantidadeRefeicoes
    if (quantidadeRefeicoes) {
      const match = quantidadeRefeicoes.toString().match(/(\d+)/)
      if (match) {
        numRefeicoes = parseInt(match[1])
      } else if (quantidadeRefeicoes.toString().includes('Mais de 5')) {
        numRefeicoes = 6
      }
    }

    // Preparar contexto do questionário para N8N usando dados normalizados
    const questionnaireContext = {
      // Usar estrutura clean (campos novos e preenchidos)
      ...normalized.clean,
      
      // Incluir campos derivados (booleanos explícitos)
      derived: normalized.derived,
      
      // Compatibilidade com formato antigo (para referência)
      refeicoesDia: numRefeicoes
    }

    // Preparar payload para N8N com necessidades nutricionais calculadas
    // IMPORTANTE: Incluir nutritionalNeeds calculado para o agente respeitar os valores
    const payload = {
      questionnaireContext,
      // Incluir necessidades nutricionais calculadas para o agente usar como referência OBRIGATÓRIA
      nutritionalNeeds: nutricaoCalculadaBackup ? {
        // VALORES OBRIGATÓRIOS - O agente DEVE respeitar estes valores exatos
        totalDiaKcal: nutricaoCalculadaBackup.calorias,  // Total de calorias diárias OBRIGATÓRIO
        macrosDia: {
          proteina_g: nutricaoCalculadaBackup.macros.proteina,      // Proteína em gramas OBRIGATÓRIO
          carbo_g: nutricaoCalculadaBackup.macros.carboidrato,      // Carboidrato em gramas OBRIGATÓRIO
          gordura_g: nutricaoCalculadaBackup.macros.gordura         // Gordura em gramas OBRIGATÓRIO
        },
        // Informações adicionais de referência
        tmb: nutricaoCalculadaBackup.tmb,
        fatorAtividade: nutricaoCalculadaBackup.fatorAtividade,
        // Instrução explícita para o agente
        instrucao: `IMPORTANTE: Você DEVE criar uma dieta que resulte em EXATAMENTE ${nutricaoCalculadaBackup.calorias} kcal por dia, com ${nutricaoCalculadaBackup.macros.proteina}g de proteína, ${nutricaoCalculadaBackup.macros.carboidrato}g de carboidrato e ${nutricaoCalculadaBackup.macros.gordura}g de gordura. O totalDiaKcal e macrosDia no JSON de resposta DEVEM corresponder a estes valores. Crie ${numRefeicoes} refeições por dia conforme solicitado.`
      } : null
    }
    
    console.log('📤 Payload preparado para N8N com necessidades nutricionais calculadas')
    if (nutricaoCalculadaBackup) {
      console.log('📋 Instrução enviada ao agente:')
      console.log(`   - Total de calorias: ${nutricaoCalculadaBackup.calorias} kcal`)
      console.log(`   - Proteína: ${nutricaoCalculadaBackup.macros.proteina}g`)
      console.log(`   - Carboidrato: ${nutricaoCalculadaBackup.macros.carboidrato}g`)
      console.log(`   - Gordura: ${nutricaoCalculadaBackup.macros.gordura}g`)
      console.log(`   - Refeições por dia: ${numRefeicoes}`)
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    console.log('📤 ===== ENVIANDO REQUISIÇÃO PARA N8N =====')
    console.log('   URL:', N8N_GET_DIET_URL)
    console.log('   Método: POST')
    console.log('   Headers:', JSON.stringify(headers, null, 2))
    console.log('📦 Payload completo:', JSON.stringify(payload, null, 2))
    console.log('📦 Tamanho do payload:', JSON.stringify(payload).length, 'caracteres')

    // Fazer requisição para N8N
    let response
    try {
      // Timeout aumentado para 600 segundos (10 minutos) - geração de dieta pode demorar muito
      // O timeout pode ser configurado via N8N_TIMEOUT no .env (em milissegundos)
      const timeoutMs = parseInt(process.env.N8N_TIMEOUT) || 600000 // 10 minutos padrão
      console.log(`⏱️  Timeout configurado: ${timeoutMs / 1000} segundos (${timeoutMs / 60000} minutos)`)
      console.log('🚀 Iniciando fetch para N8N...')
      
      const fetchStartTime = Date.now()
      response = await fetch(N8N_GET_DIET_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs) // Timeout configurável
      })
      
      const fetchDuration = Date.now() - fetchStartTime
      console.log(`✅ Fetch concluído em ${fetchDuration}ms`)
      console.log('   Status:', response.status, response.statusText)
      console.log('   Headers da resposta:', Object.fromEntries(response.headers.entries()))
    } catch (fetchError) {
      console.error('❌ ===== ERRO AO FAZER FETCH =====')
      console.error('   Tipo do erro:', fetchError.name)
      console.error('   Mensagem:', fetchError.message)
      console.error('   Stack:', fetchError.stack)
      console.error('   URL tentada:', N8N_GET_DIET_URL)
      
      // Verificar se é um erro de timeout
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        const timeoutMinutes = (parseInt(process.env.N8N_TIMEOUT) || 600000) / 60000
        throw new Error(`Tempo limite de ${timeoutMinutes} minutos excedido. A geração da dieta está demorando mais que o esperado. Tente novamente ou otimize o prompt do agente N8N (veja PROMPT_OTIMIZADO_N8N.md).`)
      }
      
      // Verificar se é erro de conexão
      if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error(`Não foi possível conectar ao N8N. Verifique se o N8N está rodando e se a URL ${N8N_GET_DIET_URL} está correta.`)
      }
      
      throw new Error(`Erro ao comunicar com o serviço de geração de dieta: ${fetchError.message}`)
    }

    const responseText = await response.text()
    console.log('📥 Resposta recebida do N8N, status:', response.status)
    console.log('📥 Tamanho da resposta:', responseText.length, 'caracteres')

    if (!response.ok) {
      console.error('❌ Erro do N8N:', response.status, responseText)
      throw new Error(`Erro ao gerar dieta: ${response.status} ${responseText.substring(0, 200)}`)
    }

    // Parse da resposta do N8N
    let responseData
    try {
      // Tentar parse direto
      responseData = JSON.parse(responseText)
      console.log('✅ Parse direto bem-sucedido')
    } catch (e) {
      console.log('⚠️  Parse direto falhou, tentando alternativas...')
      console.log('📄 Primeiros 500 caracteres da resposta:', responseText.substring(0, 500))
      
      // Tentar extrair JSON se vier como string
      try {
        // Remover caracteres de escape \n se existirem
        let cleanedText = responseText
        if (cleanedText.includes('\\n')) {
          console.log('📝 Removendo caracteres de escape \\n')
          cleanedText = cleanedText.replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }
        
        // Função auxiliar para limpar e validar JSON
        const cleanAndParseJSON = (jsonString) => {
          try {
            // Remover caracteres de controle e BOM se existirem
            let cleaned = jsonString.trim()
            if (cleaned.charCodeAt(0) === 0xFEFF) {
              cleaned = cleaned.slice(1)
            }
            
            // Remover caracteres de escape problemáticos
            cleaned = cleaned
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
            
            // Tentar encontrar JSON válido (pode estar dentro de markdown code blocks)
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const jsonCandidate = jsonMatch[0]
              // Validar se é JSON válido tentando parsear
              try {
                return JSON.parse(jsonCandidate)
              } catch (e) {
                // Se falhar, tentar corrigir problemas comuns
                // Remover vírgulas finais antes de }
                let fixed = jsonCandidate.replace(/,(\s*[}\]])/g, '$1')
                // Remover vírgulas duplas
                fixed = fixed.replace(/,,+/g, ',')
                // Tentar parsear novamente
                return JSON.parse(fixed)
              }
            }
            
            // Se não encontrou match, tentar parsear a string inteira
            return JSON.parse(cleaned)
          } catch (e) {
            console.error('❌ Erro ao limpar JSON:', e.message)
            console.error('   Posição do erro:', e.message.match(/position (\d+)/)?.[1])
            // Tentar extrair JSON mesmo com erros
            const jsonMatch = jsonString.match(/\{[\s\S]{0,10000}\}/)
            if (jsonMatch) {
              try {
                // Remover caracteres problemáticos e tentar novamente
                let fixed = jsonMatch[0]
                  .replace(/,\s*}/g, '}')
                  .replace(/,\s*]/g, ']')
                  .replace(/,\s*,/g, ',')
                  .replace(/:\s*,/g, ': null,')
                return JSON.parse(fixed)
              } catch (e2) {
                throw new Error(`JSON inválido: ${e.message}. Posição aproximada: ${e.message.match(/position (\d+)/)?.[1] || 'desconhecida'}`)
              }
            }
            throw e
          }
        }
        
        // Tentar encontrar JSON na string
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            responseData = cleanAndParseJSON(jsonMatch[0])
            console.log('✅ JSON extraído e parseado com sucesso')
          } catch (e3) {
            console.error('❌ Erro ao parsear JSON extraído:', e3.message)
            // Tentar parsear a string inteira após limpeza
            try {
              responseData = cleanAndParseJSON(cleanedText)
              console.log('✅ JSON parseado após limpeza completa')
            } catch (e4) {
              console.error('❌ Erro ao parsear após limpeza completa:', e4.message)
              console.error('   Primeiros 500 chars da resposta:', cleanedText.substring(0, 500))
              throw new Error(`Resposta do N8N não contém JSON válido: ${e4.message}`)
            }
          }
        } else {
          // Tentar parsear a string inteira após limpeza
          try {
            responseData = cleanAndParseJSON(cleanedText)
            console.log('✅ JSON parseado após limpeza')
          } catch (e3) {
            console.error('❌ Erro ao parsear após limpeza:', e3.message)
            throw new Error(`Resposta do N8N não contém JSON válido: ${e3.message}`)
          }
        }
      } catch (e2) {
        console.error('❌ Erro ao parsear resposta:', e2)
        console.error('📄 Resposta completa recebida (primeiros 1000 chars):', responseText.substring(0, 1000))
        throw new Error(`Erro ao processar resposta do serviço de geração de dieta: ${e2.message}`)
      }
    }

    // Se a resposta vier dentro de um array (formato do N8N)
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log('📦 Resposta é array, pegando primeiro item')
      responseData = responseData[0]
    }

    // Se a resposta vier dentro de um objeto output (formato do N8N)
    if (responseData && responseData.output) {
      console.log('📦 Resposta tem campo output')
      // Se output for string JSON, fazer parse primeiro
      if (typeof responseData.output === 'string') {
        try {
          console.log('📝 output é string, fazendo parse...')
          // Remover caracteres de escape se necessário
          let outputText = responseData.output
          if (outputText.includes('\\n')) {
            outputText = outputText.replace(/\\n/g, '\n').replace(/\\"/g, '"')
          }
          responseData = JSON.parse(outputText)
          console.log('✅ output parseado com sucesso')
        } catch (e) {
          console.log('⚠️  Parse de output falhou, tentando extrair JSON...')
          // Tentar extrair JSON da string se parse direto falhar
          const jsonMatch = responseData.output.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            responseData = JSON.parse(jsonMatch[0])
            console.log('✅ JSON extraído de output')
          } else {
            throw new Error('Não foi possível parsear JSON de output')
          }
        }
      } else if (typeof responseData.output === 'object') {
        // Se output já for objeto, usar diretamente
        console.log('📦 output já é objeto, usando diretamente')
        responseData = responseData.output
      }
    }

    // Se ainda for string (caso não tenha vindo em output), tentar parsear
    if (typeof responseData === 'string') {
      console.log('📝 responseData ainda é string, tentando parse final...')
      try {
        // Remover caracteres de escape se necessário
        let cleanedData = responseData
        if (cleanedData.includes('\\n')) {
          cleanedData = cleanedData.replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }
        responseData = JSON.parse(cleanedData)
        console.log('✅ Parse final bem-sucedido')
      } catch (e) {
        console.log('⚠️  Parse final falhou, tentando extrair JSON...')
        // Tentar extrair JSON da string
        const jsonMatch = responseData.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
          console.log('✅ JSON extraído no parse final')
        } else {
          console.error('❌ Não foi possível extrair JSON da string')
          throw new Error('Resposta não é um JSON válido')
        }
      }
    }

    console.log('✅ Resposta parseada com sucesso')
    console.log('📊 Chaves da resposta:', Object.keys(responseData))
    console.log('📊 Tipo de responseData:', typeof responseData)
    console.log('📊 responseData.dieta existe?', !!responseData.dieta)
    
    // NOVO: Se não tiver campo "dieta", mas tiver um objeto no nível raiz com a estrutura de dieta
    // (pode acontecer se o N8N retornar diretamente o objeto dieta sem wrapper)
    if (!responseData.dieta && typeof responseData === 'object' && responseData !== null) {
      const keys = Object.keys(responseData)
      // Se tiver totalDiaKcal e macrosDia no nível raiz, é o objeto dieta direto
      if (responseData.totalDiaKcal !== undefined && responseData.macrosDia) {
        console.log('📦 Detectado: objeto dieta no nível raiz (sem wrapper)')
        responseData = { dieta: responseData }
        console.log('✅ Estrutura ajustada: { dieta: {...} }')
      }
    }

    // Se dieta vier como string (pode acontecer com caracteres de escape), tentar parsear
    if (responseData.dieta && typeof responseData.dieta === 'string') {
      console.log('⚠️  dieta é string, tentando parsear...')
      console.log('   Primeiros 200 caracteres:', responseData.dieta.substring(0, 200))
      try {
        let dietaString = responseData.dieta
        // Remover caracteres de escape se necessário
        if (dietaString.includes('\\n')) {
          console.log('   Removendo caracteres de escape \\n')
          dietaString = dietaString.replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }
        responseData.dieta = JSON.parse(dietaString)
        console.log('✅ dieta parseada com sucesso')
        console.log('   Tipo após parse:', typeof responseData.dieta)
        console.log('   Chaves após parse:', Object.keys(responseData.dieta))
      } catch (e) {
        console.error('❌ Erro ao parsear dieta string:', e.message)
        // Tentar extrair JSON da string (pode ter múltiplos objetos JSON)
        // Procurar pelo objeto que contém "totalDiaKcal" e "macrosDia"
        const jsonMatches = responseData.dieta.match(/\{[^{}]*"totalDiaKcal"[^{}]*\}/g) || 
                           responseData.dieta.match(/\{[\s\S]*?\}/g) || []
        
        for (const jsonMatch of jsonMatches) {
          try {
            let matchedJson = jsonMatch
            if (matchedJson.includes('\\n')) {
              matchedJson = matchedJson.replace(/\\n/g, '\n').replace(/\\"/g, '"')
            }
            const parsed = JSON.parse(matchedJson)
            // Verificar se é o objeto dieta (tem totalDiaKcal e macrosDia)
            if (parsed.totalDiaKcal !== undefined && parsed.macrosDia) {
              responseData.dieta = parsed
              console.log('✅ JSON extraído de dieta string (objeto correto encontrado)')
              console.log('   Tipo após extração:', typeof responseData.dieta)
              console.log('   Chaves após extração:', Object.keys(responseData.dieta))
              break
            }
          } catch (e2) {
            // Continuar tentando outros matches
            continue
          }
        }
        
        // Se ainda não conseguiu, tentar parse direto de toda a string (pode ser JSON válido com escapes)
        if (typeof responseData.dieta === 'string') {
          try {
            // Tentar parse direto removendo todos os escapes
            let finalAttempt = responseData.dieta
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
            responseData.dieta = JSON.parse(finalAttempt)
            console.log('✅ dieta parseada após remoção completa de escapes')
          } catch (e3) {
            console.error('❌ Erro final ao parsear dieta:', e3.message)
            console.error('   Primeiros 500 chars:', responseData.dieta.substring(0, 500))
          }
        }
      }
    }
    
    if (responseData.dieta) {
      console.log('📊 Tipo de responseData.dieta:', typeof responseData.dieta)
      if (typeof responseData.dieta === 'object') {
        console.log('📊 Chaves de responseData.dieta:', Object.keys(responseData.dieta))
        console.log('📊 responseData.dieta.macrosDia existe?', !!responseData.dieta.macrosDia)
        console.log('📊 responseData.dieta.totalDiaKcal existe?', responseData.dieta.totalDiaKcal !== undefined)
        if (responseData.dieta.macrosDia) {
          console.log('📊 macrosDia:', JSON.stringify(responseData.dieta.macrosDia, null, 2))
        }
      }
    }

    // Processar estrutura do novo formato: { dieta: { totalDiaKcal, macrosDia: { proteina_g, carbo_g, gordura_g }, refeicoes: [...] } }
    // IMPORTANTE: O agente NÃO retorna mais nutritionalNeeds diretamente. Sempre criar a partir de macrosDia e totalDiaKcal
    let nutritionalNeeds = null
    let dietaJson = null
    
    // Função para normalizar estrutura do N8N para o formato esperado pelo frontend
    const normalizarEstruturaAlimento = (item) => {
      // Converter nome/item → alimento (se necessário)
      const alimento = item.alimento || item.nome || item.item || 'Alimento não especificado'
      
      // Converter peso_g + unidade → porcao formatada (ou usar quantidade_g já formatado)
      let porcao = item.porcao || item.quantidade_g || ''
      if (!porcao && item.peso_g && item.unidade) {
        porcao = `${item.peso_g}${item.unidade}`
      } else if (!porcao && item.peso_g) {
        porcao = `${item.peso_g}g`
      }
      
      // Garantir que macros esteja em um objeto (se não estiver)
      let macros = item.macros
      if (!macros && (item.proteina_g !== undefined || item.carbo_g !== undefined || item.gordura_g !== undefined)) {
        macros = {
          proteina_g: item.proteina_g || 0,
          carbo_g: item.carbo_g || 0,
          gordura_g: item.gordura_g || 0
        }
      }
      
      return {
        alimento,
        porcao,
        kcal: item.kcal || 0,
        macros,
        substituicoes: item.substituicoes?.map(sub => ({
          alimento: sub.alimento || sub.nome || sub.item || 'Substituição',
          porcao: sub.porcao || sub.quantidade_g || (sub.peso_g && sub.unidade ? `${sub.peso_g}${sub.unidade}` : (sub.peso_g ? `${sub.peso_g}g` : '')),
          porcaoEquivalente: sub.porcaoEquivalente || sub.quantidade_g || (sub.peso_g && sub.unidade ? `${sub.peso_g}${sub.unidade}` : (sub.peso_g ? `${sub.peso_g}g` : '')),
          kcal: sub.kcal || 0,
          tipo: sub.tipo || sub.opcao || null,
          macros: sub.macros || (sub.proteina_g !== undefined ? {
            proteina_g: sub.proteina_g || 0,
            carbo_g: sub.carbo_g || 0,
            gordura_g: sub.gordura_g || 0
          } : null)
        })) || []
      }
    }
    
    // PRIMEIRO: Garantir que responseData.dieta seja um objeto
    if (responseData.dieta) {
      if (typeof responseData.dieta === 'string') {
        console.log('⚠️  responseData.dieta é string, parseando...')
        try {
          let cleaned = responseData.dieta
          if (cleaned.includes('\\n')) {
            cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"')
          }
          responseData.dieta = JSON.parse(cleaned)
          console.log('✅ responseData.dieta parseado')
        } catch (e) {
          console.error('❌ Erro ao parsear responseData.dieta:', e.message)
        }
      }
      
      if (typeof responseData.dieta === 'object' && responseData.dieta !== null) {
        dietaJson = responseData.dieta
        
        // PRIORIDADE ABSOLUTA: Sempre verificar primeiro se tem macrosDia e totalDiaKcal (novo formato)
        // Este é o formato padrão agora - o agente sempre retorna assim
        console.log('🔍 Verificando macrosDia e totalDiaKcal...')
        console.log('   dietaJson.macrosDia existe?', !!dietaJson.macrosDia)
        console.log('   dietaJson.totalDiaKcal existe?', dietaJson.totalDiaKcal !== undefined)
        
        if (dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object' && dietaJson.totalDiaKcal !== undefined) {
          console.log('📦 Novo formato detectado: { dieta: { totalDiaKcal, macrosDia, refeicoes } }')
          console.log('   macrosDia:', JSON.stringify(dietaJson.macrosDia, null, 2))
          console.log('   totalDiaKcal:', dietaJson.totalDiaKcal)
          
          // SEMPRE criar nutritionalNeeds a partir de macrosDia e totalDiaKcal
          nutritionalNeeds = {
            calorias: dietaJson.totalDiaKcal,
            macros: {
              proteina: dietaJson.macrosDia.proteina_g || 0,
              carboidrato: dietaJson.macrosDia.carbo_g || 0,
              gordura: dietaJson.macrosDia.gordura_g || 0
            }
          }
          console.log('✅ nutritionalNeeds criado a partir de macrosDia e totalDiaKcal')
          console.log('📊 nutritionalNeeds:', JSON.stringify(nutritionalNeeds, null, 2))
        } else {
          console.warn('⚠️  macrosDia ou totalDiaKcal não encontrados em dietaJson')
          console.warn('   Chaves disponíveis:', Object.keys(dietaJson))
        }
      }
    }
    
    // Se ainda não criou nutritionalNeeds, tentar outras estruturas (compatibilidade)
    if (!nutritionalNeeds) {
      console.log('⚠️  nutritionalNeeds ainda não foi criado, tentando fallbacks...')
      
      if (responseData.dieta && typeof responseData.dieta === 'object') {
        if (!dietaJson) {
          dietaJson = responseData.dieta
        }
        
        // FALLBACK 1: Verificar novamente macrosDia (pode ter sido perdido)
        if (dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object' && dietaJson.totalDiaKcal !== undefined) {
          console.log('📦 Fallback: Criando nutritionalNeeds de macrosDia...')
          nutritionalNeeds = {
            calorias: dietaJson.totalDiaKcal,
            macros: {
              proteina: dietaJson.macrosDia.proteina_g || 0,
              carboidrato: dietaJson.macrosDia.carbo_g || 0,
              gordura: dietaJson.macrosDia.gordura_g || 0
            }
          }
          console.log('✅ nutritionalNeeds criado no fallback')
        }
        // FALLBACK 2: Verificar se tem nutritionalNeeds e dieta dentro do objeto dieta (formato antigo - compatibilidade)
        else if (responseData.dieta.nutritionalNeeds && responseData.dieta.dieta) {
          nutritionalNeeds = responseData.dieta.nutritionalNeeds
          dietaJson = responseData.dieta.dieta
          console.log('📦 Formato antigo detectado: { dieta: { nutritionalNeeds, dieta } }')
        } 
        // FALLBACK 3: Verificar se tem nutritionalNeeds separado no nível raiz (formato antigo - compatibilidade)
        else if (responseData.nutritionalNeeds && responseData.dieta) {
          nutritionalNeeds = responseData.nutritionalNeeds
          dietaJson = responseData.dieta
          console.log('📦 Formato antigo detectado: { nutritionalNeeds, dieta }')
        } 
        // FALLBACK 4: Tentar usar o objeto dieta inteiro como dietaJson
        else {
          console.warn('⚠️  Estrutura não reconhecida, tentando adaptar...')
          dietaJson = responseData.dieta
          
          // Se tiver macrosDia mesmo no fallback, criar nutritionalNeeds
          if (dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object' && dietaJson.totalDiaKcal !== undefined) {
            console.log('📦 Criando nutritionalNeeds de macrosDia no fallback final...')
            nutritionalNeeds = {
              calorias: dietaJson.totalDiaKcal,
              macros: {
                proteina: dietaJson.macrosDia.proteina_g || 0,
                carboidrato: dietaJson.macrosDia.carbo_g || 0,
                gordura: dietaJson.macrosDia.gordura_g || 0
              }
            }
          } else {
            // Último recurso: tentar buscar nutritionalNeeds da resposta (compatibilidade)
            nutritionalNeeds = responseData.dieta.nutritionalNeeds || responseData.nutritionalNeeds || null
          }
        }
      } else {
        // Estrutura direta no nível raiz (formato antigo - compatibilidade)
        nutritionalNeeds = responseData.nutritionalNeeds
        dietaJson = responseData.dieta
      }
    }

    // Validar que tem dieta (obrigatório)
    if (!dietaJson) {
      console.error('❌ Estrutura da resposta inválida: dieta não encontrada')
      console.error('   responseData:', JSON.stringify(responseData, null, 2))
      console.error('   Tipo de responseData:', typeof responseData)
      console.error('   Chaves de responseData:', Object.keys(responseData || {}))
      
      // ÚLTIMA TENTATIVA: Se responseData tem totalDiaKcal e macrosDia no nível raiz, usar diretamente
      if (responseData && typeof responseData === 'object' && responseData.totalDiaKcal !== undefined && responseData.macrosDia) {
        console.log('📦 ÚLTIMA TENTATIVA: Usando responseData diretamente como dieta')
        dietaJson = responseData
      } else {
        throw new Error('Resposta inválida: falta objeto "dieta"')
      }
    }
    
    // Garantir que dietaJson é um objeto (pode ainda ser string)
    if (typeof dietaJson === 'string') {
      console.log('⚠️  dietaJson ainda é string antes da validação final, parseando...')
      try {
        let cleaned = dietaJson
        if (cleaned.includes('\\n')) {
          cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"')
        }
        dietaJson = JSON.parse(cleaned)
        console.log('✅ dietaJson parseado antes da validação final')
        console.log('   Chaves:', Object.keys(dietaJson))
      } catch (e) {
        console.error('❌ Erro ao parsear dietaJson:', e.message)
        // Tentar extrair JSON
        const jsonMatch = dietaJson.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            dietaJson = JSON.parse(jsonMatch[0])
            console.log('✅ JSON extraído de dietaJson')
          } catch (e2) {
            console.error('❌ Erro ao extrair JSON:', e2.message)
          }
        }
      }
    }
    
    // Se não tiver nutritionalNeeds, tentar criar de todas as formas possíveis (validação final)
    if (!nutritionalNeeds) {
      console.log('⚠️  nutritionalNeeds ainda não foi criado, tentando todas as opções...')
      console.log('   Tipo de dietaJson:', typeof dietaJson)
      console.log('   dietaJson é objeto?', typeof dietaJson === 'object' && dietaJson !== null)
      
      // Garantir que dietaJson é um objeto
      if (typeof dietaJson === 'string') {
        console.log('⚠️  dietaJson ainda é string, tentando parsear...')
        try {
          let cleaned = dietaJson
          if (cleaned.includes('\\n')) {
            cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"')
          }
          dietaJson = JSON.parse(cleaned)
          console.log('✅ dietaJson parseado na validação final')
        } catch (e) {
          console.error('❌ Erro ao parsear dietaJson:', e.message)
        }
      }
      
      if (typeof dietaJson === 'object' && dietaJson !== null) {
        console.log('   Chaves de dietaJson:', Object.keys(dietaJson))
        console.log('   dietaJson.macrosDia:', !!dietaJson.macrosDia)
        console.log('   dietaJson.totalDiaKcal:', dietaJson.totalDiaKcal)
        
        // Opção 1: Criar a partir de macrosDia e totalDiaKcal (PRIORIDADE MÁXIMA)
        if (dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object' && dietaJson.totalDiaKcal !== undefined) {
          console.log('📦 Criando nutritionalNeeds a partir de macrosDia (validação final)...')
          console.log('   macrosDia:', JSON.stringify(dietaJson.macrosDia, null, 2))
          console.log('   totalDiaKcal:', dietaJson.totalDiaKcal)
          
          nutritionalNeeds = {
            calorias: dietaJson.totalDiaKcal,
            macros: {
              proteina: dietaJson.macrosDia.proteina_g || 0,
              carboidrato: dietaJson.macrosDia.carbo_g || 0,
              gordura: dietaJson.macrosDia.gordura_g || 0
            }
          }
          console.log('✅ nutritionalNeeds criado na validação final:', JSON.stringify(nutritionalNeeds, null, 2))
        } 
        // Opção 2: Calcular a partir dos itens da dieta
        else if (dietaJson.refeicoes && Array.isArray(dietaJson.refeicoes)) {
          console.log('📦 Tentando calcular nutritionalNeeds a partir dos itens...')
          let totalKcal = 0
          let totalProtein = 0
          let totalCarbs = 0
          let totalFat = 0
          
          dietaJson.refeicoes.forEach(refeicao => {
            if (refeicao.itens && Array.isArray(refeicao.itens)) {
              refeicao.itens.forEach(item => {
                totalKcal += item.kcal || 0
                if (item.macros && typeof item.macros === 'object') {
                  totalProtein += item.macros.proteina_g || 0
                  totalCarbs += item.macros.carbo_g || 0
                  totalFat += item.macros.gordura_g || 0
                }
              })
            }
          })
          
          if (totalKcal > 0 || totalProtein > 0 || totalCarbs > 0 || totalFat > 0) {
            console.log('📊 Calculando nutritionalNeeds a partir dos itens...')
            nutritionalNeeds = {
              calorias: dietaJson.totalDiaKcal || totalKcal,
              macros: {
                proteina: totalProtein || 0,
                carboidrato: totalCarbs || 0,
                gordura: totalFat || 0
              }
            }
            console.log('✅ nutritionalNeeds calculado:', JSON.stringify(nutritionalNeeds, null, 2))
          }
        }
      }
    }
    
    // ÚLTIMA TENTATIVA ABSOLUTA: Verificar novamente se macrosDia e totalDiaKcal existem
    // Esta é a garantia final - se macrosDia e totalDiaKcal existirem, SEMPRE criar nutritionalNeeds
    if (!nutritionalNeeds) {
      console.log('🔍 ÚLTIMA TENTATIVA ABSOLUTA: Verificando macrosDia e totalDiaKcal em todos os lugares possíveis...')
      
      // Verificar em diferentes locais da estrutura
      let macrosDia = null
      let totalDiaKcal = null
      let foundLocation = ''
      
      // Tentar 1: dietaJson.macrosDia
      if (dietaJson && typeof dietaJson === 'object' && dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object' && dietaJson.totalDiaKcal !== undefined) {
        macrosDia = dietaJson.macrosDia
        totalDiaKcal = dietaJson.totalDiaKcal
        foundLocation = 'dietaJson.macrosDia'
        console.log('   ✅ Encontrado em: dietaJson.macrosDia e dietaJson.totalDiaKcal')
      } 
      // Tentar 2: responseData.dieta.macrosDia
      else if (responseData.dieta && typeof responseData.dieta === 'object' && responseData.dieta.macrosDia && typeof responseData.dieta.macrosDia === 'object' && responseData.dieta.totalDiaKcal !== undefined) {
        macrosDia = responseData.dieta.macrosDia
        totalDiaKcal = responseData.dieta.totalDiaKcal
        foundLocation = 'responseData.dieta.macrosDia'
        console.log('   ✅ Encontrado em: responseData.dieta.macrosDia e responseData.dieta.totalDiaKcal')
      } 
      // Tentar 3: responseData.macrosDia (nível raiz)
      else if (responseData.macrosDia && typeof responseData.macrosDia === 'object' && responseData.totalDiaKcal !== undefined) {
        macrosDia = responseData.macrosDia
        totalDiaKcal = responseData.totalDiaKcal
        foundLocation = 'responseData.macrosDia'
        console.log('   ✅ Encontrado em: responseData.macrosDia e responseData.totalDiaKcal')
      }
      
      // Se encontrou macrosDia e totalDiaKcal, SEMPRE criar nutritionalNeeds
      if (macrosDia && typeof macrosDia === 'object' && totalDiaKcal !== undefined) {
        console.log(`🎯 CRIANDO nutritionalNeeds na última tentativa a partir de ${foundLocation}!`)
        nutritionalNeeds = {
          calorias: totalDiaKcal,
          macros: {
            proteina: macrosDia.proteina_g || macrosDia.proteina || 0,
            carboidrato: macrosDia.carbo_g || macrosDia.carboidrato || macrosDia.carbo || 0,
            gordura: macrosDia.gordura_g || macrosDia.gordura || 0
          }
        }
        console.log('✅ nutritionalNeeds criado na última tentativa:', JSON.stringify(nutritionalNeeds, null, 2))
      } else {
        console.log('   ⚠️  macrosDia e totalDiaKcal não encontrados em nenhum lugar')
      }
    }
    
    // VERIFICAÇÃO FINAL ABSOLUTA: Se ainda não tem nutritionalNeeds, fazer uma última busca exaustiva
    if (!nutritionalNeeds) {
      console.error('❌ nutritionalNeeds ainda não foi criado após TODAS as tentativas')
      console.error('🔍 Fazendo busca exaustiva por macrosDia e totalDiaKcal...')
      
      // Buscar em TODOS os lugares possíveis
      const searchLocations = [
        { obj: dietaJson, name: 'dietaJson' },
        { obj: responseData.dieta, name: 'responseData.dieta' },
        { obj: responseData, name: 'responseData' }
      ]
      
      for (const location of searchLocations) {
        if (location.obj && typeof location.obj === 'object') {
          console.log(`   Verificando ${location.name}...`)
          console.log(`   Chaves:`, Object.keys(location.obj))
          
          if (location.obj.macrosDia && typeof location.obj.macrosDia === 'object' && location.obj.totalDiaKcal !== undefined) {
            console.log(`   ✅ ENCONTRADO em ${location.name}!`)
            nutritionalNeeds = {
              calorias: location.obj.totalDiaKcal,
              macros: {
                proteina: location.obj.macrosDia.proteina_g || 0,
                carboidrato: location.obj.macrosDia.carbo_g || 0,
                gordura: location.obj.macrosDia.gordura_g || 0
              }
            }
            console.log('✅ nutritionalNeeds criado na busca exaustiva:', JSON.stringify(nutritionalNeeds, null, 2))
            break
          }
        }
      }
    }
    
    // Validar que tem nutritionalNeeds (agora obrigatório após todas as tentativas)
    if (!nutritionalNeeds) {
      // ÚLTIMO RECURSO: Se ainda não tem nutritionalNeeds, usar os valores calculados
      if (nutricaoCalculadaBackup) {
        console.log('⚠️  Usando necessidades nutricionais calculadas como último recurso')
        nutritionalNeeds = {
          calorias: nutricaoCalculadaBackup.calorias,
          macros: {
            proteina: nutricaoCalculadaBackup.macros.proteina,
            carboidrato: nutricaoCalculadaBackup.macros.carboidrato,
            gordura: nutricaoCalculadaBackup.macros.gordura
          }
        }
        console.log('✅ nutritionalNeeds criado usando valores calculados:', JSON.stringify(nutritionalNeeds, null, 2))
      } else {
        console.error('❌ Estrutura da resposta inválida: nutritionalNeeds não encontrado após TODAS as tentativas')
        console.error('   O agente DEVE retornar: { dieta: { totalDiaKcal, macrosDia: { proteina_g, carbo_g, gordura_g }, refeicoes: [...] } }')
        console.error('   dieta existe:', !!dietaJson)
        console.error('   Tipo de dietaJson:', typeof dietaJson)
        if (dietaJson && typeof dietaJson === 'object') {
          console.error('   Chaves de dietaJson:', Object.keys(dietaJson))
          console.error('   dietaJson.macrosDia existe?', !!dietaJson.macrosDia)
          console.error('   dietaJson.totalDiaKcal existe?', dietaJson.totalDiaKcal !== undefined)
          if (dietaJson.macrosDia) {
            console.error('   dietaJson.macrosDia:', JSON.stringify(dietaJson.macrosDia, null, 2))
          }
          console.error('   dietaJson.totalDiaKcal:', dietaJson.totalDiaKcal)
          console.error('   dietaJson.refeicoes existe?', !!dietaJson.refeicoes)
        }
        console.error('   Estrutura completa de responseData (primeiros 2000 chars):', JSON.stringify(responseData, null, 2).substring(0, 2000))
        if (dietaJson) {
          console.error('   Estrutura completa de dietaJson (primeiros 2000 chars):', JSON.stringify(dietaJson, null, 2).substring(0, 2000))
        }
        throw new Error('Resposta inválida: a resposta deve conter dieta.totalDiaKcal e dieta.macrosDia para criar nutritionalNeeds')
      }
    }
    
    // ✅ USANDO OUTPUT DIRETO DO AGENTE - SEM CORREÇÕES AUTOMÁTICAS
    // Os valores retornados pelo agente são usados exatamente como enviados
    if (dietaJson && typeof dietaJson === 'object') {
      console.log('📊 Valores retornados pelo agente (usando diretamente, sem correções):')
      console.log(`   - totalDiaKcal: ${dietaJson.totalDiaKcal || 'não informado'}`)
      if (dietaJson.macrosDia) {
        console.log(`   - macrosDia.proteina_g: ${dietaJson.macrosDia.proteina_g || 'não informado'}`)
        console.log(`   - macrosDia.carbo_g: ${dietaJson.macrosDia.carbo_g || 'não informado'}`)
        console.log(`   - macrosDia.gordura_g: ${dietaJson.macrosDia.gordura_g || 'não informado'}`)
      }
      console.log(`   - Número de refeições: ${dietaJson.refeicoes?.length || 0}`)
    }

    // Normalizar estrutura do nutritionalNeeds para o formato esperado pelo frontend
    // Usar valores EXATOS retornados pelo agente (sem cálculos ou ajustes)
    if (nutritionalNeeds && !nutritionalNeeds.macros && (nutritionalNeeds.proteina || nutritionalNeeds.carboidrato || nutritionalNeeds.gordura)) {
      nutritionalNeeds = {
        ...nutritionalNeeds,
        macros: {
          proteina: nutritionalNeeds.proteina || 0,
          carboidrato: nutritionalNeeds.carboidrato || 0,
          gordura: nutritionalNeeds.gordura || 0
        }
      }
      console.log('✅ Estrutura nutritionalNeeds normalizada para incluir macros')
    }
    
    // Garantir que nutritionalNeeds tem estrutura completa (usando valores do agente)
    if (nutritionalNeeds) {
      // Garantir que tem macros (usar valores do agente)
      if (!nutritionalNeeds.macros) {
        console.warn('⚠️  nutritionalNeeds não tem macros, criando estrutura padrão...')
        nutritionalNeeds.macros = {
          proteina: nutritionalNeeds.proteina || 0,
          carboidrato: nutritionalNeeds.carboidrato || 0,
          gordura: nutritionalNeeds.gordura || 0
        }
      }
      
      // Garantir que tem calorias (usar valor do agente ou 0)
      if (!nutritionalNeeds.calorias) {
        nutritionalNeeds.calorias = 0
      }
    }

    // ✅ USANDO OUTPUT DIRETO DO AGENTE - SEM AJUSTES AUTOMÁTICOS
    // O output do agente é usado exatamente como retornado, sem modificações
    // Não há mais ajustes de valores, equilíbrio, frutas ou vegetais
    console.log('✅ Usando output direto do agente - sem ajustes automáticos')

    // Normalizar estrutura dos alimentos (converter formato N8N para formato frontend)
    if (dietaJson && dietaJson.refeicoes && Array.isArray(dietaJson.refeicoes)) {
      console.log('🔄 Normalizando estrutura dos alimentos...')
      dietaJson.refeicoes = dietaJson.refeicoes.map((refeicao, refIdx) => {
        const itensNormalizados = refeicao.itens?.map((item, itemIdx) => {
          const normalizado = normalizarEstruturaAlimento(item)
          
          // Debug: log substituições do primeiro item da primeira refeição
          if (refIdx === 0 && itemIdx === 0 && item.substituicoes && item.substituicoes.length > 0) {
            console.log('🔍 Debug substituições do primeiro item:')
            console.log('   Original:', JSON.stringify(item.substituicoes[0], null, 2))
            console.log('   Normalizado:', JSON.stringify(normalizado.substituicoes[0], null, 2))
          }
          
          return normalizado
        }) || []
        
        return {
          ...refeicao,
          itens: itensNormalizados
        }
      })
      console.log('✅ Estrutura dos alimentos normalizada')
    }
    
    // Normalizar observacoesPlano: pode ser array, objeto ou string
    if (dietaJson && dietaJson.observacoesPlano) {
      if (Array.isArray(dietaJson.observacoesPlano)) {
        console.log('📝 observacoesPlano é array, convertendo para string...')
        dietaJson.observacoesPlano = dietaJson.observacoesPlano.join('\n\n')
        console.log('✅ observacoesPlano (array) convertido para string')
      } else if (typeof dietaJson.observacoesPlano === 'object') {
        console.log('📝 observacoesPlano é objeto, convertendo para string...')
        // Se for objeto com campos específicos, formatar
        const obsObj = dietaJson.observacoesPlano
        const parts = []
        
        if (obsObj.refeicaoLivre) parts.push(`Refeição Livre: ${obsObj.refeicaoLivre}`)
        if (obsObj.hidratacao) parts.push(`Hidratação: ${obsObj.hidratacao}`)
        if (obsObj.saidaDaDieta) parts.push(`Saída da Dieta: ${obsObj.saidaDaDieta}`)
        
        // Se tiver outros campos, adicionar também
        Object.keys(obsObj).forEach(key => {
          if (!['refeicaoLivre', 'hidratacao', 'saidaDaDieta'].includes(key)) {
            parts.push(`${key}: ${obsObj[key]}`)
          }
        })
        
        dietaJson.observacoesPlano = parts.length > 0 
          ? parts.join('\n\n') 
          : JSON.stringify(obsObj)
        console.log('✅ observacoesPlano (objeto) convertido para string')
      }
    }

    console.log('💾 Salvando dieta e necessidades nutricionais no banco...')

    // Combinar nutritionalNeeds e dieta em um único objeto para salvar
    const dietaCompleta = {
      nutritionalNeeds,
      dieta: dietaJson
    }
    const dietaString = JSON.stringify(dietaCompleta)

    try {
      const dietaSalva = await prisma.dieta.upsert({
        where: { userId },
        update: {
          dietaData: dietaString
        },
        create: {
          userId,
          dietaData: dietaString
        }
      })

      console.log('✅ Dieta salva com sucesso, ID:', dietaSalva.id)
    } catch (dbError) {
      console.error('❌ Erro ao salvar dieta no banco:', dbError)
      throw new Error(`Erro ao salvar dieta: ${dbError.message}`)
    }

    console.log('📤 Retornando resposta para o frontend:')
    console.log('   - nutritionalNeeds:', nutritionalNeeds ? '✓ presente' : '✗ ausente')
    console.log('   - dieta:', dietaJson ? '✓ presente' : '✗ ausente')
    
    // TEMPORÁRIO: Registro de geração desabilitado para testes
    // TODO: Reativar após testes
    /*
    // Registrar a geração de dieta
    await recordDietGeneration(userId)
    console.log('✅ Geração de dieta registrada no controle')
    */
    
    res.json({
      message: 'Dieta gerada com sucesso!',
      nutritionalNeeds: nutritionalNeeds,
      dieta: dietaJson
    })

  } catch (error) {
    console.error('❌ Erro ao gerar dieta:', error)
    console.error('Stack trace:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    // Retornar mais detalhes em desenvolvimento
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    res.status(500).json({
      error: 'Erro ao gerar dieta',
      details: error.message || 'Erro desconhecido',
      ...(isDevelopment && {
        stack: error.stack,
        name: error.name
      })
    })
  }
})

// Rota para obter dieta do usuário
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId

    const dieta = await prisma.dieta.findUnique({
      where: { userId }
    })

    if (!dieta) {
      return res.json({ dieta: null, nutritionalNeeds: null })
    }

    // Parse do JSON
    let dietaData
    try {
      dietaData = JSON.parse(dieta.dietaData)
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar dieta salva' })
    }

    // Se a estrutura tiver nutritionalNeeds e dieta separados
    if (dietaData.nutritionalNeeds && dietaData.dieta) {
      // Normalizar estrutura do nutritionalNeeds se necessário
      let nutritionalNeeds = dietaData.nutritionalNeeds
      if (!nutritionalNeeds.macros && (nutritionalNeeds.proteina || nutritionalNeeds.carboidrato || nutritionalNeeds.gordura)) {
        nutritionalNeeds = {
          ...nutritionalNeeds,
          macros: {
            proteina: nutritionalNeeds.proteina || 0,
            carboidrato: nutritionalNeeds.carboidrato || 0,
            gordura: nutritionalNeeds.gordura || 0
          }
        }
      }
      
      // Normalizar observacoesPlano se for objeto (para dietas antigas ou mal formatadas)
      let dietaNormalizada = dietaData.dieta
      if (dietaNormalizada && dietaNormalizada.observacoesPlano && typeof dietaNormalizada.observacoesPlano === 'object') {
        console.log('📝 Normalizando observacoesPlano ao carregar dieta...')
        const obsObj = dietaNormalizada.observacoesPlano
        const parts = []
        
        if (obsObj.refeicaoLivre) parts.push(`Refeição Livre: ${obsObj.refeicaoLivre}`)
        if (obsObj.hidratacao) parts.push(`Hidratação: ${obsObj.hidratacao}`)
        if (obsObj.saidaDaDieta) parts.push(`Saída da Dieta: ${obsObj.saidaDaDieta}`)
        
        // Se tiver outros campos, adicionar também
        Object.keys(obsObj).forEach(key => {
          if (!['refeicaoLivre', 'hidratacao', 'saidaDaDieta'].includes(key)) {
            const value = obsObj[key]
            if (typeof value === 'string') {
              parts.push(`${key}: ${value}`)
            }
          }
        })
        
        dietaNormalizada = {
          ...dietaNormalizada,
          observacoesPlano: parts.length > 0 ? parts.join('\n\n') : JSON.stringify(obsObj)
        }
        console.log('✅ observacoesPlano normalizado')
      }
      
      return res.json({
        nutritionalNeeds: nutritionalNeeds,
        dieta: dietaNormalizada
      })
    }

    // Caso contrário, retornar estrutura antiga
    // Normalizar observacoesPlano se for objeto
    let dietaNormalizada = dietaData
    if (dietaNormalizada && dietaNormalizada.observacoesPlano && typeof dietaNormalizada.observacoesPlano === 'object') {
      console.log('📝 Normalizando observacoesPlano (estrutura antiga)...')
      const obsObj = dietaNormalizada.observacoesPlano
      const parts = []
      
      if (obsObj.refeicaoLivre) parts.push(`Refeição Livre: ${obsObj.refeicaoLivre}`)
      if (obsObj.hidratacao) parts.push(`Hidratação: ${obsObj.hidratacao}`)
      if (obsObj.saidaDaDieta) parts.push(`Saída da Dieta: ${obsObj.saidaDaDieta}`)
      
      Object.keys(obsObj).forEach(key => {
        if (!['refeicaoLivre', 'hidratacao', 'saidaDaDieta'].includes(key)) {
          const value = obsObj[key]
          if (typeof value === 'string') {
            parts.push(`${key}: ${value}`)
          }
        }
      })
      
      dietaNormalizada = {
        ...dietaNormalizada,
        observacoesPlano: parts.length > 0 ? parts.join('\n\n') : JSON.stringify(obsObj)
      }
    }
    
    res.json({ dieta: dietaNormalizada, nutritionalNeeds: null })

  } catch (error) {
    console.error('Erro ao buscar dieta:', error)
    res.status(500).json({ error: 'Erro ao buscar dieta' })
  }
})

// Rota para atualizar um item específico da dieta
router.patch('/update-item', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId
    const { mealIndex, itemIndex, newItem } = req.body

    if (mealIndex === undefined || itemIndex === undefined || !newItem) {
      return res.status(400).json({ error: 'Parâmetros inválidos: mealIndex, itemIndex e newItem são obrigatórios' })
    }

    // Buscar dieta atual
    const dieta = await prisma.dieta.findUnique({
      where: { userId }
    })

    if (!dieta) {
      return res.status(404).json({ error: 'Dieta não encontrada' })
    }

    // Parse do JSON
    let dietaDataParsed
    try {
      dietaDataParsed = JSON.parse(dieta.dietaData)
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar dieta salva' })
    }

    // A dieta pode estar em dietaDataParsed.dieta ou diretamente em dietaDataParsed
    let dietaData
    if (dietaDataParsed.dieta && typeof dietaDataParsed.dieta === 'object') {
      // Estrutura: { nutritionalNeeds: {...}, dieta: {...} }
      dietaData = dietaDataParsed.dieta
    } else {
      // Estrutura antiga: dieta diretamente
      dietaData = dietaDataParsed
    }

    // Validar índices
    if (!dietaData.refeicoes || !Array.isArray(dietaData.refeicoes)) {
      console.error('❌ Estrutura inválida - refeicoes:', dietaData.refeicoes)
      console.error('❌ dietaData completo:', JSON.stringify(dietaData, null, 2))
      return res.status(400).json({ error: 'Estrutura de dieta inválida' })
    }

    if (!dietaData.refeicoes[mealIndex] || !dietaData.refeicoes[mealIndex].itens) {
      return res.status(400).json({ error: 'Refeição ou item não encontrado' })
    }

    if (!dietaData.refeicoes[mealIndex].itens[itemIndex]) {
      return res.status(400).json({ error: 'Item não encontrado' })
    }

    // Atualizar o item
    const oldItem = dietaData.refeicoes[mealIndex].itens[itemIndex]
    const kcalDiff = (newItem.kcal || oldItem.kcal) - oldItem.kcal

    // Preparar macros do novo item (suportar novo formato com macrosAproximados ou macros direto)
    let macros = null
    if (newItem.macrosAproximados) {
      // Converter macrosAproximados para o formato novo (proteina_g, carbo_g, gordura_g)
      macros = {
        proteina_g: newItem.macrosAproximados.proteina_g || newItem.macrosAproximados.proteina || 0,
        carbo_g: newItem.macrosAproximados.carbo_g || newItem.macrosAproximados.carboidrato || newItem.macrosAproximados.carbo || 0,
        gordura_g: newItem.macrosAproximados.gordura_g || newItem.macrosAproximados.gordura || 0
      }
    } else if (newItem.macros) {
      // Se já vier no formato novo, usar diretamente
      macros = newItem.macros
    } else if (oldItem.macros) {
      // Se o item antigo tinha macros, tentar preservar (pode ser necessário recalcular)
      macros = oldItem.macros
    }

    // Substituir o item
    const updatedItem = {
      ...newItem,
      substituicoes: oldItem.substituicoes || [] // Manter substituições originais
    }
    
    // Incluir macros se disponíveis
    if (macros) {
      updatedItem.macros = macros
    }
    
    dietaData.refeicoes[mealIndex].itens[itemIndex] = updatedItem

    // Atualizar total da refeição
    const totalRefeicaoKcal = dietaData.refeicoes[mealIndex].itens.reduce((sum, item) => sum + (item.kcal || 0), 0)
    dietaData.refeicoes[mealIndex].totalRefeicaoKcal = totalRefeicaoKcal

    // Atualizar total do dia se existir
    const totalDiaKcal = dietaData.refeicoes.reduce((sum, ref) => sum + (ref.totalRefeicaoKcal || 0), 0)
    if (dietaData.totalDiaKcal !== undefined) {
      dietaData.totalDiaKcal = totalDiaKcal
    }

    // Salvar dieta atualizada (manter estrutura original se tiver nutritionalNeeds)
    let dietaString
    if (dietaDataParsed.nutritionalNeeds) {
      // Manter estrutura com nutritionalNeeds
      dietaDataParsed.dieta = dietaData
      dietaString = JSON.stringify(dietaDataParsed)
    } else {
      // Salvar apenas a dieta
      dietaString = JSON.stringify(dietaData)
    }

    await prisma.dieta.update({
      where: { userId },
      data: {
        dietaData: dietaString
      }
    })

    console.log(`Item atualizado na refeição ${mealIndex}, item ${itemIndex}`)

    res.json({
      message: 'Item atualizado com sucesso!',
      dieta: dietaData
    })

  } catch (error) {
    console.error('Erro ao atualizar item da dieta:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar item da dieta',
      details: error.message 
    })
  }
})

// Função para extrair URL base do N8N_WEBHOOK_URL e construir swap-food URL
const getSwapFoodUrl = () => {
  const baseUrl = normalizeWebhookUrl(process.env.N8N_WEBHOOK_URL || '')
  if (!baseUrl) return ''
  
  // Extrair base URL removendo o último path
  const urlParts = baseUrl.split('/')
  urlParts.pop() // Remove último segmento
  const basePath = urlParts.join('/')
  
  return `${basePath}/swap-food`
}

const N8N_SWAP_FOOD_URL = getSwapFoodUrl()

// Função auxiliar para extrair peso em gramas de uma string de porção
function extractPesoG(porcao) {
  if (!porcao) return 0
  
  // Se for número, retornar diretamente
  if (typeof porcao === 'number') {
    return porcao
  }
  
  // Se não for string, tentar converter
  const porcaoStr = String(porcao)
  
  // Procurar por números seguidos de 'g' ou 'g '
  const match = porcaoStr.match(/(\d+(?:\.\d+)?)\s*g/i)
  if (match) {
    return parseFloat(match[1])
  }
  
  // Tentar converter outras unidades comuns (ex: ml para g aproximado)
  const mlMatch = porcaoStr.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (mlMatch) {
    return parseFloat(mlMatch[1]) // Aproximação: 1ml ≈ 1g
  }
  
  // Tentar extrair número no início da string (caso seja só número com texto)
  const numMatch = porcaoStr.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) {
    return parseFloat(numMatch[1])
  }
  
  // Se não encontrar, retornar 0
  return 0
}

// Rota para trocar alimento usando o agente swap-food
router.post('/swap-food', authenticate, async (req, res) => {
  try {
    const { mealIndex, itemIndex, userDesiredFood, dieta } = req.body

    if (mealIndex === undefined || itemIndex === undefined || !userDesiredFood) {
      return res.status(400).json({ error: 'Parâmetros inválidos: mealIndex, itemIndex e userDesiredFood são obrigatórios' })
    }

    if (!dieta || !dieta.refeicoes || !dieta.refeicoes[mealIndex]) {
      return res.status(400).json({ error: 'Dados da dieta inválidos' })
    }

    const userId = req.user.userId

    // Buscar dados do questionário para contexto
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    // Buscar alimentos customizados do nutricionista para incluir nas sugestões da IA
    const alimentosCustomizados = await prisma.alimento.findMany({
      where: {
        nutricionistaId: userId // Alimentos criados por este nutricionista
      },
      select: {
        id: true,
        descricao: true,
        categoria: true,
        energiaKcal: true,
        proteina: true,
        lipideos: true,
        carboidrato: true
      },
      orderBy: {
        descricao: 'asc'
      }
    })

    const refeicao = dieta.refeicoes[mealIndex]
    const itemOriginal = refeicao.itens[itemIndex]

    if (!itemOriginal) {
      return res.status(400).json({ error: 'Item não encontrado' })
    }

    // Preparar currentMealItems
    const currentMealItems = refeicao.itens.map(item => ({
      alimento: item.alimento,
      peso_g: extractPesoG(item.porcao),
      kcal: item.kcal || 0
    }))

    // Preparar originalItem
    const originalItem = {
      alimento: itemOriginal.alimento,
      peso_g: extractPesoG(itemOriginal.porcao),
      kcal: itemOriginal.kcal || 0
    }

    // Preparar userContext.questionnaire
    let questionnaireContext = null
    if (questionnaireData) {
      questionnaireContext = {
        restricoes: questionnaireData.restricoes ? JSON.parse(questionnaireData.restricoes) : [],
        alimentosNaoGosta: questionnaireData.alimentosNaoGosta || null,
        preferenciaAlimentacao: questionnaireData.preferenciaAlimentacao || null,
        observacoes: questionnaireData.observacoes || null
      }
    }

    // Preparar payload para N8N incluindo alimentos customizados
    const payload = {
      swapRequest: {
        mealName: refeicao.nome,
        originalItem: originalItem,
        currentMealItems: currentMealItems,
        userDesiredFood: userDesiredFood.trim()
      },
      userContext: {
        questionnaire: questionnaireContext
      },
      // Incluir alimentos customizados para que a IA possa considerá-los
      customFoods: alimentosCustomizados.map(alimento => ({
        descricao: alimento.descricao,
        categoria: alimento.categoria || 'Customizado',
        energiaKcal: alimento.energiaKcal, // por 100g
        proteina: alimento.proteina, // por 100g
        lipideos: alimento.lipideos, // por 100g
        carboidrato: alimento.carboidrato // por 100g
      }))
    }

    console.log('\n📤 ===== ENVIANDO REQUEST PARA SWAP-FOOD =====')
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('URL:', N8N_SWAP_FOOD_URL)

    if (!N8N_SWAP_FOOD_URL) {
      return res.status(500).json({
        error: 'Serviço de troca de alimento não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env'
      })
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    // Fazer requisição para N8N
    let response
    try {
      response = await fetch(N8N_SWAP_FOOD_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      })
    } catch (fetchError) {
      console.error('Erro ao fazer fetch:', fetchError)
      throw new Error('Erro ao comunicar com o serviço de troca de alimento')
    }

    // Ler resposta como texto primeiro
    const responseText = await response.text()
    console.log('Resposta recebida (texto):', responseText.substring(0, 300))
    
    if (!response.ok) {
      console.error('Erro do N8N:', response.status, responseText)
      throw new Error(`Erro do servidor: ${response.status}`)
    }

    // Parse da resposta
    let responseData
    
    try {
      // Tentar parsear como JSON diretamente
      responseData = JSON.parse(responseText)
      
      // Se o resultado for uma string, fazer parse novamente
      if (typeof responseData === 'string') {
        console.log('Resposta é uma string JSON, fazendo parse novamente...')
        responseData = JSON.parse(responseData)
      }
    } catch (parseError) {
      console.log('Erro no parse inicial, tentando extrair JSON:', parseError.message)
      // Se não conseguir parsear diretamente, tentar extrair JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0]
          responseData = JSON.parse(extractedJson)
          
          // Se ainda for string, parsear novamente
          if (typeof responseData === 'string') {
            responseData = JSON.parse(responseData)
          }
        } catch (e) {
          console.error('Erro ao parsear JSON extraído:', e)
          throw new Error('Resposta não é um JSON válido')
        }
      } else {
        throw new Error('Resposta não contém JSON válido')
      }
    }

    // Se a resposta vier dentro de um array (formato do N8N)
    if (Array.isArray(responseData) && responseData.length > 0) {
      responseData = responseData[0]
    }

    // Se a resposta tiver um campo 'output' ou similar
    if (responseData && responseData.output) {
      responseData = responseData.output
    }

    // Se a resposta for uma string JSON, tentar parsear novamente
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData)
      } catch (e) {
        console.error('Erro ao parsear string JSON:', e)
        throw new Error('Resposta é uma string JSON inválida')
      }
    }

    console.log('Resposta parseada:', JSON.stringify(responseData, null, 2))

    // Validar estrutura da resposta
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Resposta inválida: não é um objeto')
    }

    // Se status for ok, retornar a resposta completa
    // O novo formato pode ter reasonBlocked mesmo com status ok (informação, não erro)
    if (responseData.status === 'ok') {
      // Retornar resposta completa mesmo se tiver reasonBlocked (é informação, não erro)
      // O frontend vai tratar reasonBlocked como mensagem informativa
      return res.json(responseData)
    }

    // Se tiver reasonBlocked mas status não for ok, retornar como erro
    if (responseData.reasonBlocked && responseData.status !== 'ok') {
      return res.status(400).json({
        error: 'Troca bloqueada',
        reason: responseData.reasonBlocked,
        details: responseData
      })
    }

    // Se chegou aqui, a resposta não está no formato esperado
    console.error('Resposta não tem formato esperado:', responseData)
    throw new Error('Resposta inválida do servidor: formato não reconhecido')

  } catch (error) {
    console.error('Erro ao trocar alimento:', error)
    res.status(500).json({
      error: 'Erro ao trocar alimento',
      details: error.message
    })
  }
})

export default router


