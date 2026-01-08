# 🔧 Configurar "Respond to Webhook" no N8N

## 📋 Configuração Atual vs Necessária

### ❌ Configuração Atual:
- **Respond With:** "All Incoming Items"
- Isso retorna todos os dados do nó anterior

### ✅ Configuração Necessária:
- **Respond With:** "JSON"
- **Response Body:** JSON específico com a chave `response`

## 🎯 Passo a Passo para Corrigir

### 1. No Nó "Respond to Webhook":

1. **Clique no nó "Respond to Webhook"**

2. **Na aba "Parameters":**
   - **Respond With:** Mude de "All Incoming Items" para **"JSON"**

3. **Response Body:**
   - Clique no campo "Response Body"
   - Adicione o seguinte JSON:
   ```json
   {
     "response": "{{ $json.output }}"
   }
   ```
   
   **OU**, se o FINN retorna em outro campo:
   ```json
   {
     "response": "{{ $json.text }}"
   }
   ```
   
   **OU**, se o FINN retorna em `message`:
   ```json
   {
     "response": "{{ $json.message }}"
   }
   ```

### 2. Verificar o Formato de Saída do FINN:

Para descobrir o campo correto:

1. Clique no nó "FINN - Resposta"
2. Veja o OUTPUT (painel direito)
3. Identifique qual campo contém a resposta do chat
4. Use esse campo na expressão

**Exemplo:**
- Se o OUTPUT mostra: `{ "output": "texto da resposta" }` → use `{{ $json.output }}`
- Se o OUTPUT mostra: `{ "text": "texto da resposta" }` → use `{{ $json.text }}`
- Se o OUTPUT mostra: `{ "message": "texto da resposta" }` → use `{{ $json.message }}`

### 3. Configuração Final:

```json
{
  "response": "{{ $json.output }}"
}
```

Isso vai retornar:
```json
{
  "response": "Oi! Você tem alguma dúvida ou precisa de alguma orientação sobre alimentação saudável? Estou aqui para ajudar!"
}
```

## ✅ Verificação

Após configurar:

1. **Ative o workflow** (botão "Active" no canto superior direito)
2. **Teste o chat** na aplicação
3. A resposta deve aparecer corretamente

## 🔍 Se Não Funcionar

Se a resposta não aparecer, verifique:

1. **Formato do OUTPUT do FINN:**
   - Clique em "FINN - Resposta"
   - Veja o OUTPUT no painel direito
   - Use o campo correto na expressão

2. **Teste a Expressão:**
   - No "Respond to Webhook", você pode testar a expressão
   - Clique em "Execute step" para ver o resultado

3. **Logs do Servidor:**
   - Verifique os logs do servidor
   - Eles vão mostrar o formato da resposta recebida


