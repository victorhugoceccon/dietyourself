# 🥑 Configuração do AbacatePay

## 📋 Pré-requisitos

1. Conta no AbacatePay (https://www.abacatepay.com)
2. Acesso ao Dashboard do AbacatePay
3. Chave de API gerada

## 🚀 Passo a Passo

### 1. Criar Conta no AbacatePay

1. Acesse: https://www.abacatepay.com
2. Clique em **Criar conta** ou **Cadastrar**
3. Preencha os dados necessários
4. Complete a verificação da conta

### 2. Obter Chave de API

1. Acesse o Dashboard do AbacatePay
2. Vá em **Integração** ou **API**
3. Gere uma nova chave de API
4. **Copie a chave** (ela só será mostrada uma vez!)

### 3. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# AbacatePay - Chave da API
ABACATEPAY_API_KEY=sua_chave_api_aqui

# Frontend - Habilitar AbacatePay
VITE_ABACATEPAY_ENABLED=true

# Frontend URL (para webhooks e redirects)
FRONTEND_URL=http://localhost:5173  # Em dev
# FRONTEND_URL=https://seu-dominio.com  # Em produção
```

### 4. Configurar Webhook

#### Para Desenvolvimento Local (usando ngrok):

1. **Instalar e configurar ngrok** (veja `NGROK_SETUP.md` para detalhes):
   ```bash
   # 1. Criar conta em https://dashboard.ngrok.com/signup
   # 2. Obter token em https://dashboard.ngrok.com/get-started/your-authtoken
   # 3. Autenticar:
   ngrok config add-authtoken SEU_TOKEN
   
   # 4. Iniciar túnel:
   ngrok http 5000
   ```

2. **Copie a URL HTTPS** que o ngrok fornece (ex: `https://abc123.ngrok-free.app`)

3. No Dashboard do AbacatePay, vá em **Webhooks** ou **Notificações**

4. Adicione um novo webhook:
   - **URL**: `https://abc123.ngrok-free.app/api/billing/abacatepay-webhook`
   - (Use a URL HTTPS que o ngrok forneceu)
   - **Eventos** (selecione):
     - `billing.paid` - Quando pagamento é confirmado
     - `billing.completed` - Quando cobrança é completada
     - `billing.cancelled` - Quando cobrança é cancelada
     - `billing.refunded` - Quando há reembolso
5. Salve o webhook

**⚠️ IMPORTANTE**: 
- A URL do ngrok muda a cada reinício (versão gratuita)
- Atualize o webhook no AbacatePay sempre que reiniciar o ngrok
- Mantenha o ngrok rodando enquanto testar

#### Para Produção:

1. No Dashboard do AbacatePay, vá em **Webhooks**
2. Adicione webhook com URL de produção:
   - **URL**: `https://seu-dominio.com/api/billing/abacatepay-webhook`
3. Selecione os mesmos eventos acima
4. Salve

### 5. Testar Pagamento

1. Use a landing page: `http://localhost:5173/landing`
2. Clique em **Assinar** em um plano
3. Você será redirecionado para o AbacatePay
4. Use os dados de teste (se disponíveis) ou faça um pagamento real

## 💰 Planos Configurados

Os planos estão hardcoded no código:

- **Mensal**: R$ 49,00 (4900 centavos)
- **Anual**: R$ 468,00 (46800 centavos) - R$ 39/mês

Para alterar os valores, edite `server/routes/billing.js` na seção `plans`.

## 🔍 Verificação

Após configurar, verifique:

1. ✅ **Landing page mostra botões "Assinar"** (se `VITE_ABACATEPAY_ENABLED=true`)
2. ✅ **Checkout redireciona para AbacatePay** corretamente
3. ✅ **Webhook recebe eventos** (ver logs do servidor)
4. ✅ **Assinatura é ativada** após pagamento bem-sucedido

## 📝 Métodos de Pagamento

O AbacatePay suporta:

- **PIX** (taxa: R$ 0,80 fixo) - Recomendado!
- **Cartão de Crédito** (taxa: 3,5% + R$ 0,60)
- **Boleto Bancário** (se habilitado)

Por padrão, o sistema usa **PIX**. Para mudar, edite `handleCheckout` em `src/pages/Landing.jsx`:

```javascript
body: JSON.stringify({ 
  plan: planId,
  method: 'CREDIT_CARD' // ou 'PIX'
})
```

## 🐛 Troubleshooting

### Webhook não está sendo chamado
- Verifique se a URL está correta e acessível (use HTTPS em produção)
- Confirme que o webhook está ativo no Dashboard
- Verifique os logs do servidor: `console.log` no webhook handler

### Assinatura não é ativada após pagamento
- Verifique se o webhook está recebendo eventos
- Confirme que `ABACATEPAY_API_KEY` está correto
- Verifique os logs do servidor para erros
- Confirme que o evento do webhook está no formato esperado

### Botões "Assinar" não aparecem
- Verifique se `VITE_ABACATEPAY_ENABLED=true` no `.env`
- Reinicie o servidor de desenvolvimento (`npm run dev`)
- Limpe o cache do navegador

### Erro "AbacatePay não está configurado"
- Verifique se `ABACATEPAY_API_KEY` está no `.env`
- Confirme que a chave está correta
- Reinicie o servidor Node.js

## 🔗 Links Úteis

- [Site do AbacatePay](https://www.abacatepay.com)
- [Documentação da API](https://docs.abacatepay.com)
- [SDK Node.js no NPM](https://www.npmjs.com/package/abacatepay-nodejs-sdk)
- [Suporte AbacatePay](https://www.abacatepay.com/blog/suporte)

## 📊 Comparação de Taxas

| Método | Taxa AbacatePay | Taxa Stripe |
|--------|----------------|-------------|
| PIX | R$ 0,80 fixo | ❌ Não suporta |
| Cartão | 3,5% + R$ 0,60 | ~4,99% + R$ 0,39 |
| Boleto | Disponível | ❌ Não suporta |

**Vantagem**: AbacatePay é mais barato e suporta PIX! 🎉

## 🔄 Migração do Stripe

Se você estava usando Stripe e quer migrar:

1. Remova as variáveis `STRIPE_*` do `.env`
2. Adicione `ABACATEPAY_API_KEY` e `VITE_ABACATEPAY_ENABLED`
3. Reinicie o servidor
4. Os botões na landing automaticamente usarão AbacatePay

O código já está preparado para usar AbacatePay por padrão!
