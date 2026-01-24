# 🔍 Comandos para Buscar Erro do Questionário na VPS

## ⚠️ Problema Identificado

O `pm2 logs` sem `--nostream` fica em modo interativo. Use `--nostream` para não travar!

## 🚀 Comandos para Executar na VPS

### 1. Buscar Erros do Questionário (Últimas 1000 linhas)

```bash
pm2 logs gibaapp-api --err --lines 1000 --nostream | grep -i "questionário\|questionnaire"
```

### 2. Buscar Erros de Hoje

```bash
DATE=$(date +%Y-%m-%d)
pm2 logs gibaapp-api --err --lines 2000 --nostream | grep "$DATE" | grep -i "questionário\|questionnaire"
```

### 3. Ver Todos os Erros Recentes (Sem Filtro)

```bash
pm2 logs gibaapp-api --err --lines 100 --nostream
```

### 4. Verificar se Diretório de Logs Existe

```bash
cd /opt/dietyourself/dietyourself
ls -la logs/
```

### 5. Se o Diretório Não Existir, Criar

```bash
cd /opt/dietyourself/dietyourself
mkdir -p logs
chmod 755 logs
pm2 restart gibaapp-api
```

### 6. Buscar nos Arquivos de Log (Se Existirem)

```bash
cd /opt/dietyourself/dietyourself
grep -i "questionário\|questionnaire" logs/pm2-error.log 2>/dev/null | tail -20
```

### 7. Ver Logs de Output Geral (Pode Ter Erros Também)

```bash
pm2 logs gibaapp-api --lines 500 --nostream | grep -i "questionário\|questionnaire"
```

## 📋 Script Completo (Copiar e Colar)

Execute este script na VPS:

```bash
#!/bin/bash
echo "🔍 Buscando erros do questionário..."
echo ""

# Verificar diretório
cd /opt/dietyourself/dietyourself
echo "📁 Diretório: $(pwd)"
echo ""

# Verificar logs
if [ -d "logs" ]; then
    echo "✅ Diretório de logs existe"
    ls -lah logs/
    echo ""
    
    if [ -f "logs/pm2-error.log" ]; then
        echo "📊 Buscando em logs/pm2-error.log:"
        grep -i "questionário\|questionnaire" logs/pm2-error.log | tail -20
        echo ""
    fi
else
    echo "⚠️  Diretório de logs não existe"
fi

# Buscar usando PM2
echo "📊 Buscando usando PM2 (últimas 1000 linhas de erro):"
pm2 logs gibaapp-api --err --lines 1000 --nostream | grep -i "questionário\|questionnaire" | tail -20
echo ""

# Buscar de hoje
DATE=$(date +%Y-%m-%d)
echo "📅 Buscando erros de hoje ($DATE):"
pm2 logs gibaapp-api --err --lines 2000 --nostream | grep "$DATE" | grep -i "questionário\|questionnaire" | tail -20
echo ""

echo "✅ Busca concluída!"
```

## 🎯 Comando Mais Simples (Uma Linha)

```bash
pm2 logs gibaapp-api --err --lines 1000 --nostream | grep -i "questionário\|questionnaire" | tail -30
```

## 💡 Se Não Aparecer Nada

1. **Verificar se há erros recentes (sem filtro):**
   ```bash
   pm2 logs gibaapp-api --err --lines 50 --nostream
   ```

2. **Verificar se o PM2 está rodando:**
   ```bash
   pm2 status
   ```

3. **Ver logs de output geral (não só erros):**
   ```bash
   pm2 logs gibaapp-api --lines 200 --nostream | grep -i "questionário\|questionnaire"
   ```

4. **Verificar se há logs sendo gerados:**
   ```bash
   pm2 logs gibaapp-api --lines 10 --nostream
   ```

## 🔧 Criar Diretório de Logs (Se Não Existir)

```bash
cd /opt/dietyourself/dietyourself
mkdir -p logs
chmod 755 logs
pm2 restart gibaapp-api
pm2 save
```

## 📊 Ver Informações do PM2

```bash
# Ver status
pm2 status

# Ver informações detalhadas
pm2 describe gibaapp-api

# Ver variáveis de ambiente
pm2 env 0
```
