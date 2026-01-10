# 🚇 Guia de Instalação e Uso do ngrok

## ✅ Instalação Completa

O ngrok já foi instalado via npm! Agora você precisa:

### 1. Criar Conta no ngrok (Gratuita)

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta gratuita (pode usar Google/GitHub)
3. Faça login

### 2. Obter Token de Autenticação

1. Após login, acesse: https://dashboard.ngrok.com/get-started/your-authtoken
2. **Copie seu token** (algo como: `2abc123def456ghi789jkl012mno345pqr678stu`)

### 3. Autenticar o ngrok

Execute no terminal:

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

Substitua `SEU_TOKEN_AQUI` pelo token que você copiou.

### 4. Iniciar o Servidor Node.js (PRIMEIRO!)

**⚠️ IMPORTANTE**: O servidor deve estar rodando ANTES de iniciar o ngrok!

Em um terminal, inicie o servidor:

```bash
npm run dev:server
```

Aguarde ver a mensagem: `Server running on port 5000` ou similar.

### 5. Iniciar o Túnel ngrok (SEGUNDO!)

Em **OUTRO terminal**, inicie o ngrok:

```bash
ngrok http 5000
```

Você verá algo como:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

**Copie a URL HTTPS** (ex: `https://abc123.ngrok-free.app`)

### 6. Configurar Webhook no AbacatePay

1. Acesse o Dashboard do AbacatePay
2. Vá em **Webhooks** ou **Notificações**
3. Adicione um novo webhook:
   - **URL**: `https://abc123.ngrok-free.app/api/billing/abacatepay-webhook`
   - (Use a URL HTTPS que o ngrok forneceu)
4. Selecione os eventos:
   - `billing.paid`
   - `billing.completed`
   - `billing.cancelled`
5. Salve

## 🎯 Uso Rápido

### ⚠️ IMPORTANTE: Inicie o servidor ANTES do ngrok!

1. **Primeiro, inicie o servidor Node.js** (em um terminal):
   ```bash
   npm run dev:server
   ```
   Ou se quiser rodar servidor + frontend juntos:
   ```bash
   npm run dev
   ```

2. **Aguarde o servidor iniciar** (você verá algo como "Server running on port 5000")

3. **Depois, em OUTRO terminal, inicie o ngrok**:
   ```bash
   ngrok http 5000
   ```

### Parar ngrok

Pressione `Ctrl + C` no terminal onde o ngrok está rodando.

## 📝 Script Helper

Criei um script helper para facilitar. Para usar:

```bash
# Windows PowerShell
.\scripts\start-ngrok.ps1

# Ou manualmente:
ngrok http 5000
```

## ⚠️ Importante

1. **A URL do ngrok muda a cada vez que você reinicia** (na versão gratuita)
2. **Atualize o webhook no AbacatePay** sempre que reiniciar o ngrok
3. **Mantenha o ngrok rodando** enquanto testar o webhook
4. **Use HTTPS** (não HTTP) na URL do webhook

## 🔍 Verificar se está funcionando

1. Inicie o ngrok: `ngrok http 5000`
2. Acesse: http://localhost:4040 (interface web do ngrok)
3. Você verá todas as requisições passando pelo túnel

## 🐛 Troubleshooting

### Erro: "authtoken is required"
- Execute: `ngrok config add-authtoken SEU_TOKEN`

### Erro: "port already in use"
- Verifique se outra instância do ngrok está rodando
- Use uma porta diferente: `ngrok http 5001`

### Erro: ERR_NGROK_8012 - "target machine actively refused it"
- **O servidor Node.js não está rodando!**
- Inicie o servidor primeiro: `npm run dev:server`
- Aguarde o servidor iniciar completamente
- Só então inicie o ngrok: `ngrok http 5000`

### Webhook não recebe eventos
- Verifique se a URL do webhook está correta (HTTPS)
- Confirme que o ngrok está rodando
- Verifique os logs do servidor Node.js

## 📚 Links Úteis

- [Dashboard ngrok](https://dashboard.ngrok.com)
- [Documentação ngrok](https://ngrok.com/docs)
- [Interface Web ngrok](http://localhost:4040) (quando rodando)
