# 🚀 Guia de Deploy - VPS HostGator

Este guia te ajudará a fazer o deploy da aplicação DietYourself em uma VPS da HostGator.

## 📋 Pré-requisitos

1. **VPS da HostGator** com acesso SSH
2. **Node.js 18+** instalado
3. **Acesso root ou sudo** na VPS
4. **Domínio configurado** (opcional, mas recomendado)

## 🔧 Passo 1: Conectar na VPS

Conecte-se via SSH:

```bash
ssh seu_usuario@seu_ip_vps
```

## 📦 Passo 2: Instalar Node.js

### Ubuntu/Debian:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### CentOS/RHEL:

```bash
# Instalar Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 📥 Passo 3: Transferir os arquivos do projeto

### Opção A: Usando Git (Recomendado)

```bash
# Instalar Git (se não estiver instalado)
sudo apt install git -y  # Ubuntu/Debian
# ou
sudo yum install git -y  # CentOS

# Clonar repositório
cd /var/www
sudo mkdir -p dietyourself
sudo chown $USER:$USER dietyourself
cd dietyourself
git clone seu_repositorio.git .
```

### Opção B: Usando SCP (do seu computador local)

```bash
# No seu computador local (Windows PowerShell)
scp -r C:\Users\victo\dietyourself-login seu_usuario@seu_ip_vps:/var/www/
```

### Opção C: Usando SFTP (FileZilla, WinSCP, etc.)

Conecte via SFTP e faça upload dos arquivos para `/var/www/dietyourself`

## 🔐 Passo 4: Configurar Variáveis de Ambiente

```bash
cd /var/www/dietyourself

# Criar arquivo .env
nano .env
```

Configure o arquivo `.env`:

```env
# Database (SQLite funciona, mas PostgreSQL é melhor para produção)
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET="sua_chave_jwt_super_segura_aqui_gerar_nova"

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (ajuste com seu domínio ou IP)
FRONTEND_URL="http://seu-dominio.com"
# ou
FRONTEND_URL="http://seu-ip-vps:5173"

# OpenAI API Key
OPENAI_API_KEY="sua_chave_openai_aqui"
```

**IMPORTANTE:** Gere uma nova JWT_SECRET segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Passo 5: Configurar Banco de Dados

### Opção A: SQLite (Mais simples)

```bash
cd /var/www/dietyourself
npm install
npm run db:generate
npm run db:migrate
```

### Opção B: PostgreSQL (Recomendado para produção)

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Criar usuário e banco
sudo -u postgres psql

# No prompt do PostgreSQL:
CREATE DATABASE dietyourself;
CREATE USER dietyourself_user WITH ENCRYPTED PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE dietyourself TO dietyourself_user;
\q

# Atualizar .env
DATABASE_URL="postgresql://dietyourself_user:sua_senha_segura@localhost:5432/dietyourself?schema=public"
```

## 🏗️ Passo 6: Build do Frontend

```bash
cd /var/www/dietyourself
npm install
npm run build
```

## 🔄 Passo 7: Instalar PM2 (Gerenciador de Processos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

Conteúdo do `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dietyourself-backend',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }, {
    name: 'dietyourself-frontend',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 5173',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

```bash
# Criar pasta de logs
mkdir -p logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração para iniciar automaticamente
pm2 save
pm2 startup
# Execute o comando que aparecer (geralmente algo como: sudo env PATH=...)
```

## 🌐 Passo 8: Configurar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/dietyourself
```

Conteúdo do arquivo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    # ou use apenas IP: server_name seu-ip-vps;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
    }

    # Tamanho máximo de upload (para o questionário)
    client_max_body_size 10M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/dietyourself /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Passo 9: Configurar SSL/HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática (já configurado por padrão)
sudo certbot renew --dry-run
```

## 🔥 Passo 10: Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

## 📝 Passo 11: Atualizar .env para Produção

Atualize o arquivo `.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
# ou para PostgreSQL:
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/dietyourself?schema=public"

JWT_SECRET="sua_chave_jwt_super_segura"
PORT=5000
NODE_ENV=production
FRONTEND_URL="https://seu-dominio.com"
OPENAI_API_KEY="sua_chave_openai"

# N8N Chat Integration (opcional)
N8N_WEBHOOK_URL="https://seu-n8n.com/webhook/seu-webhook-id"
N8N_API_KEY="sua_chave_api_n8n"  # Se necessário
```

## 🎯 Passo 12: Reiniciar Aplicação

```bash
cd /var/www/dietyourself

# Reiniciar PM2
pm2 restart all

# Ver logs
pm2 logs

# Ver status
pm2 status
```

## 🔍 Verificação

1. **Backend:** Acesse `http://seu-ip-ou-dominio/api/health`
2. **Frontend:** Acesse `http://seu-ip-ou-dominio`

## 📚 Comandos Úteis

```bash
# Ver logs do PM2
pm2 logs
pm2 logs dietyourself-backend
pm2 logs dietyourself-frontend

# Reiniciar aplicação
pm2 restart all

# Parar aplicação
pm2 stop all

# Ver status
pm2 status

# Monitorar recursos
pm2 monit

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🆘 Troubleshooting

### Erro: Porta já em uso
```bash
# Verificar processos na porta
sudo lsof -i :5000
sudo lsof -i :5173

# Matar processo
sudo kill -9 PID
```

### Erro: Permissões
```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/www/dietyourself
```

### Erro: Banco de dados
```bash
# Verificar banco
npm run db:studio
# ou para PostgreSQL:
sudo -u postgres psql -d dietyourself
```

### Recarregar configuração do Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Atualizações Futuras

```bash
cd /var/www/dietyourself

# Atualizar código (se usar Git)
git pull

# Instalar novas dependências
npm install

# Gerar Prisma Client (se schema mudou)
npm run db:generate

# Build do frontend (se mudou)
npm run build

# Reiniciar
pm2 restart all
```

---

## ⚠️ Notas Importantes

1. **Segurança:**
   - Use senhas fortes
   - Mantenha o sistema atualizado: `sudo apt update && sudo apt upgrade`
   - Configure firewall corretamente
   - Use HTTPS em produção

2. **Backup:**
   - Faça backup regular do banco de dados
   - Backup do arquivo `.env` (sem commit no Git!)
   - Backup dos arquivos da aplicação

3. **Monitoramento:**
   - Configure logs adequados
   - Monitore uso de recursos (CPU, RAM, disco)
   - Configure alertas

4. **Performance:**
   - Considere usar PostgreSQL em produção (mais robusto que SQLite)
   - Configure cache se necessário
   - Otimize imagens e assets

