#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Nginx e Backend"
echo "=========================================="
echo ""

echo "1️⃣ Verificando backend na porta 8081..."
if sudo ss -tlnp | grep -q :8081; then
    echo "✅ Backend está rodando na porta 8081"
    sudo ss -tlnp | grep :8081
else
    echo "❌ Backend NÃO está na porta 8081"
    echo "   Verificando outras portas..."
    sudo ss -tlnp | grep node || echo "   Nenhum processo Node encontrado"
fi
echo ""

echo "2️⃣ Testando backend diretamente..."
curl -s http://localhost:8081/api/health && echo "✅ Backend responde OK" || echo "❌ Backend não responde"
echo ""

echo "3️⃣ Verificando frontend na porta 8082..."
if sudo ss -tlnp | grep -q :8082; then
    echo "✅ Frontend está rodando na porta 8082"
else
    echo "❌ Frontend NÃO está na porta 8082"
fi
echo ""

echo "4️⃣ Verificando arquivos de configuração do Nginx..."
echo "   Arquivos em /etc/nginx/conf.d/:"
sudo ls -la /etc/nginx/conf.d/ | grep -v "^total" | grep -v "^\."
echo ""
echo "   Arquivos em /etc/nginx/sites-enabled/:"
sudo ls -la /etc/nginx/sites-enabled/ | grep -v "^total" | grep -v "^\."
echo ""

echo "5️⃣ Procurando configurações do domínio identikdigital.com.br..."
sudo grep -r "identikdigital.com.br" /etc/nginx/ 2>/dev/null | head -20
echo ""

echo "6️⃣ Verificando proxy_pass para porta 5000 (INCORRETO)..."
echo "   Arquivos com porta 5000:"
sudo grep -r "proxy_pass.*:5000" /etc/nginx/ 2>/dev/null
echo ""

echo "7️⃣ Verificando proxy_pass para porta 8081 (CORRETO)..."
echo "   Arquivos com porta 8081:"
sudo grep -r "proxy_pass.*:8081" /etc/nginx/ 2>/dev/null
echo ""

echo "8️⃣ Status do Nginx..."
sudo systemctl status nginx --no-pager | head -20
echo ""

echo "9️⃣ Verificando processos PM2..."
pm2 list
echo ""

echo "🔟 Testando acesso ao domínio..."
echo "   Testando http://identikdigital.com.br/api/health:"
curl -s http://identikdigital.com.br/api/health && echo "   ✅ Responde" || echo "   ❌ Não responde"
echo ""
echo "   Testando https://identikdigital.com.br/api/health:"
curl -s https://identikdigital.com.br/api/health && echo "   ✅ Responde" || echo "   ❌ Não responde"
echo ""

echo "=========================================="
echo "📋 RESUMO E PRÓXIMOS PASSOS"
echo "=========================================="
echo ""
echo "Se encontrou 'proxy_pass.*:5000', execute:"
echo "  sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/*.conf"
echo "  sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/sites-enabled/*"
echo "  sudo nginx -t"
echo "  sudo systemctl reload nginx"
echo ""
echo "Se backend não está rodando:"
echo "  cd /root/dietyourself-main"
echo "  pm2 restart gibaapp-api"
echo "  pm2 logs gibaapp-api"
