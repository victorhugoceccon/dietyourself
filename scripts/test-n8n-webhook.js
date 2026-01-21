/**
 * Script para testar o webhook do N8N com multipart/form-data
 * 
 * Uso: node scripts/test-n8n-webhook.js
 * 
 * Requer: npm install form-data
 */

import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// URL do webhook do N8N
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''
const N8N_GET_EXERCISES_URL = N8N_WEBHOOK_URL.replace(/\/webhook-test\//g, '/webhook/').replace(/\/webhook\/[^/]+$/, '/webhook/getExercises')

if (!N8N_WEBHOOK_URL) {
  console.error('❌ N8N_WEBHOOK_URL não está configurado no .env')
  process.exit(1)
}

console.log('🧪 Testando webhook do N8N com multipart/form-data')
console.log('📡 URL:', N8N_GET_EXERCISES_URL)
console.log('')

// Criar FormData
const formData = new FormData()

// Dados do questionário (simulando dados reais)
const questionnaireData = {
  userId: 'test-user-123',
  userName: 'Usuário Teste',
  idade: 30,
  sexo: 'Masculino',
  altura: 175,
  pesoAtual: 80,
  objetivo: 'Ganhar massa muscular',
  frequenciaAtividade: '3-4x',
  tipoAtividade: 'Musculação',
  horarioTreino: 'Tarde',
  rotinaDiaria: 'Trabalho das 9h às 18h',
  derived: {
    treinaAtualmente: true,
    temLimitacaoFisica: false,
    temRestricaoMedicaExercicio: false
  },
  confortoPesar: 'Sim',
  tempoPreparacao: 'Tenho tempo',
  limitacoesFisicas: 'Não',
  detalhesLimitacao: null,
  restricoesMedicasExercicio: 'Não',
  movimentosEvitar: null,
  relacaoEmocionalTreino: 'Gosto',
  preferenciaDificuldadeTreino: 'Intermediário',
  barreirasTreino: null
}

// Adicionar dados do questionário como JSON string
formData.append('questionnaireData', JSON.stringify(questionnaireData))
console.log('✅ Dados do questionário adicionados ao FormData')

// Criar imagens de teste (pequenas imagens base64 para teste)
// Vou criar arquivos temporários com dados mínimos de imagem
const createTestImage = (filename) => {
  // Imagem PNG mínima (1x1 pixel transparente) em base64
  const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(minimalPngBase64, 'base64')
  
  const tempPath = path.join(__dirname, '..', 'temp', filename)
  const tempDir = path.dirname(tempPath)
  
  // Criar diretório temp se não existir
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  
  fs.writeFileSync(tempPath, buffer)
  return tempPath
}

try {
  // Criar imagens de teste
  const fotoFrentePath = createTestImage('test-frente.png')
  const fotoCostasPath = createTestImage('test-costas.png')
  
  console.log('✅ Imagens de teste criadas')
  
  // Adicionar imagens como arquivos
  formData.append('fotoFrente', fs.createReadStream(fotoFrentePath), {
    filename: 'frente.png',
    contentType: 'image/png'
  })
  
  formData.append('fotoCostas', fs.createReadStream(fotoCostasPath), {
    filename: 'costas.png',
    contentType: 'image/png'
  })
  
  console.log('✅ Imagens adicionadas ao FormData')
  console.log('')
  
  // Headers
  const headers = {
    ...formData.getHeaders()
  }
  
  // Adicionar API key se configurada
  if (process.env.N8N_API_KEY && !process.env.N8N_API_KEY.startsWith('http')) {
    headers['X-N8N-API-KEY'] = process.env.N8N_API_KEY
    console.log('🔑 API Key adicionada ao header')
  }
  
  console.log('📤 Enviando requisição...')
  console.log('   Content-Type:', headers['content-type'])
  console.log('')
  
  // Fazer requisição
  const response = await fetch(N8N_GET_EXERCISES_URL, {
    method: 'POST',
    headers,
    body: formData
  })
  
  console.log('📥 Resposta recebida:')
  console.log('   Status:', response.status, response.statusText)
  console.log('   Headers:', Object.fromEntries(response.headers.entries()))
  console.log('')
  
  // Tentar ler a resposta
  const responseText = await response.text()
  console.log('📄 Corpo da resposta:')
  try {
    const responseJson = JSON.parse(responseText)
    console.log(JSON.stringify(responseJson, null, 2))
  } catch {
    console.log(responseText.substring(0, 500))
    if (responseText.length > 500) {
      console.log('... (resposta truncada)')
    }
  }
  
  // Limpar arquivos temporários
  fs.unlinkSync(fotoFrentePath)
  fs.unlinkSync(fotoCostasPath)
  console.log('')
  console.log('✅ Teste concluído!')
  
} catch (error) {
  console.error('❌ Erro ao testar webhook:', error.message)
  console.error('   Stack:', error.stack)
  process.exit(1)
}
