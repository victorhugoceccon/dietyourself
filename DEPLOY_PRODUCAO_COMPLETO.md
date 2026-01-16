# 🚀 Guia Completo - Deploy em Produção (VPS)

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Setup Inicial da VPS](#setup-inicial-da-vps)
3. [Instalação de Dependências](#instalação-de-dependências)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Deploy do Código](#deploy-do-código)
6. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
7. [Build e Inicialização](#build-e-inicialização)
8. [Configuração do Nginx](#configuração-do-nginx)
9. [SSL/HTTPS com Let's Encrypt](#sslhttps-com-lets-encrypt)
10. [PM2 e Monitoramento](#pm2-e-monitoramento)
11. [Manutenção e Atualizações](#manutenção-e-atualizações)

---

## 📦 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Acesso SSH (root ou usuário com sudo)
- Domínio apontando para o IP da VPS (opcional, mas recomendado)
- Git configurado

---

## 🖥️ Setup Inicial da VPS

### 1. Conectar na VPS
```bash
ssh root@SEU_IP_VPS
# ou
ssh usuario@SEU_IP_VPS
```

### 2. Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Criar usuário para o app (recomendado)
```bash
# Criar usuário
sudo adduser gibaapp
# Adicionar ao grupo sudo
sudo usermod -aG sudo gibaapp
# Trocar para o usuário
su - gibaapp
```

---

## 🔧 Instalação de Dependências

### 1. Node.js (v18 ou superior)
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v18.x.x ou superior
npm --version
```

### 2. PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 3. Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar e habilitar
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 4. PM2 (Gerenciador de Processos)
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup systemd
# Execute o comando que aparecer (algo como: sudo env PATH=...)
```

### 5. Git
```bash
# Instalar Git (se não estiver instalado)
sudo apt install -y git
```

### 6. Ferramentas adicionais
```bash
# Build essentials (para compilar módulos nativos)
sudo apt install -y build-essential

# Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar banco de dados e usuário
```bash
# Entrar no PostgreSQL como postgres
sudo -u postgres psql

# No prompt do PostgreSQL, execute:
CREATE DATABASE gibaapp;
CREATE USER gibaapp_user WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE gibaapp TO gibaapp_user;
ALTER USER gibaapp_user CREATEDB;
\q
```

### 2. Testar conexão
```bash
# Testar se o usuário consegue conectar
sudo -u postgres psql -U gibaapp_user -d gibaapp -h localhost
# Digite a senha quando solicitado
# Se conectar, digite \q para sair
```

---

## 📥 Deploy do Código

### 1. Criar diretório do projeto
```bash
# Criar diretório
sudo mkdir -p /var/www/gibaapp
sudo chown -R $USER:$USER /var/www/gibaapp
cd /var/www/gibaapp
```

### 2. Clonar repositório
```bash
# Se usar Git
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .

# OU fazer upload via SCP do seu computador local:
# scp -r /caminho/local/projeto/* usuario@IP_VPS:/var/www/gibaapp/
```

### 3. Instalar dependências
```bash
cd /var/www/gibaapp
npm install --production=false
```

### 4. Gerar Prisma Client
```bash
npx prisma generate
```

---

## 🔐 Configuração de Variáveis de Ambiente

### 1. Criar arquivo .env
```bash
cd /var/www/gibaapp
nano .env
```

### 2. Conteúdo do .env (ajuste conforme necessário)
```env
# Ambiente
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.com

# Banco de Dados
DATABASE_URL="postgresql://gibaapp_user:SUA_SENHA_AQUI@localhost:5432/gibaapp?schema=public"

# JWT
JWT_SECRET=SUA_CHAVE_SECRETA_MUITO_FORTE_AQUI_USE_ALGO_ALEATORIO
JWT_EXPIRES_IN=7d

# N8N Webhooks (se usar)
N8N_DIET_WEBHOOK_URL=https://seu-n8n.com/webhook/getDiet
N8N_WORKOUT_WEBHOOK_URL=https://seu-n8n.com/webhook/getExercises
N8N_API_KEY=SUA_API_KEY_N8N

# Email (se usar)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
EMAIL_FROM=noreply@gibaapp.com

# AbacatePay (se usar)
ABACATEPAY_API_KEY=sua-chave-api
ABACATEPAY_ENABLED=true

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI (se usar)
OPENAI_API_KEY=sk-...

# Google Maps (se usar)
GOOGLE_MAPS_API_KEY=sua-chave-google-maps
```

### 3. Proteger arquivo .env
```bash
chmod 600 .env
```

---

## 🏗️ Build e Inicialização

### 1. Executar migrations do Prisma
```bash
cd /var/www/gibaapp
npx prisma migrate deploy
```

### 2. Seed do banco (opcional)
```bash
npm run db:seed
```

### 3. Build do frontend
```bash
npm run build
```

### 4. Verificar se o build foi criado
```bash
ls -la dist/
# Deve mostrar index.html, assets/, etc.
```

---

## ⚙️ Configuração do PM2

### 1. Atualizar ecosystem.config.js
```bash
nano ecosystem.config.js
```

Conteúdo atualizado:
```javascript
module.exports = {
  apps: [{
    name: 'gibaapp-api',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
}
```

### 2. Criar diretório de logs
```bash
mkdir -p logs
```

### 3. Iniciar aplicação com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 4. Verificar status
```bash
pm2 status
pm2 logs gibaapp-api --lines 50
```

---

## 🌐 Configuração do Nginx

### 1. Criar configuração do site
```bash
sudo nano /etc/nginx/sites-available/gibaapp
```

### 2. Conteúdo da configuração (PRODUÇÃO - serve build estático)
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    # Se não tiver domínio, use: server_name SEU_IP_VPS;

    # Logs
    access_log /var/log/nginx/gibaapp-access.log;
    error_log /var/log/nginx/gibaapp-error.log;

    # Frontend - Serve build estático
    location / {
        root /var/www/gibaapp/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # Cache de assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Service Worker e Manifest (PWA)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webmanifest|json)$ {
        root /var/www/gibaapp/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Tamanho máximo de upload (fotos, etc)
    client_max_body_size 20M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript 
               image/svg+xml;
}
```

### 3. Habilitar site
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/gibaapp /etc/nginx/sites-enabled/

# Remover default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS com Let's Encrypt

### 1. Obter certificado SSL (se tiver domínio)
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 2. Renovação automática
```bash
# Verificar se o timer está ativo
sudo systemctl status certbot.timer

# Testar renovação
sudo certbot renew --dry-run
```

### 3. Atualizar .env com HTTPS
```bash
nano .env
# Altere FRONTEND_URL para https://seu-dominio.com
```

### 4. Reiniciar aplicação
```bash
pm2 restart all
```

---

## 📊 PM2 e Monitoramento

### Comandos úteis do PM2
```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs gibaapp-api

# Ver logs das últimas 100 linhas
pm2 logs gibaapp-api --lines 100

# Reiniciar
pm2 restart gibaapp-api

# Parar
pm2 stop gibaapp-api

# Deletar
pm2 delete gibaapp-api

# Monitoramento
pm2 monit

# Salvar configuração atual
pm2 save
```

### Configurar logs rotativos
```bash
# Instalar pm2-logrotate
pm2 install pm2-logrotate

# Configurar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 🔄 Manutenção e Atualizações

### Script de atualização rápida
Crie um arquivo `deploy.sh`:
```bash
#!/bin/bash
cd /var/www/gibaapp
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart gibaapp-api
echo "✅ Deploy concluído!"
```

Tornar executável:
```bash
chmod +x deploy.sh
```

Uso:
```bash
./deploy.sh
```

### Checklist de atualização
```bash
# 1. Backup do banco (IMPORTANTE!)
sudo -u postgres pg_dump gibaapp > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Atualizar código
cd /var/www/gibaapp
git pull origin main

# 3. Instalar dependências
npm install

# 4. Atualizar Prisma
npx prisma generate
npx prisma migrate deploy

# 5. Build frontend
npm run build

# 6. Reiniciar
pm2 restart gibaapp-api

# 7. Verificar logs
pm2 logs gibaapp-api --lines 50
```

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Ver logs detalhados
pm2 logs gibaapp-api --lines 100

# Verificar variáveis de ambiente
pm2 env 0

# Verificar porta
sudo lsof -i :5000

# Testar conexão do banco
npx prisma db pull
```

### Frontend não carrega
```bash
# Verificar se build existe
ls -la /var/www/gibaapp/dist/

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/gibaapp-error.log

# Verificar permissões
sudo chown -R www-data:www-data /var/www/gibaapp/dist
```

### Erro de permissão no banco
```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE gibaapp TO gibaapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gibaapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gibaapp_user;
\q
```

### Nginx não inicia
```bash
# Testar configuração
sudo nginx -t

# Ver erros
sudo journalctl -u nginx -n 50
```

---

## 📝 Checklist Final

- [ ] Node.js instalado (v18+)
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados criado
- [ ] Nginx instalado e configurado
- [ ] PM2 instalado e configurado
- [ ] Código clonado/uploadado
- [ ] Dependências instaladas (`npm install`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Migrations executadas (`npx prisma migrate deploy`)
- [ ] Arquivo `.env` configurado
- [ ] Build criado (`npm run build`)
- [ ] PM2 rodando (`pm2 status`)
- [ ] Nginx servindo o site
- [ ] SSL configurado (se tiver domínio)
- [ ] Teste de login funcionando
- [ ] Logs sendo gerados corretamente

---

## 🚀 Comandos Rápidos

```bash
# Status completo
pm2 status && sudo systemctl status nginx && sudo systemctl status postgresql

# Logs completos
pm2 logs --lines 50 && sudo tail -20 /var/log/nginx/gibaapp-error.log

# Reiniciar tudo
pm2 restart all && sudo systemctl reload nginx

# Backup rápido do banco
sudo -u postgres pg_dump gibaapp > backup_$(date +%Y%m%d).sql
```

---

**✨ Pronto! Sua aplicação está em produção!**

Para acessar: `http://SEU_IP` ou `https://seu-dominio.com`
