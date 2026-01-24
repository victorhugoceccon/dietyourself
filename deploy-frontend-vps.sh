#!/bin/bash

echo "🚀 DEPLOY FRONTEND - VPS"
echo "=========================================="
echo ""

cd /opt/dietyourself/dietyourself

echo "1️⃣ Backup do .env atual..."
if [ -f .env ]; then
    cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup criado"
else
    echo "ℹ️  Nenhum .env existente"
fi
echo ""

echo "2️⃣ Atualizando variáveis no .env existente..."
# Atualizar apenas as variáveis necessárias
sed -i 's|^VITE_API_URL=.*|VITE_API_URL="/api"|' .env
sed -i 's|^PORT=.*|PORT=8081|' .env

# Se não existir VITE_API_URL, adicionar
if ! grep -q "^VITE_API_URL=" .env; then
    echo "VITE_API_URL=\"/api\"" >> .env
fi

echo "✅ .env atualizado"
echo ""
echo "Variáveis importantes:"
grep -E "^(PORT|VITE_API_URL|FRONTEND_URL)" .env
echo ""

echo "3️⃣ Limpando build anterior..."
rm -rf dist/
echo "✅ Build anterior removido"
echo ""

echo "4️⃣ Fazendo build do frontend..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso"
else
    echo "❌ Erro no build"
    exit 1
fi
echo ""

echo "5️⃣ Verificando arquivos gerados..."
if [ -f dist/index.html ]; then
    echo "✅ dist/index.html existe"
    ls -lh dist/index.html
else
    echo "❌ dist/index.html NÃO existe"
    exit 1
fi
echo ""

echo "6️⃣ Ajustando permissões..."
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
echo "✅ Permissões ajustadas"
echo ""

echo "7️⃣ Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração válida"
    echo ""
    echo "8️⃣ Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado"
else
    echo "❌ Configuração inválida - Nginx NÃO foi recarregado"
    exit 1
fi
echo ""

echo "9️⃣ Reiniciando backend..."
pm2 restart gibaapp-api
echo "✅ Backend reiniciado"
echo ""

echo "🔟 Verificando status..."
echo "   Backend (porta 8081):"
sudo ss -tlnp | grep :8081 && echo "   ✅ Rodando" || echo "   ❌ Não está rodando"
echo ""
echo "   Nginx:"
sudo systemctl status nginx --no-pager | grep Active
echo ""

echo "=========================================="
echo "✅ DEPLOY CONCLUÍDO!"
echo "=========================================="
echo ""
echo "🌐 Acesse: https://identikdigital.com.br"
echo ""
echo "🔍 Se não funcionar, verifique:"
echo "   - Console do navegador (F12)"
echo "   - Logs do backend: pm2 logs gibaapp-api"
echo "   - Logs do Nginx: sudo tail -f /var/log/nginx/error.log"
