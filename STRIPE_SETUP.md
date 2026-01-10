# 🔐 Configuração do Stripe

## 📋 Pré-requisitos

1. Conta no Stripe (https://stripe.com)
2. Acesso ao Dashboard do Stripe
3. Produtos e Preços criados no Stripe

## 🚀 Passo a Passo

### 1. Criar Produtos e Preços no Stripe

1. Acesse o Dashboard do Stripe: https://dashboard.stripe.com
2. Vá em **Produtos** → **Adicionar produto**
3. Crie dois produtos:
   - **Plano Mensal**: R$ 49/mês
   - **Plano Anual**: R$ 39/mês (ou R$ 468/ano)

4. Para cada produto, crie um **Preço**:
   - Tipo: Recorrente
   - Intervalo: Mensal ou Anual
   - Valor: em centavos (ex: R$ 49,00 = 4900 centavos)

5. **Copie o Price ID** de cada preço (começa com `price_...`)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Stripe - Chaves da API
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... em produção
STRIPE_PUBLIC_KEY=pk_test_... # ou pk_live_... em produção

# Stripe - Price IDs (copie do Dashboard)
STRIPE_PRICE_MONTHLY=price_... # ID do preço mensal
STRIPE_PRICE_YEARLY=price_... # ID do preço anual

# Frontend - Stripe (para a landing page)
VITE_STRIPE_PUBLIC_KEY=pk_test_... # mesma chave pública
VITE_STRIPE_PRICE_MONTHLY=price_... # mesmo price ID mensal
VITE_STRIPE_PRICE_YEARLY=price_... # mesmo price ID anual

# Webhook Secret (será gerado no próximo passo)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Configurar Webhook

1. No Dashboard do Stripe, vá em **Desenvolvedores** → **Webhooks**
2. Clique em **Adicionar endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/billing/stripe-webhook`
   - Em desenvolvimento local, use: `https://seu-dominio.ngrok.io/api/billing/stripe-webhook` (com ngrok)
4. Selecione os eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Clique em **Adicionar endpoint**
6. **Copie o Signing secret** (começa com `whsec_...`) e adicione em `STRIPE_WEBHOOK_SECRET`

### 4. Testar em Modo Test

1. Use as chaves de **teste** (`sk_test_...` e `pk_test_...`)
2. Use cartões de teste do Stripe:
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`
   - CVC: qualquer 3 dígitos
   - Data: qualquer data futura

### 5. Ativar em Produção

1. Gere chaves **live** no Dashboard do Stripe
2. Crie produtos e preços **live**
3. Configure webhook com URL de produção
4. Atualize todas as variáveis de ambiente com valores **live**
5. Reinicie o servidor

## 🔍 Verificação

Após configurar, verifique:

1. **Landing page mostra botões "Assinar"** (se Stripe configurado)
2. **Checkout redireciona para Stripe** corretamente
3. **Webhook recebe eventos** (ver logs do servidor)
4. **Assinatura é ativada** após pagamento bem-sucedido

## 📝 Notas Importantes

- **Webhook deve ser HTTPS** em produção
- Use **ngrok** para testar webhook localmente
- **Price IDs** são diferentes entre test e live
- Mantenha **STRIPE_WEBHOOK_SECRET** seguro (nunca commite no Git)

## 🐛 Troubleshooting

### Webhook não está sendo chamado
- Verifique se a URL está correta e acessível
- Confirme que o webhook está ativo no Dashboard
- Verifique os logs do servidor

### Assinatura não é ativada após pagamento
- Verifique se o webhook está recebendo eventos
- Confirme que `STRIPE_WEBHOOK_SECRET` está correto
- Verifique os logs do servidor para erros

### Botões "Assinar" não aparecem
- Verifique se `VITE_STRIPE_PUBLIC_KEY` está configurado
- Confirme que `VITE_STRIPE_PRICE_MONTHLY` e `VITE_STRIPE_PRICE_YEARLY` estão configurados
- Reinicie o servidor de desenvolvimento

## 🔗 Links Úteis

- [Documentação do Stripe](https://stripe.com/docs)
- [Testar Webhooks Localmente](https://stripe.com/docs/stripe-cli)
- [Cartões de Teste](https://stripe.com/docs/testing)
