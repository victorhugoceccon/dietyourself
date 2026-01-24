#!/bin/bash
# Script para analisar erros do questionário nos logs

DATE=$(date +%Y-%m-%d)

echo "🔍 Análise de Erros do Questionário - $DATE"
echo "=========================================="
echo ""

# Método 1: Tentar encontrar o diretório do PM2
PM2_CWD=$(pm2 describe gibaapp-api 2>/dev/null | grep "cwd" | awk '{print $2}')
if [ -n "$PM2_CWD" ]; then
    LOG_DIR="$PM2_CWD/logs"
    ERROR_LOG="$LOG_DIR/pm2-error.log"
    OUT_LOG="$LOG_DIR/pm2-out.log"
    echo "✅ Diretório do PM2 encontrado: $PM2_CWD"
else
    # Método 2: Tentar caminho padrão
    LOG_DIR="/opt/dietyourself/dietyourself/logs"
    ERROR_LOG="$LOG_DIR/pm2-error.log"
    OUT_LOG="$LOG_DIR/pm2-out.log"
    echo "⚠️  Usando caminho padrão: $LOG_DIR"
fi

# Verificar se os arquivos de log existem
if [ ! -f "$ERROR_LOG" ]; then
    echo "⚠️  Arquivo de log não encontrado em: $ERROR_LOG"
    echo ""
    echo "📊 Usando PM2 diretamente (método alternativo)..."
    echo ""
    USE_PM2_DIRECT=true
else
    USE_PM2_DIRECT=false
    echo "✅ Arquivo de log encontrado: $ERROR_LOG"
fi
echo ""

if [ "$USE_PM2_DIRECT" = true ]; then
    # Usar PM2 diretamente
    echo "📊 Total de erros relacionados ao questionário hoje:"
    TOTAL=$(pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep -i "questionário\|questionnaire" | wc -l)
    echo "   $TOTAL erros encontrados"
    echo ""
    
    if [ "$TOTAL" -eq 0 ]; then
        echo "✅ Nenhum erro encontrado hoje!"
        echo ""
        echo "🔍 Verificando últimos erros (sem filtro de data):"
        pm2 logs gibaapp-api --err --lines 500 --nostream 2>/dev/null | grep -i "questionário\|questionnaire" | tail -10
    else
        echo "❌ Erros de validação (últimos 5):"
        pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep "❌ Erro de validação" | tail -5
        echo ""
        
        echo "💾 Erros de banco de dados (últimos 5):"
        pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep -E "❌ Erro ao salvar questionário no banco|P2003|P2002|P2025" | tail -5
        echo ""
        
        echo "👤 Erros de usuário não encontrado (últimos 5):"
        pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep "Usuário não encontrado" | tail -5
        echo ""
        
        echo "📝 Últimos 10 erros completos:"
        pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep -B 5 -A 5 "❌ Erro ao salvar questionário" | tail -50
    fi
else
    # Usar arquivos de log
    echo "📊 Total de erros relacionados ao questionário hoje:"
    TOTAL=$(grep "$DATE" "$ERROR_LOG" 2>/dev/null | grep -i "questionário\|questionnaire" | wc -l)
    echo "   $TOTAL erros encontrados"
    echo ""
    
    if [ "$TOTAL" -eq 0 ]; then
        echo "✅ Nenhum erro encontrado hoje!"
        echo ""
        echo "🔍 Verificando últimos erros (sem filtro de data):"
        grep -i "questionário\|questionnaire" "$ERROR_LOG" 2>/dev/null | tail -10
    else
        echo "❌ Erros de validação (últimos 5):"
        grep "$DATE" "$ERROR_LOG" 2>/dev/null | grep "❌ Erro de validação" | tail -5
        echo ""
        
        echo "💾 Erros de banco de dados (últimos 5):"
        grep "$DATE" "$ERROR_LOG" 2>/dev/null | grep -E "❌ Erro ao salvar questionário no banco|P2003|P2002|P2025" | tail -5
        echo ""
        
        echo "👤 Erros de usuário não encontrado (últimos 5):"
        grep "$DATE" "$ERROR_LOG" 2>/dev/null | grep "Usuário não encontrado" | tail -5
        echo ""
        
        echo "📝 Últimos 10 erros completos com contexto:"
        grep "$DATE" "$ERROR_LOG" 2>/dev/null | grep -B 5 -A 5 "❌ Erro ao salvar questionário" | tail -50
        echo ""
        
        echo "📦 Últimos requests recebidos (do pm2-out.log):"
        if [ -f "$OUT_LOG" ]; then
            grep "$DATE" "$OUT_LOG" 2>/dev/null | grep "📝 Recebendo novo questionário" | tail -5
        else
            echo "   Arquivo pm2-out.log não encontrado"
        fi
    fi
fi
echo ""

echo "✅ Análise concluída!"
echo ""
echo "💡 Dica: Para ver logs em tempo real, execute:"
echo "   pm2 logs gibaapp-api | grep -i questionário"
