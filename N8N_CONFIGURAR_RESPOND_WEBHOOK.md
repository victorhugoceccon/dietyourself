# ✅ Configurar Respond to Webhook no N8N

## ⚠️ Erro Identificado

```
500 No Respond to Webhook node found in the workflow
```

## 🔧 Solução

O workflow do N8N **precisa ter um nó "Respond to Webhook"** para responder corretamente ao webhook.

### Passo a Passo

1. **Abra seu workflow no N8N**

2. **Adicione o nó "Respond to Webhook"**:
   - Procure por "Respond to Webhook" na lista de nós
   - Arraste para o workflow
   - Posicione-o **no final do workflow** (ou onde você quer que a resposta seja enviada)

3. **Configure o nó Webhook**:
   - Abra o nó **Webhook** (o primeiro nó)
   - Em **"Respond"**, selecione: **"Using 'Respond to Webhook' Node"**
   - Ou deixe como **"When Last Node Finishes"** se tiver o nó Respond to Webhook no final

4. **Configure o nó Respond to Webhook**:
   - **Response Mode**: `Using 'Respond to Webhook' Node`
   - **Options** → **Response Code**: `200` (ou o código que você quiser)
   - **Response Body**: Selecione o que você quer retornar:
     - Pode ser os dados do último nó
     - Ou um JSON customizado

### Exemplo de Estrutura do Workflow

```
Webhook → Code (processar dados) → [Outros nós] → Respond to Webhook
```

### Verificação

Após adicionar o nó:
1. **Salve o workflow**
2. **Ative o workflow** (toggle no canto superior direito)
3. **Teste novamente** a geração de treino

## 📋 Checklist

- [ ] Nó "Respond to Webhook" adicionado ao workflow
- [ ] Nó Webhook configurado com "Respond: Using 'Respond to Webhook' Node"
- [ ] Workflow está ativo (toggle ligado)
- [ ] Teste novamente a geração de treino

## 💡 Dica

Se você não quiser usar o nó "Respond to Webhook", pode configurar o Webhook com:
- **Respond**: `When Last Node Finishes`

Mas é recomendado usar o nó "Respond to Webhook" para ter mais controle sobre a resposta.
