/**
 * Script para testar o webhook diretamente
 * Execute: node test-webhook-direct.js
 */

// Teste com IP direto (sem Cloudflare)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://69.6.215.140:8080/webhook-test/chat-dietyourself'

async function testWebhook() {
  console.log('🧪 Testando webhook N8N diretamente...\n')
  console.log(`URL: ${N8N_WEBHOOK_URL}\n`)

  const payload = {
    message: {
      chat: {
        id: 'test-user-id-123'
      },
      text: 'Teste de conectividade - mensagem de teste'
    }
  }

  console.log('📤 Payload que será enviado:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('\n')

  try {
    console.log('🔄 Enviando requisição POST...')
    const startTime = Date.now()
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DietYourself-Test/1.0'
      },
      body: JSON.stringify(payload)
    })

    const duration = Date.now() - startTime
    console.log(`⏱️  Tempo de resposta: ${duration}ms\n`)

    console.log('📥 Resposta recebida:')
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Status Text: ${response.statusText}`)
    console.log(`   Headers:`)
    response.headers.forEach((value, key) => {
      console.log(`      ${key}: ${value}`)
    })

    const responseText = await response.text()
    console.log(`\n   Body (primeiros 500 caracteres):`)
    console.log(`   ${responseText.substring(0, 500)}`)

    if (response.ok) {
      console.log('\n✅ Webhook respondeu com sucesso!')
      try {
        const json = JSON.parse(responseText)
        console.log('\n   Resposta JSON formatada:')
        console.log(JSON.stringify(json, null, 2))
      } catch (e) {
        console.log('\n   ⚠️  Resposta não é JSON válido')
      }
    } else {
      console.log(`\n❌ Erro ${response.status}`)
      if (response.status === 502) {
        console.log('\n   Possíveis causas:')
        console.log('   - Workflow não está ativo')
        console.log('   - Workflow não tem "Respond to Webhook"')
        console.log('   - Erro no processamento do workflow')
        console.log('   - Webhook não recebeu os dados corretamente')
      }
    }
  } catch (error) {
    console.error('\n❌ Erro ao conectar:')
    console.error(`   Tipo: ${error.name}`)
    console.error(`   Mensagem: ${error.message}`)
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`)
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('\n   Verifique:')
      console.error('   - Se a URL está correta')
      console.error('   - Se há conexão com a internet')
      console.error('   - Se o servidor N8N está acessível')
      console.error('   - Se há problemas de CORS ou firewall')
    }
  }
}

testWebhook()

