# 🔍 Debug: Erro 500 ao Gerar Treino

## ⚠️ Erro Identificado

`POST http://localhost:5000/api/workout/generate 500 (Internal Server Error)`

## ✅ Validações Adicionadas

1. **Validação de buffers** antes de converter para base64
2. **Try-catch** ao fazer `JSON.stringify` do payload
3. **Melhor tratamento de erro** no catch final com mensagens detalhadas

## 🔍 Como Verificar o Erro

### 1. Verificar Logs do Backend

Execute o backend e veja os logs no terminal. Procure por:
- `❌ Erro ao gerar treino:`
- `❌ Stack trace:`
- `❌ Error message:`

### 2. Verificar se o Backend Está Rodando

```bash
# Verificar se o processo está rodando
pm2 list

# Ou verificar logs
pm2 logs gibaapp-api

# Ou se estiver rodando diretamente
npm run dev
```

### 3. Possíveis Causas do Erro 500

#### A. Erro ao Converter para Base64
```
❌ fotoFrente.buffer inválido
❌ fotoCostas.buffer inválido
```
**Solução**: Verificar se as fotos estão sendo enviadas corretamente do frontend

#### B. Payload Muito Grande
```
❌ Erro ao fazer JSON.stringify do payload
```
**Solução**: Reduzir tamanho das imagens ou usar compressão

#### C. Erro ao Fazer Fetch para N8N
```
❌ Erro de rede ao chamar N8N
```
**Solução**: Verificar se o N8N está acessível e a URL está correta

#### D. Erro ao Processar Resposta do N8N
```
❌ Erro do N8N: [status]
```
**Solução**: Verificar resposta do N8N e ajustar processamento

#### E. Erro ao Salvar no Banco
```
❌ Erro ao criar prescrição
```
**Solução**: Verificar conexão com banco e schema do Prisma

## 📋 Checklist de Verificação

- [ ] Backend está rodando?
- [ ] Logs do backend mostram o erro específico?
- [ ] Fotos estão sendo enviadas corretamente?
- [ ] N8N está acessível?
- [ ] URL do N8N está correta no `.env`?
- [ ] Banco de dados está conectado?

## 🔧 Próximos Passos

1. **Execute o backend** e veja os logs
2. **Tente gerar um treino** novamente
3. **Copie os logs** que aparecerem (especialmente os que começam com `❌`)
4. **Envie os logs** para análise

## 💡 Dica

Se o erro persistir, adicione mais logs temporários no código:

```javascript
console.log('🔍 DEBUG: Chegou no ponto X')
console.log('🔍 DEBUG: Variável Y:', Y)
```

Isso ajuda a identificar exatamente onde o erro está ocorrendo.
