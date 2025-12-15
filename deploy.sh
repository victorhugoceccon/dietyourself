#!/bin/bash

# Script de deploy automatizado para VPS
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do DietYourself..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

# Gerar Prisma Client
echo -e "${YELLOW}🔧 Gerando Prisma Client...${NC}"
npm run db:generate

# Build do frontend
echo -e "${YELLOW}🏗️  Fazendo build do frontend...${NC}"
npm run build

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando PM2...${NC}"
    sudo npm install -g pm2
fi

# Criar pasta de logs
mkdir -p logs

# Parar processos antigos (se existirem)
echo -e "${YELLOW}🛑 Parando processos antigos...${NC}"
pm2 delete dietyourself-backend 2>/dev/null || true
pm2 delete dietyourself-frontend 2>/dev/null || true

# Iniciar aplicação
echo -e "${YELLOW}▶️  Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📊 Status da aplicação:"
pm2 status
echo ""
echo "📝 Para ver os logs:"
echo "   pm2 logs"
echo ""
echo "🔄 Para reiniciar:"
echo "   pm2 restart all"

