# 🔍 Como Buscar Erros do Questionário nos Logs de Produção

## 📍 Localização dos Logs

Os logs do PM2 estão salvos em caminho relativo (`./logs/`), então dependem do diretório onde o PM2 foi iniciado.

**⚠️ IMPORTANTE**: Use `pm2 logs` diretamente em vez de buscar arquivos, pois é mais confiável!

### Encontrar o caminho real:
```bash
# Ver onde o PM2 está rodando
pm2 describe gibaapp-api | grep "cwd"

# Ou procurar no sistema
find /opt -name "pm2-error.log" 2>/dev/null
```

## 🚀 Comandos Rápidos (RECOMENDADO - Use PM2 Diretamente)

### 1. Ver Logs em Tempo Real (PM2) - MELHOR MÉTODO

```bash
# Ver todos os logs em tempo real
pm2 logs gibaapp-api

# Ver apenas erros
pm2 logs gibaapp-api --err

# Ver últimas 200 linhas
pm2 logs gibaapp-api --lines 200

# ⭐ BUSCAR ERROS DO QUESTIONÁRIO (MELHOR MÉTODO)
pm2 logs gibaapp-api --err --lines 500 | grep -i "questionário\|questionnaire"

# Ver erros de hoje
pm2 logs gibaapp-api --err --lines 2000 | grep "$(date +%Y-%m-%d)" | grep -i questionário
```

### 2. Buscar Erros Específicos do Questionário

```bash
# Buscar todos os erros relacionados ao questionário
grep -i "questionário\|questionnaire" /opt/dietyourself/dietyourself/logs/pm2-error.log

# Buscar erros de validação
grep -i "❌ Erro de validação\|Erro ao salvar questionário" /opt/dietyourself/dietyourself/logs/pm2-error.log

# Buscar por userId específico (substitua USER_ID)
grep "userId.*USER_ID" /opt/dietyourself/dietyourself/logs/pm2-error.log

# Buscar erros de banco de dados (Prisma)
grep -E "P2003|P2002|P2025" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

### 3. Buscar por Timestamp (Data/Hora)

```bash
# Buscar erros de hoje
grep "$(date +%Y-%m-%d)" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# Buscar erros de uma data específica (ex: 2026-01-22)
grep "2026-01-22" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# Buscar erros das últimas 2 horas
grep "$(date -d '2 hours ago' +%Y-%m-%d)" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário
```

### 4. Buscar Erros com Contexto (Linhas Antes/Depois)

```bash
# Mostrar 10 linhas antes e depois do erro
grep -B 10 -A 10 "❌ Erro ao salvar questionário" /opt/dietyourself/dietyourself/logs/pm2-error.log

# Mostrar contexto completo de um erro específico
grep -B 20 -A 20 "userId.*SEU_USER_ID" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

## 🔎 Tipos de Erros Comuns do Questionário

### 1. Erro de Validação (Zod)

**Como identificar:**
```bash
grep "❌ Erro de validação" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

**O que procurar:**
- Campos obrigatórios faltando
- Tipos de dados incorretos
- Valores fora do range permitido

**Exemplo de log:**
```
❌ Erro de validação: [{"path":["idade"],"message":"Expected number, received string","code":"invalid_type"}]
```

### 2. Erro de Banco de Dados (Prisma)

**Como identificar:**
```bash
grep -E "❌ Erro ao salvar questionário no banco|P2003|P2002|P2025" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

**Códigos de erro comuns:**
- **P2003**: Foreign key constraint (usuário não existe)
- **P2002**: Unique constraint violation
- **P2025**: Record not found

**Exemplo de log:**
```
❌ Erro ao salvar questionário no banco: PrismaClientKnownRequestError
❌ Código do erro: P2003
❌ Mensagem do erro: Foreign key constraint failed
```

### 3. Erro de Usuário Não Encontrado

**Como identificar:**
```bash
grep "Usuário não encontrado\|userExists" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

**Exemplo de log:**
```
📝 Recebendo novo questionário (7 blocos) para userId: abc123
❌ Usuário não encontrado
```

### 4. Erro de JSON Parse

**Como identificar:**
```bash
grep -i "JSON\|parse\|stringify" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário
```

**Exemplo de log:**
```
❌ Erro ao parsear resposta: Unexpected token
```

## 📊 Script de Análise Completa

Crie um script para análise completa:

```bash
#!/bin/bash
# Salvar como: analisar-questionario.sh

LOG_FILE="/opt/dietyourself/dietyourself/logs/pm2-error.log"
DATE=$(date +%Y-%m-%d)

echo "🔍 Análise de Erros do Questionário - $DATE"
echo "=========================================="
echo ""

echo "📊 Total de erros relacionados ao questionário hoje:"
grep "$DATE" "$LOG_FILE" | grep -i "questionário\|questionnaire" | wc -l

echo ""
echo "❌ Erros de validação:"
grep "$DATE" "$LOG_FILE" | grep "❌ Erro de validação" | tail -5

echo ""
echo "💾 Erros de banco de dados:"
grep "$DATE" "$LOG_FILE" | grep -E "❌ Erro ao salvar questionário no banco|P2003|P2002|P2025" | tail -5

echo ""
echo "👤 Erros de usuário não encontrado:"
grep "$DATE" "$LOG_FILE" | grep "Usuário não encontrado" | tail -5

echo ""
echo "📝 Últimos 10 erros completos:"
grep "$DATE" "$LOG_FILE" | grep -B 5 -A 5 "❌ Erro ao salvar questionário" | tail -50
```

**Como usar:**
```bash
chmod +x analisar-questionario.sh
./analisar-questionario.sh
```

## 🎯 Buscar Erro de um Usuário Específico

### Passo 1: Identificar o userId

Se você souber o email do usuário, busque primeiro o userId:

```bash
# No banco de dados
psql -U postgres -d dietyourself -c "SELECT id, email FROM users WHERE email = 'email@exemplo.com';"
```

### Passo 2: Buscar nos logs

```bash
# Substitua USER_ID pelo ID encontrado
grep -B 20 -A 20 "userId.*USER_ID" /opt/dietyourself/dietyourself/logs/pm2-error.log | tail -100

# Ou buscar por email (se estiver nos logs)
grep -B 20 -A 20 "email@exemplo.com" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

## 🔍 Buscar Erro por Request ID ou Timestamp Específico

Se você souber aproximadamente quando o erro ocorreu:

```bash
# Buscar por hora específica (ex: 14:30)
grep "2026-01-22.*14:3[0-9]" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# Buscar intervalo de tempo (ex: entre 14:00 e 15:00)
grep "2026-01-22.*14:" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário
```

## 📋 Checklist de Troubleshooting

1. **Identificar o tipo de erro:**
   ```bash
   grep "❌" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário | tail -20
   ```

2. **Verificar se o usuário existe:**
   ```bash
   # Verificar no banco
   psql -U postgres -d dietyourself -c "SELECT id, email FROM users WHERE id = 'USER_ID';"
   ```

3. **Verificar dados enviados:**
   ```bash
   # Buscar o body recebido
   grep "📦 Body recebido" /opt/dietyourself/dietyourself/logs/pm2-out.log | tail -5
   ```

4. **Verificar stack trace completo:**
   ```bash
   grep -A 30 "Stack trace" /opt/dietyourself/dietyourself/logs/pm2-error.log | tail -50
   ```

## 💡 Dicas Importantes

1. **Logs rotacionam**: Se o erro for antigo, pode estar em logs rotacionados
   ```bash
   # Verificar se há logs antigos
   ls -lah /opt/dietyourself/dietyourself/logs/
   ```

2. **Verificar ambos os arquivos**: Erros podem estar em `pm2-error.log` ou `pm2-out.log`
   ```bash
   grep -i questionário /opt/dietyourself/dietyourself/logs/pm2-*.log
   ```

3. **Exportar para análise:**
   ```bash
   # Exportar erros do questionário para arquivo
   grep -i "questionário\|questionnaire" /opt/dietyourself/dietyourself/logs/pm2-error.log > questionario-erros.txt
   ```

4. **Monitorar em tempo real:**
   ```bash
   # Monitorar novos erros enquanto testa
   tail -f /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário
   ```

## 🚨 Erros Críticos a Procurar

```bash
# 1. Erros de validação (dados inválidos)
grep "❌ Erro de validação" /opt/dietyourself/dietyourself/logs/pm2-error.log

# 2. Erros de banco (P2003 = usuário não existe)
grep "P2003" /opt/dietyourself/dietyourself/logs/pm2-error.log

# 3. Erros de JSON (dados corrompidos)
grep -i "JSON\|parse\|stringify" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# 4. Erros de memória (se o questionário for muito grande)
grep -i "memory\|heap\|out of memory" /opt/dietyourself/dietyourself/logs/pm2-error.log
```

## 📞 Exemplo Prático Completo

**Cenário**: Usuário reportou erro ao responder questionário hoje às 15:30

```bash
# 1. Buscar erros do questionário hoje
grep "$(date +%Y-%m-%d)" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# 2. Filtrar por horário específico
grep "$(date +%Y-%m-%d).*15:3[0-9]" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário

# 3. Ver contexto completo
grep -B 30 -A 30 "$(date +%Y-%m-%d).*15:3[0-9]" /opt/dietyourself/dietyourself/logs/pm2-error.log | grep -i questionário -A 30 -B 30

# 4. Exportar para análise
grep -B 30 -A 30 "$(date +%Y-%m-%d).*15:3[0-9]" /opt/dietyourself/dietyourself/logs/pm2-error.log > erro-questionario-$(date +%Y%m%d-%H%M).txt
```

## ✅ Verificação Rápida

Execute este comando para ver os últimos erros do questionário:

```bash
grep -i "questionário\|questionnaire" /opt/dietyourself/dietyourself/logs/pm2-error.log | tail -20
```
