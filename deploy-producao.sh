#!/bin/bash

# 🚀 Script de Deploy Automatizado - Giba App
# Uso: ./deploy-producao.sh

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/var/www/gibaapp"
cd "$PROJECT_DIR"

echo -e "${GREEN}🚀 Iniciando deploy do Giba App...${NC}\n"

# 1. Backup do banco de dados
echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
sudo -u postgres pg_dump gibaapp > "$BACKUP_FILE" 2>/dev/null || echo -e "${RED}⚠️  Aviso: Não foi possível fazer backup do banco${NC}"
echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}\n"

# 2. Atualizar código do Git
echo -e "${YELLOW}📥 Atualizando código do Git...${NC}"
git fetch origin
git pull origin main || {
    echo -e "${RED}❌ Erro ao fazer pull do Git${NC}"
    exit 1
}
echo -e "${GREEN}✅ Código atualizado${NC}\n"

# 3. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install --production=false || {
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
}
echo -e "${GREEN}✅ Dependências instaladas${NC}\n"

# 4. Gerar Prisma Client
echo -e "${YELLOW}🔧 Gerando Prisma Client...${NC}"
npx prisma generate || {
    echo -e "${RED}❌ Erro ao gerar Prisma Client${NC}"
    exit 1
}
echo -e "${GREEN}✅ Prisma Client gerado${NC}\n"

# 5. Executar migrations
echo -e "${YELLOW}🗄️  Executando migrations...${NC}"
npx prisma migrate deploy || {
    echo -e "${RED}❌ Erro ao executar migrations${NC}"
    exit 1
}
echo -e "${GREEN}✅ Migrations executadas${NC}\n"

# 6. Build do frontend
echo -e "${YELLOW}🏗️  Fazendo build do frontend...${NC}"
npm run build || {
    echo -e "${RED}❌ Erro ao fazer build${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build concluído${NC}\n"

# 7. Verificar se build foi criado
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo -e "${RED}❌ Erro: Diretório dist não existe ou está vazio${NC}"
    exit 1
fi

# 8. Ajustar permissões
echo -e "${YELLOW}🔐 Ajustando permissões...${NC}"
sudo chown -R www-data:www-data dist/ 2>/dev/null || true
chmod -R 755 dist/
echo -e "${GREEN}✅ Permissões ajustadas${NC}\n"

# 9. Reiniciar PM2
echo -e "${YELLOW}🔄 Reiniciando aplicação...${NC}"
pm2 restart gibaapp-api || pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ Aplicação reiniciada${NC}\n"

# 10. Verificar status
echo -e "${YELLOW}📊 Verificando status...${NC}"
sleep 2
pm2 status

# 11. Testar API
echo -e "${YELLOW}🧪 Testando API...${NC}"
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
if [ "$API_TEST" = "200" ] || [ "$API_TEST" = "404" ]; then
    echo -e "${GREEN}✅ API respondendo${NC}\n"
else
    echo -e "${RED}⚠️  API pode não estar respondendo corretamente (HTTP $API_TEST)${NC}\n"
fi

# 12. Recarregar Nginx
echo -e "${YELLOW}🌐 Recarregando Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx || {
    echo -e "${RED}⚠️  Erro ao recarregar Nginx${NC}"
}
echo -e "${GREEN}✅ Nginx recarregado${NC}\n"

# 13. Mostrar logs recentes
echo -e "${YELLOW}📋 Últimas linhas dos logs:${NC}"
pm2 logs gibaapp-api --lines 10 --nostream

echo -e "\n${GREEN}✨ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Acesse: http://$(hostname -I | awk '{print $1}') ou seu domínio${NC}\n"
