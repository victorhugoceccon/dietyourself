# 🛒 Configuração de Checkout Externo (Cakto/Hotmart/Kiwify)

## 📋 Por que usar checkout externo?

✅ **Vantagens:**
- Interface de pagamento pronta e testada
- Suporte a múltiplos métodos (PIX, cartão, boleto)
- Gerenciamento de reembolsos e cancelamentos
- Webhooks confiáveis
- Menos código para manter
- Foco no produto, não na integração de pagamento

## 🚀 Configuração Rápida

### 1. Criar Produto no Checkout Externo

**Opções populares:**
- **Cakto**: https://cakto.com.br
- **Hotmart**: https://hotmart.com
- **Kiwify**: https://kiwify.com.br
- **Eduzz**: https://eduzz.com

### 2. Configurar Webhook

No painel do checkout externo, configure o webhook:

**URL do Webhook:**
```
https://seu-dominio.com/api/checkout-external/webhook
```

**Em desenvolvimento (com ngrok):**
```
https://abc123.ngrok-free.app/api/checkout-external/webhook
```

### 3. Configurar Variáveis de Ambiente

Adicione no `.env`:

```env
# URL do checkout externo (link direto para o produto)
EXTERNAL_CHECKOUT_URL=https://cakto.com.br/checkout/produto-123
# ou
EXTERNAL_CHECKOUT_URL=https://pay.hotmart.com/checkout/produto-123

# Frontend
VITE_EXTERNAL_CHECKOUT_URL=https://cakto.com.br/checkout/produto-123
```

### 4. Formato do Webhook

O webhook espera receber um JSON no seguinte formato:

```json
{
  "email": "[email protected]",
  "name": "João Silva",
  "plan": "MONTHLY",
  "transactionId": "TXN123456",
  "amount": 4900,
  "status": "paid",
  "paymentMethod": "PIX",
  "customerData": {
    "phone": "+5511999999999",
    "cpf": "123.456.789-00"
  }
}
```

### 5. Configurar no Checkout Externo

No painel do checkout externo:

1. **Webhook URL**: Cole a URL do webhook
2. **Eventos**: Selecione "Pagamento aprovado" ou "Transação concluída"
3. **Formato**: JSON
4. **Campos personalizados**: Configure para enviar:
   - `email` (obrigatório)
   - `name` (opcional)
   - `plan` (MONTHLY ou YEARLY)
   - `transactionId` (ID da transação)
   - `amount` (valor em centavos)
   - `status` (paid/completed/approved)
   - `paymentMethod` (PIX, CREDIT_CARD, etc.)

## 📝 Exemplo: Cakto

1. Crie um produto no Cakto
2. Configure o webhook:
   - URL: `https://seu-dominio.com/api/checkout-external/webhook`
   - Evento: "Pagamento Aprovado"
3. No produto, adicione campos personalizados:
   - `plan`: MONTHLY ou YEARLY
4. Copie o link do checkout e adicione no `.env`:
   ```env
   EXTERNAL_CHECKOUT_URL=https://cakto.com.br/checkout/seu-produto
   VITE_EXTERNAL_CHECKOUT_URL=https://cakto.com.br/checkout/seu-produto
   ```

## 🔄 Fluxo Completo

1. **Usuário clica "Assinar"** na landing page
2. **Redireciona** para o checkout externo (Cakto/Hotmart/etc)
3. **Usuário paga** no checkout externo
4. **Checkout externo chama** nosso webhook: `/api/checkout-external/webhook`
5. **Sistema cria usuário** automaticamente (se não existir)
6. **Sistema ativa assinatura** no banco de dados
7. **Usuário é redirecionado** para página de sucesso

## ✅ Teste

1. Configure o webhook no checkout externo
2. Faça um pagamento de teste
3. Verifique os logs do servidor:
   ```
   === WEBHOOK DE CHECKOUT EXTERNO RECEBIDO ===
   Body: { ... }
   Criando novo usuário para: [email protected]
   ✅ Assinatura ativada para usuário: ...
   ```

## 🐛 Troubleshooting

### Webhook não está sendo chamado
- Verifique se a URL está correta e acessível (use HTTPS)
- Confirme que o webhook está ativo no painel do checkout
- Use ngrok para testar localmente

### Usuário não está sendo criado
- Verifique os logs do servidor
- Confirme que o formato do JSON está correto
- Verifique se o email está sendo enviado no webhook

### Assinatura não é ativada
- Verifique se o campo `plan` está sendo enviado (MONTHLY ou YEARLY)
- Confirme que o `status` é "paid", "completed" ou "approved"
- Verifique os logs para erros

## 📚 Links Úteis

- [Cakto](https://cakto.com.br)
- [Hotmart](https://hotmart.com)
- [Kiwify](https://kiwify.com.br)
- [Eduzz](https://eduzz.com)

## 💡 Dica

Você pode ter **múltiplos produtos** (mensal e anual) e usar URLs diferentes:

```env
# Plano Mensal
EXTERNAL_CHECKOUT_URL_MONTHLY=https://cakto.com.br/checkout/mensal

# Plano Anual  
EXTERNAL_CHECKOUT_URL_YEARLY=https://cakto.com.br/checkout/anual
```

E na landing, redirecionar para a URL correta baseada no plano selecionado.
