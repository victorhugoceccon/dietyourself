# 🔍 Como Verificar Logs do Backend

## ⚠️ Erro 500 Persistente

Para identificar o problema, precisamos ver os logs do backend.

## ✅ Verificar Logs

### Opção 1: Se estiver rodando com PM2

```bash
# Ver logs em tempo real
pm2 logs gibaapp-api

# Ou ver últimas 100 linhas
pm2 logs gibaapp-api --lines 100
```

### Opção 2: Se estiver rodando com `npm run dev`

Os logs aparecem diretamente no terminal onde o servidor está rodando.

### Opção 3: Se estiver rodando diretamente com `node`

Os logs aparecem no terminal.

## 🔍 O Que Procurar nos Logs

Procure por estas mensagens quando tentar gerar um treino:

1. **Erros de conversão base64**:
   ```
   ❌ Erro ao converter imagens para base64
   ❌ fotoFrente.buffer inválido
   ❌ fotoCostas.buffer inválido
   ```

2. **Erros de JSON.stringify**:
   ```
   ❌ Erro ao fazer JSON.stringify do payload
   ```

3. **Erros de rede/N8N**:
   ```
   ❌ Erro de rede ao chamar N8N
   ❌ Erro do N8N: [status]
   ```

4. **Erros de banco de dados**:
   ```
   ❌ Erro ao criar prescrição
   ❌ Erro ao gerar treino:
   ```

5. **Erros de assinatura**:
   ```
   Erro ao verificar assinatura:
   ```

## 📋 Checklist

- [ ] Backend está rodando?
- [ ] Logs mostram algum erro específico?
- [ ] Qual é a mensagem de erro completa nos logs?

## 💡 Dica

Copie e cole aqui os logs que aparecerem quando você tentar gerar o treino, especialmente:
- Linhas que começam com `❌`
- Linhas que começam com `Erro ao`
- Stack traces completos

Isso vai ajudar a identificar exatamente onde o problema está ocorrendo.
