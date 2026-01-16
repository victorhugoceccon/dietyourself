# ⚡ Deploy Rápido - Comandos Essenciais

## 🚀 Setup Inicial (Primeira vez)

```bash
# 1. Conectar na VPS
ssh usuario@SEU_IP_VPS

# 2. Instalar dependências
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx git build-essential
sudo npm install -g pm2

# 3. Criar banco de dados
sudo -u postgres psql
# No PostgreSQL:
CREATE DATABASE gibaapp;
CREATE USER gibaapp_user WITH ENCRYPTED PASSWORD 'senha_forte';
GRANT ALL PRIVILEGES ON DATABASE gibaapp TO gibaapp_user;
ALTER USER gibaapp_user CREATEDB;
\q

# 4. Clonar projeto
sudo mkdir -p /var/www/gibaapp
sudo chown -R $USER:$USER /var/www/gibaapp
cd /var/www/gibaapp
git clone SEU_REPOSITORIO .

# 5. Configurar .env
cp .env.example .env
nano .env
# Preencha todas as variáveis

# 6. Instalar e buildar
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# 7. Configurar Nginx
sudo cp nginx-producao.conf /etc/nginx/sites-available/gibaapp
sudo nano /etc/nginx/sites-available/gibaapp
# Ajuste server_name e caminhos
sudo ln -s /etc/nginx/sites-available/gibaapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Iniciar com PM2
chmod +x deploy-producao.sh
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Execute o comando que aparecer

# 9. SSL (se tiver domínio)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 🔄 Atualização (Deploy)

```bash
# Opção 1: Script automatizado
cd /var/www/gibaapp
./deploy-producao.sh

# Opção 2: Manual
cd /var/www/gibaapp
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart gibaapp-api
```

## 📊 Comandos Úteis

```bash
# Status
pm2 status
pm2 logs gibaapp-api --lines 50

# Reiniciar
pm2 restart gibaapp-api

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/gibaapp-error.log

# Banco de dados
sudo -u postgres psql -d gibaapp
sudo -u postgres pg_dump gibaapp > backup.sql

# Verificar portas
sudo lsof -i :5000
sudo lsof -i :80
```

## 🐛 Troubleshooting Rápido

```bash
# Backend não inicia
pm2 logs gibaapp-api --lines 100
pm2 restart gibaapp-api

# Frontend não carrega
ls -la dist/
sudo tail -f /var/log/nginx/gibaapp-error.log

# Erro de banco
npx prisma migrate deploy
npx prisma generate

# Limpar tudo e recomeçar
pm2 delete all
rm -rf node_modules dist
npm install
npm run build
pm2 start ecosystem.config.js
```

## ✅ Checklist Pós-Deploy

- [ ] API responde: `curl http://localhost:5000/api/health`
- [ ] Frontend carrega no navegador
- [ ] Login funciona
- [ ] PM2 rodando: `pm2 status`
- [ ] Nginx rodando: `sudo systemctl status nginx`
- [ ] SSL configurado (se tiver domínio)
- [ ] Logs sem erros: `pm2 logs`

---

**📖 Para guia completo, veja: `DEPLOY_PRODUCAO_COMPLETO.md`**
