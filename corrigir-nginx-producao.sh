#!/bin/bash

echo "🔧 CORREÇÃO AUTOMÁTICA - Nginx Produção"
echo "=========================================="
echo ""

# Backup das configurações
echo "📦 Fazendo backup das configurações..."
sudo cp -r /etc/nginx/conf.d /etc/nginx/conf.d.backup-$(date +%Y%m%d-%H%M%S)
sudo cp -r /etc/nginx/sites-enabled /etc/nginx/sites-enabled.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup criado"
echo ""

# Corrigir porta 5000 → 8081 em todos os arquivos
echo "🔄 Corrigindo porta 5000 → 8081 em todas as configurações..."

# Corrigir em conf.d
if ls /etc/nginx/conf.d/*.conf 1> /dev/null 2>&1; then
    sudo sed -i 's/proxy_pass http:\/\/localhost:5000/proxy_pass http:\/\/localhost:8081/g' /etc/nginx/conf.d/*.conf
    echo "✅ Corrigido em /etc/nginx/conf.d/"
else
    echo "ℹ️  Nenhum arquivo .conf em /etc/nginx/conf.d/"
fi

# Corrigir em sites-enabled
if ls /etc/nginx/sites-enabled/* 1> /dev/null 2>&1; then
    sudo sed -i 's/proxy_pass http:\/\/localhost:5000/proxy_pass http:\/\/localhost:8081/g' /etc/nginx/sites-enabled/*
    echo "✅ Corrigido em /etc/nginx/sites-enabled/"
else
    echo "ℹ️  Nenhum arquivo em /etc/nginx/sites-enabled/"
fi

echo ""

# Verificar se corrigiu
echo "🔍 Verificando correções..."
echo "   Porta 8081 encontrada em:"
sudo grep -r "proxy_pass.*:8081" /etc/nginx/ 2>/dev/null | grep -v backup
echo ""
echo "   Porta 5000 ainda presente em:"
sudo grep -r "proxy_pass.*:5000" /etc/nginx/ 2>/dev/null | grep -v backup || echo "   ✅ Nenhuma ocorrência de porta 5000 encontrada"
echo ""

# Testar configuração
echo "🧪 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo ""
    echo "✅ Configuração válida!"
    echo ""
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    if sudo systemctl reload nginx; then
        echo "✅ Nginx recarregado com sucesso!"
    else
        echo "❌ Erro ao recarregar Nginx"
        echo "   Tente: sudo systemctl restart nginx"
    fi
else
    echo ""
    echo "❌ Configuração inválida!"
    echo "   Verifique os erros acima"
    echo "   Para restaurar backup:"
    echo "   sudo rm -rf /etc/nginx/conf.d"
    echo "   sudo mv /etc/nginx/conf.d.backup-* /etc/nginx/conf.d"
fi

echo ""
echo "=========================================="
echo "✅ CORREÇÃO CONCLUÍDA"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Verificar se backend está rodando:"
echo "   pm2 list"
echo "   sudo ss -tlnp | grep :8081"
echo ""
echo "2. Testar API:"
echo "   curl http://localhost:8081/api/health"
echo "   curl https://identikdigital.com.br/api/health"
echo ""
echo "3. Se não funcionar, ver logs:"
echo "   pm2 logs gibaapp-api"
echo "   sudo tail -f /var/log/nginx/error.log"
