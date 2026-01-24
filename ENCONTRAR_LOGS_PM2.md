# 🔍 Como Encontrar os Logs do PM2

## 🚀 Método 1: Usar PM2 Diretamente (Recomendado)

O PM2 gerencia os logs automaticamente. Use estes comandos:

```bash
# Ver logs em tempo real (todos)
pm2 logs gibaapp-api

# Ver apenas erros
pm2 logs gibaapp-api --err

# Ver últimas 100 linhas
pm2 logs gibaapp-api --lines 100

# Ver logs de erro do questionário
pm2 logs gibaapp-api --err | grep -i "questionário\|questionnaire"

# Ver logs de hoje
pm2 logs gibaapp-api --lines 1000 | grep "$(date +%Y-%m-%d)" | grep -i questionário
```

## 🔍 Método 2: Encontrar o Diretório de Trabalho do PM2

```bash
# Ver informações do processo PM2
pm2 describe gibaapp-api

# Ver diretório de trabalho
pm2 describe gibaapp-api | grep "cwd\|exec cwd"

# Ou verificar diretamente
pm2 info gibaapp-api
```

## 📁 Método 3: Procurar os Arquivos de Log

```bash
# Procurar arquivos de log em todo o sistema
find /opt -name "pm2-error.log" 2>/dev/null
find /opt -name "pm2-out.log" 2>/dev/null

# Procurar no diretório home
find ~ -name "pm2-error.log" 2>/dev/null

# Verificar diretório padrão do PM2
ls -la ~/.pm2/logs/

# Verificar se há logs no diretório do projeto
cd /opt/dietyourself/dietyourself
ls -la logs/
```

## 🎯 Método 4: Verificar Onde o PM2 Foi Iniciado

```bash
# Ver processos PM2 e seus diretórios
pm2 list
pm2 show gibaapp-api

# Ver variáveis de ambiente (inclui diretório)
pm2 env 0
```

## ✅ Comandos Rápidos para Buscar Erros do Questionário

### Opção A: Usando PM2 (Melhor)
```bash
# Ver últimos erros do questionário
pm2 logs gibaapp-api --err --lines 500 | grep -i "questionário\|questionnaire"

# Ver erros de hoje
pm2 logs gibaapp-api --err --lines 2000 | grep "$(date +%Y-%m-%d)" | grep -i questionário

# Monitorar em tempo real
pm2 logs gibaapp-api --err | grep -i "questionário\|questionnaire"
```

### Opção B: Depois de encontrar o caminho
```bash
# Primeiro encontre o caminho:
PM2_DIR=$(pm2 describe gibaapp-api | grep "cwd" | awk '{print $2}')
echo "Diretório: $PM2_DIR"

# Depois busque nos logs:
grep -i "questionário\|questionnaire" "$PM2_DIR/logs/pm2-error.log" | tail -20
```

## 🔧 Se os Logs Não Estiverem Sendo Salvos

Se os arquivos de log não existirem, pode ser que:
1. O diretório `logs/` não foi criado
2. O PM2 não tem permissão para escrever
3. Os logs estão sendo redirecionados

**Solução:**
```bash
# Ir para o diretório do projeto
cd /opt/dietyourself/dietyourself

# Criar diretório de logs
mkdir -p logs
chmod 755 logs

# Verificar permissões
ls -la logs/

# Reiniciar PM2 para recriar os logs
pm2 restart gibaapp-api
pm2 save
```

## 📊 Verificar Logs do Sistema (Alternativa)

Se os logs do PM2 não estiverem disponíveis, verifique:

```bash
# Logs do sistema (journald)
journalctl -u pm2-* -n 100 --no-pager

# Ou se estiver usando systemd
journalctl -u gibaapp-api -n 100 --no-pager
```

## 🎯 Script Completo para Encontrar e Analisar

```bash
#!/bin/bash
echo "🔍 Procurando logs do PM2..."
echo ""

# Método 1: PM2 direto
echo "📊 Método 1: Usando PM2 diretamente"
echo "-----------------------------------"
pm2 logs gibaapp-api --err --lines 50 | grep -i "questionário\|questionnaire" | tail -10
echo ""

# Método 2: Encontrar diretório
echo "📁 Método 2: Procurando arquivos de log"
echo "----------------------------------------"
PM2_CWD=$(pm2 describe gibaapp-api 2>/dev/null | grep "cwd" | awk '{print $2}')
if [ -n "$PM2_CWD" ]; then
    echo "Diretório encontrado: $PM2_CWD"
    if [ -f "$PM2_CWD/logs/pm2-error.log" ]; then
        echo "✅ Arquivo de log encontrado!"
        grep -i "questionário\|questionnaire" "$PM2_CWD/logs/pm2-error.log" | tail -10
    else
        echo "❌ Arquivo não encontrado em $PM2_CWD/logs/"
    fi
else
    echo "⚠️  Não foi possível determinar o diretório"
fi
echo ""

# Método 3: Buscar no sistema
echo "🔎 Método 3: Buscando em todo o sistema"
echo "---------------------------------------"
find /opt -name "pm2-error.log" 2>/dev/null | head -5
```
