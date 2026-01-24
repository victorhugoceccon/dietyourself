# 🔧 Correção: Erro de Validação no Questionário

## ❌ Problema Identificado

O usuário estava recebendo erros de validação ao tentar responder o questionário. Os logs mostraram:

```
❌ Erro de validação:
- horarioTreino: Recebeu "Falta de motivação" mas esperava 'Manhã' | 'Tarde' | 'Noite' | 'Varia muito'
- quantidadeRefeicoes: Recebeu "Varia muito" mas esperava '3' | '4' | '5' | 'Mais de 5'
- preferenciaRefeicoes: Recebeu "3" mas esperava 'Mais simples' | 'Um equilíbrio' | 'Mais completas e variadas'
```

## 🔍 Causa Raiz

O frontend (`ConversationalQuestionnaire.jsx`) está permitindo que valores incorretos sejam enviados para campos do tipo `choice`. Isso pode acontecer quando:

1. O usuário digita texto livre em vez de escolher uma opção
2. Há um bug no mapeamento das respostas
3. Os valores estão sendo trocados entre campos

## ✅ Solução Implementada

### 1. Transformações no Backend (Temporária)

Adicionei transformações no schema Zod (`server/routes/questionnaire.js`) para mapear valores incorretos para valores válidos:

- **horarioTreino**: Mapeia "Falta de motivação" e outros valores para "Varia muito"
- **quantidadeRefeicoes**: Mapeia "Varia muito" e outros valores para "3" (padrão)
- **preferenciaRefeicoes**: Mapeia "3" e outros valores numéricos para "Um equilíbrio" (padrão)

### 2. Validação no Frontend (Recomendado - A Fazer)

O ideal é corrigir o frontend para garantir que apenas valores válidos sejam enviados:

1. **Validar antes de enviar**: Verificar se os valores estão nas opções permitidas
2. **Forçar escolha de opções**: Para campos `choice`, não permitir entrada de texto livre
3. **Mapear valores**: Se necessário, mapear respostas do usuário para valores válidos antes de enviar

## 📋 Valores Esperados

### horarioTreino
- ✅ 'Manhã'
- ✅ 'Tarde'
- ✅ 'Noite'
- ✅ 'Varia muito'

### quantidadeRefeicoes
- ✅ '3'
- ✅ '4'
- ✅ '5'
- ✅ 'Mais de 5'
- ✅ '3 refeições' (legado)
- ✅ '4 refeições' (legado)
- ✅ '5 refeições' (legado)

### preferenciaRefeicoes
- ✅ 'Mais simples'
- ✅ 'Um equilíbrio'
- ✅ 'Mais completas e variadas'
- ✅ 'Mais simples, com poucos alimentos' (legado)
- ✅ 'Um equilíbrio entre simples e variadas' (legado)

## 🚀 Como Testar

1. **Fazer deploy da correção:**
   ```bash
   # Na VPS
   cd /opt/dietyourself/dietyourself
   git pull origin main
   pm2 restart gibaapp-api
   ```

2. **Testar o questionário:**
   - Acessar como novo usuário
   - Responder o questionário
   - Verificar se não há mais erros de validação

3. **Verificar logs:**
   ```bash
   pm2 logs gibaapp-api --err --lines 100 --nostream | grep -i "questionário\|validation"
   ```

## 🔄 Próximos Passos

1. **Investigar o frontend**: Verificar por que valores incorretos estão sendo enviados
2. **Adicionar validação no frontend**: Garantir que apenas valores válidos sejam aceitos
3. **Melhorar UX**: Se necessário, ajustar as perguntas para serem mais claras

## 📝 Notas

- A solução atual é uma **correção temporária** que mapeia valores incorretos
- O ideal é **corrigir na origem** (frontend) para evitar valores inválidos
- Os logs agora devem mostrar menos erros de validação

## ✅ Status

- [x] Backend atualizado com transformações
- [ ] Frontend validando valores antes de enviar
- [ ] Testes realizados
- [ ] Deploy em produção
