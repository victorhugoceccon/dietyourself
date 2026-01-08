# 🔧 Corrigir Expressão no Respond to Webhook

## ❌ Problema

Quando você configura:
```json
{
  "response": "{{ $json.output }}"
```

A resposta vem literalmente como `"{{ $json.output }}"` ao invés de processar a expressão.

## ✅ Soluções

### Solução 1: Usar Expressão Correta (Recomendado)

No "Respond to Webhook", configure:

1. **Respond With:** "JSON"
2. **Response Body:** Use a expressão correta do N8N:
   ```json
   {
     "response": "{{ $json.output }}"
   }
   ```

**IMPORTANTE:** Certifique-se de que:
- O campo está no modo de **expressão** (não texto literal)
- No N8N, você pode alternar entre modo texto e expressão
- Use o botão de expressão (geralmente `{{ }}`) para ativar o modo expressão

### Solução 2: Retornar Diretamente o Output (Alternativa)

Se a expressão não funcionar, configure:

1. **Respond With:** "JSON"  
2. **Response Body:** Retorne diretamente o output:
   ```json
   {
     "response": "{{ $('FINN - Resposta').item.json.output }}"
   }
   ```

Ou, se o FINN está conectado diretamente:
```json
{
  "response": "{{ $json.output }}"
}
```

### Solução 3: Usar "All Incoming Items" (Já Funciona!)

O código foi ajustado para ler o campo `output` diretamente. Então você pode:

1. **Respond With:** "All Incoming Items"
2. O código vai automaticamente pegar o campo `output` da resposta

## 🎯 Recomendação

**Use a Solução 3** (All Incoming Items) por enquanto, pois o código já está preparado para isso.

Se quiser usar JSON específico, certifique-se de que o campo está no **modo expressão** no N8N.

## 🔍 Como Verificar se a Expressão Está Funcionando

1. No "Respond to Webhook", clique em "Execute step"
2. Veja o OUTPUT no painel direito
3. Se mostrar `"{{ $json.output }}"` literalmente = expressão não está ativa
4. Se mostrar o texto da resposta = expressão está funcionando

## 📝 Nota sobre Modo Expressão no N8N

No N8N, quando você digita `{{ }}`, ele automaticamente entra em modo expressão.
Se você colar o texto, pode precisar:
- Selecionar o campo
- Clicar no botão de expressão (ícone `{{ }}`)
- Ou deletar e redigitar com `{{ }}`


