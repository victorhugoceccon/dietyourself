#!/bin/bash
# Script para buscar erros do questionário

echo "🔍 Buscando erros do questionário..."
echo ""

# Verificar diretório de trabalho do PM2
PM2_CWD=$(pm2 describe gibaapp-api 2>/dev/null | grep "exec cwd" | awk '{print $3}')
echo "📁 Diretório do PM2: $PM2_CWD"
echo ""

# Verificar se diretório de logs existe
if [ -d "$PM2_CWD/logs" ]; then
    echo "✅ Diretório de logs existe: $PM2_CWD/logs"
    ls -lah "$PM2_CWD/logs/" 2>/dev/null
    echo ""
    
    # Buscar nos arquivos de log se existirem
    if [ -f "$PM2_CWD/logs/pm2-error.log" ]; then
        echo "📊 Buscando em: $PM2_CWD/logs/pm2-error.log"
        echo "----------------------------------------"
        grep -i "questionário\|questionnaire" "$PM2_CWD/logs/pm2-error.log" | tail -20
        echo ""
    else
        echo "⚠️  Arquivo pm2-error.log não encontrado"
    fi
else
    echo "⚠️  Diretório de logs não existe: $PM2_CWD/logs"
    echo "💡 Criando diretório..."
    mkdir -p "$PM2_CWD/logs"
    chmod 755 "$PM2_CWD/logs"
fi

echo ""
echo "📊 Buscando usando PM2 diretamente (últimas 1000 linhas)..."
echo "----------------------------------------"
# Usar --nostream para não travar
pm2 logs gibaapp-api --err --lines 1000 --nostream 2>/dev/null | grep -i "questionário\|questionnaire" | tail -20

echo ""
echo "📅 Buscando erros de hoje..."
echo "----------------------------------------"
DATE=$(date +%Y-%m-%d)
pm2 logs gibaapp-api --err --lines 2000 --nostream 2>/dev/null | grep "$DATE" | grep -i "questionário\|questionnaire" | tail -20

echo ""
echo "✅ Busca concluída!"
echo ""
echo "💡 Se não aparecer nada, pode significar:"
echo "   1. Não há erros recentes do questionário"
echo "   2. Os logs não estão sendo salvos em arquivo"
echo "   3. Os erros estão em pm2-out.log (output geral)"
echo ""
echo "🔍 Para ver todos os logs recentes:"
echo "   pm2 logs gibaapp-api --lines 100 --nostream"
