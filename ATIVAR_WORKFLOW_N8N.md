# 🔴 IMPORTANTE: Ativar Workflow no N8N

## ❌ Erro Atual

```
404 Not Found
"The requested webhook \"chat-dietyourself\" is not registered."
```

## ✅ Solução

O workflow precisa estar **ATIVO** no N8N, não apenas em modo de teste.

### Passo a Passo:

1. **Abra o workflow no N8N**
   - Acesse: `http://69.6.215.140:8080/`
   - Abra o workflow que contém o webhook

2. **Ative o Workflow**
   - No canto superior direito, há um botão **"Active"** (Ativo)
   - Clique nele para **ativar** o workflow
   - O botão deve ficar **vermelho/ativo**

3. **Verifique o Status**
   - Quando ativo, o workflow fica sempre "escutando" o webhook
   - Não precisa clicar em "Execute workflow" toda vez
   - O webhook fica disponível para receber requisições externas

4. **Teste Novamente**
   - Após ativar, teste o chat na aplicação
   - Deve funcionar agora!

## 🔍 Diferença entre Modo Teste e Ativo

### Modo Teste (Listen for test event):
- Funciona apenas **uma vez** após clicar
- Não fica sempre disponível
- Usado para testar o workflow manualmente

### Modo Ativo:
- Fica sempre disponível
- Recebe requisições externas continuamente
- Necessário para produção

## ⚠️ Importante

- O workflow precisa estar **ativo** para receber requisições da aplicação
- Se desativar o workflow, o webhook para de funcionar
- Mantenha o workflow ativo enquanto a aplicação estiver em uso


