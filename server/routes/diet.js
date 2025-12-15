import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { calcularNutricao } from '../utils/nutrition.js'
import { ajustarDietaCompleta, ajustarDietaParaNecessidades, calcularTotaisDieta } from '../utils/dietAdjuster.js'

const router = express.Router()

// Função auxiliar para normalizar URLs de webhook (substitui webhook-test por webhook)
const normalizeWebhookUrl = (url) => {
  if (!url) return ''
  // Substituir webhook-test por webhook na URL
  return url.replace(/\/webhook-test\//g, '/webhook/')
}

// Função para extrair URL base do N8N_WEBHOOK_URL e construir getDiet URL
const getDietUrl = () => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL || ''
  if (!webhookUrl) return ''
  
  const normalized = normalizeWebhookUrl(webhookUrl)
  // Extrair a base URL (antes de /webhook/...)
  const baseMatch = normalized.match(/^(https?:\/\/[^\/]+)/)
  if (!baseMatch) return ''
  
  const baseUrl = baseMatch[1]
  return `${baseUrl}/webhook/getDiet`
}

const N8N_GET_DIET_URL = getDietUrl()
const N8N_API_KEY = process.env.N8N_API_KEY || ''

// Rota para gerar dieta
router.post('/generate', authenticate, async (req, res) => {
  // Variável para armazenar as necessidades nutricionais calculadas (para validação posterior)
  let nutricaoCalculadaBackup = null
  
  try {
    // Verificar se N8N está configurado
    if (!N8N_GET_DIET_URL) {
      return res.status(500).json({ 
        error: 'Serviço de geração de dieta não configurado',
        details: 'Configure N8N_WEBHOOK_URL no arquivo .env'
      })
    }

    const userId = req.user.userId
    console.log('Gerando dieta para userId:', userId)

    // Buscar dados do questionário
    const questionnaireData = await prisma.questionnaireData.findUnique({
      where: { userId }
    })

    if (!questionnaireData) {
      return res.status(400).json({ error: 'Complete o questionário antes de gerar a dieta' })
    }

    console.log('📋 Dados do questionário encontrados')

    // Parse das restrições
    let restricoesArray = []
    if (questionnaireData.restricoes) {
      try {
        restricoesArray = JSON.parse(questionnaireData.restricoes)
      } catch (e) {
        console.error('Erro ao fazer parse das restrições:', e)
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
      nivelAtividade: questionnaireData.nivelAtividade
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

    // Preparar contexto do questionário para N8N
    const questionnaireContext = {
      idade: questionnaireData.idade,
      sexo: questionnaireData.sexo,
      altura: questionnaireData.altura,
      pesoAtual: questionnaireData.pesoAtual,
      objetivo: questionnaireData.objetivo,
      nivelAtividade: questionnaireData.nivelAtividade,
      refeicoesDia: questionnaireData.refeicoesDia,
      restricoes: restricoesArray,
      alimentosNaoGosta: questionnaireData.alimentosNaoGosta || '',
      preferenciaAlimentacao: questionnaireData.preferenciaAlimentacao,
      costumaCozinhar: questionnaireData.costumaCozinhar,
      observacoes: questionnaireData.observacoes || ''
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
        instrucao: `IMPORTANTE: Você DEVE criar uma dieta que resulte em EXATAMENTE ${nutricaoCalculadaBackup.calorias} kcal por dia, com ${nutricaoCalculadaBackup.macros.proteina}g de proteína, ${nutricaoCalculadaBackup.macros.carboidrato}g de carboidrato e ${nutricaoCalculadaBackup.macros.gordura}g de gordura. O totalDiaKcal e macrosDia no JSON de resposta DEVEM corresponder a estes valores. Crie ${questionnaireData.refeicoesDia || 5} refeições por dia conforme solicitado.`
      } : null
    }
    
    console.log('📤 Payload preparado para N8N com necessidades nutricionais calculadas')
    if (nutricaoCalculadaBackup) {
      console.log('📋 Instrução enviada ao agente:')
      console.log(`   - Total de calorias: ${nutricaoCalculadaBackup.calorias} kcal`)
      console.log(`   - Proteína: ${nutricaoCalculadaBackup.macros.proteina}g`)
      console.log(`   - Carboidrato: ${nutricaoCalculadaBackup.macros.carboidrato}g`)
      console.log(`   - Gordura: ${nutricaoCalculadaBackup.macros.gordura}g`)
      console.log(`   - Refeições por dia: ${questionnaireData.refeicoesDia || 5}`)
    }

    // Headers para N8N
    const headers = {
      'Content-Type': 'application/json'
    }

    if (N8N_API_KEY && !N8N_API_KEY.startsWith('http')) {
      headers['X-N8N-API-KEY'] = N8N_API_KEY
    }

    console.log('📤 Enviando requisição para N8N:', N8N_GET_DIET_URL)

    // Fazer requisição para N8N
    let response
    try {
      // Timeout aumentado para 600 segundos (10 minutos) - geração de dieta pode demorar muito
      // O timeout pode ser configurado via N8N_TIMEOUT no .env (em milissegundos)
      const timeoutMs = parseInt(process.env.N8N_TIMEOUT) || 600000 // 10 minutos padrão
      console.log(`⏱️  Timeout configurado: ${timeoutMs / 1000} segundos (${timeoutMs / 60000} minutos)`)
      
      response = await fetch(N8N_GET_DIET_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs) // Timeout configurável
      })
    } catch (fetchError) {
      console.error('❌ Erro ao fazer fetch:', fetchError)
      
      // Verificar se é um erro de timeout
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        const timeoutMinutes = (parseInt(process.env.N8N_TIMEOUT) || 600000) / 60000
        throw new Error(`Tempo limite de ${timeoutMinutes} minutos excedido. A geração da dieta está demorando mais que o esperado. Tente novamente ou otimize o prompt do agente N8N (veja PROMPT_OTIMIZADO_N8N.md).`)
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
        
        // Tentar encontrar JSON na string
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
          console.log('✅ JSON extraído e parseado com sucesso')
        } else {
          // Tentar parsear a string inteira após limpeza
          try {
            responseData = JSON.parse(cleanedText)
            console.log('✅ JSON parseado após limpeza')
          } catch (e3) {
            console.error('❌ Erro ao parsear após limpeza:', e3.message)
            throw new Error('Resposta do N8N não contém JSON válido')
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
        // Tentar extrair JSON da string
        const jsonMatch = responseData.dieta.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            let matchedJson = jsonMatch[0]
            // Remover caracteres de escape do JSON extraído
            if (matchedJson.includes('\\n')) {
              matchedJson = matchedJson.replace(/\\n/g, '\n').replace(/\\"/g, '"')
            }
            responseData.dieta = JSON.parse(matchedJson)
            console.log('✅ JSON extraído de dieta string')
            console.log('   Tipo após extração:', typeof responseData.dieta)
            console.log('   Chaves após extração:', Object.keys(responseData.dieta))
          } catch (e2) {
            console.error('❌ Erro ao extrair JSON de dieta:', e2.message)
            console.error('   JSON extraído (primeiros 500 chars):', jsonMatch[0].substring(0, 500))
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
      throw new Error('Resposta inválida: falta objeto "dieta"')
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
    
    // VALIDAÇÃO FINAL: Garantir que os valores retornados estão corretos
    // Se o agente retornou valores muito diferentes dos calculados, corrigir
    if (nutricaoCalculadaBackup && dietaJson && typeof dietaJson === 'object') {
      // Corrigir totalDiaKcal se necessário
      if (dietaJson.totalDiaKcal && Math.abs(dietaJson.totalDiaKcal - nutricaoCalculadaBackup.calorias) > (nutricaoCalculadaBackup.calorias * 0.05)) {
        console.warn(`⚠️  Corrigindo totalDiaKcal: ${dietaJson.totalDiaKcal} → ${nutricaoCalculadaBackup.calorias}`)
        dietaJson.totalDiaKcal = nutricaoCalculadaBackup.calorias
      }
      
      // Corrigir macrosDia se necessário
      if (dietaJson.macrosDia && typeof dietaJson.macrosDia === 'object') {
        const macrosCalculados = nutricaoCalculadaBackup.macros
        const macrosRetornados = dietaJson.macrosDia
        
        if (Math.abs((macrosRetornados.proteina_g || 0) - macrosCalculados.proteina) > (macrosCalculados.proteina * 0.1)) {
          console.warn(`⚠️  Corrigindo proteina_g: ${macrosRetornados.proteina_g} → ${macrosCalculados.proteina}`)
          dietaJson.macrosDia.proteina_g = macrosCalculados.proteina
        }
        if (Math.abs((macrosRetornados.carbo_g || 0) - macrosCalculados.carboidrato) > (macrosCalculados.carboidrato * 0.1)) {
          console.warn(`⚠️  Corrigindo carbo_g: ${macrosRetornados.carbo_g} → ${macrosCalculados.carboidrato}`)
          dietaJson.macrosDia.carbo_g = macrosCalculados.carboidrato
        }
        if (Math.abs((macrosRetornados.gordura_g || 0) - macrosCalculados.gordura) > (macrosCalculados.gordura * 0.1)) {
          console.warn(`⚠️  Corrigindo gordura_g: ${macrosRetornados.gordura_g} → ${macrosCalculados.gordura}`)
          dietaJson.macrosDia.gordura_g = macrosCalculados.gordura
        }
      }
    }

    // Normalizar estrutura do nutritionalNeeds para o formato esperado pelo frontend
    // Se vier com proteina, carboidrato, gordura diretamente, criar objeto macros
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
    
    // Garantir que nutritionalNeeds tem estrutura completa
    if (nutritionalNeeds) {
      // Se não tiver calorias, tentar calcular a partir dos macros ou usar 0
      if (!nutritionalNeeds.calorias && nutritionalNeeds.macros) {
        // Calorias aproximadas: proteína e carboidrato = 4 kcal/g, gordura = 9 kcal/g
        const macros = nutritionalNeeds.macros
        const proteinaKcal = (macros.proteina || 0) * 4
        const carboKcal = (macros.carboidrato || 0) * 4
        const gorduraKcal = (macros.gordura || 0) * 9
        nutritionalNeeds.calorias = proteinaKcal + carboKcal + gorduraKcal
        console.log('📊 Calorias calculadas a partir dos macros:', nutritionalNeeds.calorias)
      }
      
      // Garantir que tem macros
      if (!nutritionalNeeds.macros) {
        console.warn('⚠️  nutritionalNeeds não tem macros, criando estrutura padrão...')
        nutritionalNeeds.macros = {
          proteina: nutritionalNeeds.proteina || 0,
          carboidrato: nutritionalNeeds.carboidrato || 0,
          gordura: nutritionalNeeds.gordura || 0
        }
      }
      
      // Garantir que tem calorias (mínimo 0)
      if (!nutritionalNeeds.calorias) {
        nutritionalNeeds.calorias = 0
      }
    }

    // AJUSTAR DIETA AUTOMATICAMENTE DE FORMA COMPLETA
    // Se tivermos as necessidades nutricionais calculadas e a dieta, fazer ajuste completo:
    // 1. Ajustar valores totais para corresponder às necessidades
    // 2. Equilibrar distribuição de macros entre refeições (25% cada, até 35% para almoço/jantar)
    // 3. Garantir pelo menos 2 frutas no dia
    // 4. Garantir vegetais/saladas em todas as refeições
    if (nutricaoCalculadaBackup && dietaJson && typeof dietaJson === 'object' && dietaJson.refeicoes) {
      console.log('🔧 Ajustando dieta automaticamente de forma completa...')
      
      const necessidadesParaAjuste = {
        calorias: nutricaoCalculadaBackup.calorias,
        macros: {
          proteina: nutricaoCalculadaBackup.macros.proteina,
          carboidrato: nutricaoCalculadaBackup.macros.carboidrato,
          gordura: nutricaoCalculadaBackup.macros.gordura
        }
      }
      
      // Ajustar completamente a dieta (valores totais + equilíbrio + frutas/vegetais)
      dietaJson = ajustarDietaCompleta(dietaJson, necessidadesParaAjuste)
      
      // Atualizar nutritionalNeeds com os valores ajustados (que agora devem bater)
      nutritionalNeeds = {
        calorias: nutricaoCalculadaBackup.calorias,
        macros: {
          proteina: nutricaoCalculadaBackup.macros.proteina,
          carboidrato: nutricaoCalculadaBackup.macros.carboidrato,
          gordura: nutricaoCalculadaBackup.macros.gordura
        }
      }
      
      console.log('✅ Dieta ajustada completamente: valores totais, equilíbrio entre refeições, frutas e vegetais garantidos')
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
      
      return res.json({
        nutritionalNeeds: nutritionalNeeds,
        dieta: dietaData.dieta
      })
    }

    // Caso contrário, retornar estrutura antiga
    res.json({ dieta: dietaData, nutritionalNeeds: null })

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

    // Preparar payload para N8N
    const payload = {
      swapRequest: {
        mealName: refeicao.nome,
        originalItem: originalItem,
        currentMealItems: currentMealItems,
        userDesiredFood: userDesiredFood.trim()
      },
      userContext: {
        questionnaire: questionnaireContext
      }
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

    // Se tiver reasonBlocked, retornar como erro
    if (responseData.reasonBlocked) {
      return res.status(400).json({
        error: 'Troca bloqueada',
        reason: responseData.reasonBlocked,
        details: responseData
      })
    }

    // Se status for ok, retornar mesmo sem bestMatch (pode ter apenas suggestions)
    if (responseData.status === 'ok') {
      // Se não tiver bestMatch mas tiver suggestions e notes, é válido
      if (!responseData.bestMatch && responseData.suggestions && responseData.suggestions.length > 0) {
        console.log('Resposta válida sem bestMatch, mas com suggestions e notes')
        return res.json(responseData)
      }
      
      // Se tiver bestMatch, retornar normalmente
      if (responseData.bestMatch) {
        return res.json(responseData)
      }
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


