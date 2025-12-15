/**
 * Script de teste para verificar conectividade com o webhook N8N
 * Execute: node test-n8n-webhook.js
 */

// Atualize esta URL se necessário
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.identikdigital.com.br/webhook-test/chat-dietyourself'

async function testWebhook() {
  console.log('🧪 Testando webhook N8N...\n')
  console.log(`URL: ${N8N_WEBHOOK_URL}\n`)

  const payload = {
    message: {
      chat: {
        id: 'test-user-id-123'
      },
      text: 'Teste de conectividade'
    }
  }

  console.log('📤 Payload enviado:')
  console.log(JSON.stringify(payload, null, 2))
  console.log('\n')

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log(`📥 Resposta recebida:`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log(`   Body: ${responseText}`)

    if (response.ok) {
      console.log('\n✅ Webhook está funcionando!')
      try {
        const json = JSON.parse(responseText)
        console.log('   Resposta JSON:', JSON.stringify(json, null, 2))
      } catch (e) {
        console.log('   Resposta não é JSON válido')
      }
    } else {
      console.log(`\n❌ Erro ${response.status}`)
      if (response.status === 502) {
        console.log('   Possíveis causas:')
        console.log('   - Workflow não está ativo no N8N')
        console.log('   - Webhook não existe ou URL incorreta')
        console.log('   - Servidor N8N indisponível')
      }
    }
  } catch (error) {
    console.error('\n❌ Erro ao conectar:')
    console.error(`   ${error.message}`)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('\n   Verifique:')
      console.error('   - Se a URL está correta')
      console.error('   - Se há conexão com a internet')
      console.error('   - Se o servidor N8N está acessível')
    }
  }
}

testWebhook()

