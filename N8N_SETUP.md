# 🤖 Configuração do Chat com N8N

Este guia explica como configurar o chat para se conectar com um agente ChatGPT no N8N via webhook.

## 📋 Pré-requisitos

1. **N8N instalado e rodando** (cloud ou self-hosted)
2. **Workflow no N8N** configurado com ChatGPT
3. **Webhook** criado no N8N para receber mensagens

## 🔧 Passo 1: Criar Workflow no N8N

### 1.1. Criar Webhook

1. No N8N, crie um novo workflow
2. Adicione o nó **"Webhook"**
3. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `/chat` (ou qualquer path desejado)
   - **Response Mode**: `Using 'Respond to Webhook' Node`
   - Clique em **"Listen for Test Event"** e copie a URL do webhook

### 1.2. Adicionar Nó de Processamento (Opcional)

Se precisar processar os dados antes de enviar ao ChatGPT:
- Adicione um nó **"Function"** ou **"Code"** para extrair a mensagem

### 1.3. Conectar com ChatGPT

1. Adicione o nó **"OpenAI"** ou **"ChatGPT"**
2. Configure:
   - **Model**: `gpt-4` ou `gpt-3.5-turbo`
   - **Messages**: Configure as mensagens (system, user, etc.)
   - Use `{{ $json.message }}` para passar a mensagem do usuário

### 1.4. Adicionar Resposta

1. Adicione o nó **"Respond to Webhook"**
2. Configure a resposta:
   ```json
   {
     "response": "{{ $json.choices[0].message.content }}"
   }
   ```

### 1.5. Ativar Workflow

1. Clique em **"Active"** no canto superior direito
2. Copie a URL do webhook (exemplo: `https://seu-n8n.com/webhook/chat`)

## 🔐 Passo 2: Configurar Variáveis de Ambiente

No arquivo `.env` da aplicação:

```env
# URL do webhook do N8N
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/chat

# API Key do N8N (se necessário para autenticação)
N8N_API_KEY=sua_chave_api_aqui
```

## 📤 Passo 3: Formato do Payload Enviado

A aplicação envia o seguinte formato para o N8N:

```json
{
  "message": {
    "chat": {
      "id": "uuid-do-usuario"
    },
    "text": "Texto da mensagem do usuário"
  }
}
```

**No N8N, você pode acessar:**
- `{{ $json.message.chat.id }}` - ID do usuário/chat
- `{{ $json.message.text }}` - Texto da mensagem

## 📥 Passo 4: Formato de Resposta Esperado

O N8N deve retornar uma das seguintes estruturas:

**Opção 1 (Recomendada):**
```json
{
  "response": "Resposta do ChatGPT aqui"
}
```

**Opção 2:**
```json
{
  "data": {
    "response": "Resposta do ChatGPT aqui"
  }
}
```

**Opção 3:**
```json
{
  "body": {
    "response": "Resposta do ChatGPT aqui"
  }
}
```

**Opção 4 (String direta):**
```
"Resposta do ChatGPT aqui"
```

O código backend (`server/routes/chat.js`) tenta automaticamente detectar o formato correto.

## 🎨 Exemplo Completo de Workflow N8N

```
[Webhook] → [Function/Code] → [OpenAI/ChatGPT] → [Respond to Webhook]
```

### Webhook Node:
```javascript
// Recebe: { message: { chat: { id }, text } }
// Passa adiante sem modificação
```

### Function/Code Node (Opcional):
```javascript
// Extrai a mensagem para enviar ao ChatGPT
// Usando o formato esperado: message.chat.id e message.text
return {
  json: {
    message: {
      chat: {
        id: $input.item.json.message.chat.id
      },
      text: $input.item.json.message.text
    }
  }
}
```

### OpenAI Node:
```javascript
// System Message
Você é um assistente nutricional especializado em ajudar pacientes com suas dietas.

// User Message
{{ $json.message.text }}
```

**Ou diretamente do webhook:**
```javascript
// User Message
{{ $input.item.json.message.text }}
```

**Exemplo completo de workflow:**

1. **Webhook Node** (recebe o payload)
   - O payload já vem no formato: `{ message: { chat: { id }, text } }`

2. **OpenAI Node** ou **ChatGPT Node**
   - **Model**: `gpt-4` ou `gpt-3.5-turbo`
   - **System Message**: 
     ```
     Você é um assistente nutricional do DietYourself. 
     Ajude pacientes com dúvidas sobre dietas, nutrição e saúde.
     Seja sempre amigável e profissional.
     ```
   - **User Message**: `{{ $json.message.text }}`
   - **User ID** (opcional, para contexto): `{{ $json.message.chat.id }}`

3. **Respond to Webhook Node**
   ```json
   {
     "response": "{{ $json.choices[0].message.content }}"
   }
   ```

### Respond to Webhook Node:
```javascript
{
  "response": "{{ $json.choices[0].message.content }}"
}
```

## 🔒 Autenticação (Opcional)

Se seu N8N requer autenticação, você pode:

### Opção A: API Key no Header

No N8N, configure autenticação via header:
- Header: `X-N8N-API-KEY`
- Valor: sua API key

No `.env`:
```env
N8N_API_KEY=sua_chave_aqui
```

### Opção B: Bearer Token

Modifique `server/routes/chat.js` para usar Bearer token:
```javascript
if (N8N_API_KEY) {
  headers['Authorization'] = `Bearer ${N8N_API_KEY}`
}
```

### Opção C: Basic Auth

```javascript
if (N8N_API_KEY) {
  const auth = Buffer.from(`user:${N8N_API_KEY}`).toString('base64')
  headers['Authorization'] = `Basic ${auth}`
}
```

## 🧪 Testar Conexão

1. Inicie o servidor da aplicação
2. Acesse a tela do paciente
3. Clique no ícone de chat (canto inferior direito)
4. Envie uma mensagem de teste
5. Verifique os logs do servidor para debug:
   ```bash
   pm2 logs dietyourself-backend
   ```

## 🐛 Troubleshooting

### Erro: "N8N_WEBHOOK_URL não configurado"
- Verifique se o `.env` tem a variável `N8N_WEBHOOK_URL`
- Reinicie o servidor após modificar o `.env`

### Erro: "Erro ao comunicar com o serviço de chat: 404"
- Verifique se a URL do webhook está correta
- Certifique-se de que o workflow está **ativo** no N8N

### Erro: "Erro ao comunicar com o serviço de chat: 401"
- Configure autenticação corretamente
- Verifique se a API key está correta

### Resposta vazia ou formatada incorretamente
- Verifique o formato de resposta do N8N
- O código tenta vários formatos, mas você pode ajustar em `server/routes/chat.js`

### Timeout
- Aumente o timeout no código se necessário
- Verifique se o N8N está processando rápido o suficiente

## 📚 Recursos Adicionais

- [Documentação N8N](https://docs.n8n.io/)
- [N8N Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [OpenAI Node no N8N](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/)

