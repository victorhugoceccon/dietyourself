#!/bin/bash

echo "🚀 Iniciando deploy..."

# Ir para o diretório do projeto
cd "$(dirname "$0")"

# Atualizar código
echo "📥 Atualizando código do Git..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# Executar migrações
echo "🗄️ Executando migrações..."
npx prisma migrate deploy

# Build do frontend
echo "🏗️ Fazendo build do frontend..."
npm run build

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
pm2 restart dietyourself-api

echo "✅ Deploy concluído!"
pm2 status
