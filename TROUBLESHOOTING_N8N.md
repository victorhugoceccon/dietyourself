# 🔧 Troubleshooting - Erro 502 no N8N

## Problema: Erro 502 Bad Gateway

O erro 502 indica que o webhook está acessível, mas o workflow do N8N está retornando erro.

## ✅ Checklist de Verificação

### 1. Verificar se o Workflow está Ativo
- No N8N, certifique-se de que o botão **"Active"** está ligado (vermelho)
- O workflow precisa estar ativo para processar webhooks

### 2. Verificar o Nó "Respond to Webhook"
O workflow **DEVE** ter um nó "Respond to Webhook" configurado:

```
[Webhook] → [Processamento] → [Respond to Webhook]
```

**Configuração do "Respond to Webhook":**
- **Response Code**: `200` (ou outro código de sucesso)
- **Response Body**: 
  ```json
  {
    "response": "{{ $json.choices[0].message.content }}"
  }
  ```
  Ou o formato que seu workflow retorna

### 3. Verificar o Formato do Payload

O payload enviado é:
```json
{
  "message": {
    "chat": {
      "id": "userId"
    },
    "text": "mensagem do usuário"
  }
}
```

No N8N, você pode acessar:
- `{{ $json.message.chat.id }}` - ID do usuário
- `{{ $json.message.text }}` - Texto da mensagem

### 4. Verificar Logs do Workflow

No N8N:
1. Vá para o workflow
2. Clique em "Executions" (Execuções)
3. Veja as execuções recentes
4. Verifique se há erros nos nós

### 5. Testar o Workflow Manualmente

No N8N:
1. Clique no nó Webhook
2. Clique em "Listen for test event"
3. Use a URL de teste que aparece
4. Envie um POST com:
   ```json
   {
     "message": {
       "chat": { "id": "test" },
       "text": "teste"
     }
   }
   ```
5. Veja se o workflow processa corretamente

## 🔍 Possíveis Causas do Erro 502

### Causa 1: Workflow sem "Respond to Webhook"
**Solução:** Adicione um nó "Respond to Webhook" no final do workflow

### Causa 2: Erro no Processamento
**Solução:** Verifique os logs do workflow e corrija os erros

### Causa 3: Timeout
**Solução:** O workflow pode estar demorando muito. Verifique se há loops infinitos ou processamentos pesados

### Causa 4: Formato de Resposta Incorreto
**Solução:** Certifique-se de que o "Respond to Webhook" retorna um JSON válido

## 📝 Exemplo de Workflow Correto

```
1. [Webhook]
   - HTTP Method: POST
   - Path: /chat-dietyourself
   - Authentication: None
   - Respond: Using 'Respond to Webhook' Node

2. [OpenAI] ou [ChatGPT]
   - System Message: "Você é um assistente nutricional..."
   - User Message: {{ $json.message.text }}

3. [Respond to Webhook]
   - Response Code: 200
   - Response Body:
     {
       "response": "{{ $json.choices[0].message.content }}"
     }
```

## 🧪 Testar Conectividade

Execute o script de teste:
```bash
node test-n8n-webhook.js
```

Ou acesse:
```
http://localhost:5000/api/chat/status
```

## 📞 Próximos Passos

1. Verifique se o workflow tem "Respond to Webhook"
2. Teste o workflow manualmente no N8N
3. Verifique os logs de execução
4. Se ainda não funcionar, compartilhe os logs do workflow


