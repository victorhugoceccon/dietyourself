# 🚀 Guia Completo de Deploy para VPS via Git

Este guia detalha todos os passos para fazer deploy do projeto DietYourself em uma VPS usando Git.

---

## 📋 Índice

1. [Preparar Repositório Git](#1-preparar-repositório-git)
2. [Configurar VPS](#2-configurar-vps)
3. [Clonar e Configurar Projeto](#3-clonar-e-configurar-projeto)
4. [Configurar PM2](#4-configurar-pm2)
5. [Configurar Nginx](#5-configurar-nginx)
6. [Configurar SSL](#6-configurar-ssl)
7. [Script de Deploy Automatizado](#7-script-de-deploy-automatizado)
8. [Comandos Úteis](#8-comandos-úteis)

---

## 1. Preparar Repositório Git

### 1.1. Verificar status do Git

```bash
cd C:\Users\victo\dietyourself-login
git status
```

Se não estiver inicializado:

```bash
git init
```

### 1.2. Verificar .gitignore

Certifique-se de que o `.gitignore` está completo (já existe no projeto).

### 1.3. Criar arquivo .env.example

Crie um arquivo `.env.example` com todas as variáveis (sem valores sensíveis):

```env
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/dietyourself_db

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://seudominio.com

# N8N
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/getDiet
N8N_API_KEY=sua_api_key_n8n

# OpenAI (opcional)
OPENAI_API_KEY=sua_openai_api_key
```

### 1.4. Adicionar e commitar

```bash
git add .
git commit -m "Preparação para deploy VPS"
```

### 1.5. Criar repositório remoto

**No GitHub/GitLab/Bitbucket:**

1. Crie um novo repositório (ex: `dietyourself-login`)
2. Não inicialize com README, .gitignore ou licença

**No terminal local:**

```bash
# Adicionar remote (substitua pela URL do seu repositório)
git remote add origin https://github.com/seu-usuario/dietyourself-login.git

# Ou se usar SSH:
git remote add origin git@github.com:seu-usuario/dietyourself-login.git

# Fazer push
git branch -M main
git push -u origin main
```

---

## 2. Configurar VPS

### 2.1. Conectar via SSH

```bash
ssh usuario@ip_da_vps
# ou
ssh usuario@seudominio.com
```

### 2.2. Atualizar sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3. Instalar Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Deve mostrar v18.x ou superior
npm --version
```

### 2.4. Instalar PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql
```

**No prompt do PostgreSQL:**

```sql
CREATE USER dietyourself_user WITH PASSWORD 'sua_senha_segura_aqui';
CREATE DATABASE dietyourself_db OWNER dietyourself_user;
GRANT ALL PRIVILEGES ON DATABASE dietyourself_db TO dietyourself_user;
\q
```

### 2.5. Instalar Git

```bash
sudo apt install git -y
```

### 2.6. Instalar PM2

```bash
sudo npm install -g pm2
```

### 2.7. Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 3. Clonar e Configurar Projeto

### 3.1. Criar diretório

```bash
mkdir -p ~/projetos
cd ~/projetos
```

### 3.2. Clonar repositório

```bash
git clone https://github.com/seu-usuario/dietyourself-login.git
cd dietyourself-login
```

### 3.3. Instalar dependências

```bash
npm install
npx prisma generate
```

### 3.4. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

**Configure todas as variáveis:**

```env
DATABASE_URL=postgresql://dietyourself_user:sua_senha_segura@localhost:5432/dietyourself_db
JWT_SECRET=gerar_string_aleatoria_muito_longa_aqui
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://seudominio.com
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/getDiet
N8N_API_KEY=sua_api_key_n8n
OPENAI_API_KEY=sua_openai_api_key
```

**Gerar JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.5. Executar migrações

```bash
npx prisma migrate deploy
```

### 3.6. Build do frontend

```bash
npm run build
```

---

## 4. Configurar PM2

### 4.1. Criar arquivo ecosystem.config.js

O arquivo já existe no projeto. Verifique se está correto:

```javascript
module.exports = {
  apps: [{
    name: 'dietyourself-api',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

### 4.2. Criar diretório de logs

```bash
mkdir -p logs
```

### 4.3. Iniciar com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Execute o comando que o `pm2 startup` mostrará (será algo como):**

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu_usuario --hp /home/seu_usuario
```

### 4.4. Verificar

```bash
pm2 status
pm2 logs dietyourself-api
```

---

## 5. Configurar Nginx

### 5.1. Criar configuração

```bash
sudo nano /etc/nginx/sites-available/dietyourself
```

**Conteúdo:**

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # Certificados SSL (serão configurados com Certbot)
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Tamanho máximo de upload (para fotos em base64)
    client_max_body_size 10M;

    # Proxy para API Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
    }

    # Servir arquivos estáticos do frontend
    location / {
        root /home/usuario/projetos/dietyourself-login/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**⚠️ IMPORTANTE:** Substitua:
- `seudominio.com` pelo seu domínio
- `/home/usuario/projetos/dietyourself-login/dist` pelo caminho correto do seu projeto

### 5.2. Ativar configuração

```bash
sudo ln -s /etc/nginx/sites-available/dietyourself /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Configurar SSL

### 6.1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2. Obter certificado

```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

Siga as instruções. O Certbot configurará automaticamente o Nginx.

### 6.3. Verificar renovação automática

```bash
sudo certbot renew --dry-run
```

---

## 7. Script de Deploy Automatizado

### 7.1. Criar script deploy.sh

```bash
nano ~/projetos/dietyourself-login/deploy.sh
```

**Conteúdo:**

```bash
#!/bin/bash

echo "🚀 Iniciando deploy..."

# Ir para o diretório do projeto
cd ~/projetos/dietyourself-login

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
```

### 7.2. Tornar executável

```bash
chmod +x deploy.sh
```

### 7.3. Usar

```bash
./deploy.sh
```

---

## 8. Comandos Úteis

### Ver logs

```bash
# PM2
pm2 logs dietyourself-api
pm2 logs --lines 100

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Gerenciar aplicação

```bash
# Status
pm2 status

# Reiniciar
pm2 restart dietyourself-api

# Parar
pm2 stop dietyourself-api

# Iniciar
pm2 start dietyourself-api

# Monitorar
pm2 monit

# Ver informações detalhadas
pm2 info dietyourself-api
```

### Gerenciar serviços

```bash
# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# PostgreSQL
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### Atualizar código manualmente

```bash
cd ~/projetos/dietyourself-login
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart dietyourself-api
```

### Verificar portas

```bash
# Ver processos nas portas
sudo lsof -i :5000
sudo lsof -i :80
sudo lsof -i :443

# Verificar firewall
sudo ufw status
```

---

## 🔒 Segurança

### Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
sudo ufw status
```

### Atualizar sistema regularmente

```bash
sudo apt update && sudo apt upgrade -y
```

---

## ✅ Checklist de Deploy

- [ ] Repositório Git criado e código enviado
- [ ] VPS configurada (Node.js, PostgreSQL, PM2, Nginx)
- [ ] Projeto clonado na VPS
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Migrações do banco executadas
- [ ] Build do frontend realizado
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado como reverse proxy
- [ ] SSL configurado com Let's Encrypt
- [ ] Firewall configurado
- [ ] Aplicação acessível via domínio
- [ ] Script de deploy criado e testado

---

## 🆘 Troubleshooting

### Erro 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
pm2 status

# Ver logs
pm2 logs dietyourself-api

# Verificar se a porta está correta
sudo lsof -i :5000
```

### Erro de conexão com banco

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão
psql -U dietyourself_user -d dietyourself_db -h localhost

# Verificar DATABASE_URL no .env
cat .env | grep DATABASE_URL
```

### Erro de permissões

```bash
# Ajustar permissões
sudo chown -R $USER:$USER ~/projetos/dietyourself-login
sudo chown -R www-data:www-data ~/projetos/dietyourself-login/dist
```

### Erro ao fazer build

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📞 Próximos Passos

Após o deploy bem-sucedido:

1. Teste todas as funcionalidades
2. Configure backups do banco de dados
3. Configure monitoramento (opcional)
4. Configure alertas (opcional)

---

**Boa sorte com o deploy! 🚀**
