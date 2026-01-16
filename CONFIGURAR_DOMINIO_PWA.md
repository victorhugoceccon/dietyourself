# 🌐 Configurar Domínio identikdigital.com.br para PWA

## 📋 Pré-requisitos

- ✅ Domínio: `identikdigital.com.br`
- ✅ DNS apontando para o IP da VPS: `69.6.215.140`
- ✅ Nginx instalado e funcionando

## 🔧 Passo 1: Verificar DNS

Antes de configurar SSL, verifique se o DNS está apontando corretamente:

```bash
# Verificar se o domínio aponta para o IP correto
dig identikdigital.com.br +short
# Deve retornar: 69.6.215.140

# OU
nslookup identikdigital.com.br
# Deve mostrar o IP: 69.6.215.140
```

**Se não estiver apontando:**
- Acesse o painel do seu provedor de domínio
- Configure um registro **A** apontando `identikdigital.com.br` para `69.6.215.140`
- Aguarde a propagação (pode levar até 24h, geralmente alguns minutos)

## 🔒 Passo 2: Instalar Certbot (Let's Encrypt)

```bash
# Atualizar sistema
sudo apt update

# Instalar Certbot e plugin do Nginx
sudo apt install certbot python3-certbot-nginx -y
```

## 📝 Passo 3: Atualizar Configuração do Nginx

Edite o arquivo de configuração para usar o domínio:

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Substitua o conteúdo por:**

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name identikdigital.com.br www.identikdigital.com.br;
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Certificados SSL (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/identikdigital.com.br/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend build
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA) - SEM CACHE
    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Service-Worker-Allowed "/";
    }

    # Manifest JSON (PWA)
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
        add_header Cache-Control "no-cache";
    }

    # Ícones PWA
    location /icons/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend - SPA
    location / {
        try_files $uri $uri/ /index.html;

        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Assets - cache longo
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Não cachear HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate";
        }
    }

    # Proxy para a API Node
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;

        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Timeout específico para geração de dieta
    location /api/diet/generate {
        proxy_pass http://127.0.0.1:8081/api/diet/generate;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;

        proxy_buffering off;
        proxy_request_buffering off;
        proxy_set_header Connection "";
    }

    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔐 Passo 4: Obter Certificado SSL

```bash
# Testar configuração antes
sudo nginx -t

# Obter certificado SSL (Certbot vai configurar automaticamente)
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```

**Durante a execução, o Certbot vai perguntar:**
1. **Email:** Digite seu email (para notificações de renovação)
2. **Termos de serviço:** Digite `A` para aceitar
3. **Compartilhar email:** Digite `N` (não compartilhar)
4. **Redirecionar HTTP para HTTPS:** Digite `2` (redirecionar)

O Certbot vai:
- ✅ Obter o certificado SSL
- ✅ Configurar automaticamente o Nginx
- ✅ Configurar renovação automática

## ✅ Passo 5: Verificar se Funcionou

```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx

# Testar HTTPS
curl -I https://identikdigital.com.br
```

## 🧪 Passo 6: Testar PWA

### No Navegador:

1. **Acesse:** `https://identikdigital.com.br`
2. **Abra DevTools (F12):**
   - Aba **Application** → **Service Workers**
   - Deve mostrar o service worker registrado
   - Aba **Application** → **Manifest**
   - Deve mostrar as informações do PWA
3. **Testar instalação:**
   - Chrome/Edge: Ícone de instalação na barra de endereços
   - Menu → "Instalar aplicativo"

### Via Terminal:

```bash
# Testar service worker
curl -I https://identikdigital.com.br/sw.js

# Testar manifest
curl -I https://identikdigital.com.br/manifest.json

# Testar ícone
curl -I https://identikdigital.com.br/icons/icon-192x192.png
```

Todos devem retornar **HTTP 200**.

## 🔄 Passo 7: Configurar Renovação Automática

O Certbot já configura renovação automática, mas você pode testar:

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates
```

## 📱 Testar no Mobile

### Android (Chrome):
1. Abra `https://identikdigital.com.br`
2. Menu (3 pontos) → "Adicionar à tela inicial" ou "Instalar app"
3. Confirme a instalação

### iOS (Safari):
1. Abra `https://identikdigital.com.br`
2. Botão de compartilhar → "Adicionar à Tela de Início"
3. Confirme

## 🐛 Troubleshooting

### Erro: "Failed to obtain certificate"

**Causas possíveis:**
- DNS não está apontando corretamente
- Porta 80 bloqueada no firewall
- Domínio já tem certificado em outro servidor

**Solução:**
```bash
# Verificar DNS
dig identikdigital.com.br +short

# Verificar firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Tentar novamente
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```

### Erro: "Connection refused"

**Verificar:**
```bash
# Verificar se Nginx está rodando
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### Service Worker não registra

**Verificar:**
1. Está usando HTTPS? (obrigatório)
2. O arquivo `sw.js` existe em `dist/`?
3. O Nginx está servindo corretamente?

```bash
# Verificar arquivo
ls -la /opt/dietyourself/dietyourself/dist/sw.js

# Testar acesso
curl https://identikdigital.com.br/sw.js
```

## ✅ Checklist Final

- [ ] DNS apontando para `69.6.215.140`
- [ ] Certbot instalado
- [ ] Nginx configurado com domínio
- [ ] Certificado SSL obtido
- [ ] HTTPS funcionando
- [ ] Service Worker acessível
- [ ] Manifest acessível
- [ ] Ícones acessíveis
- [ ] PWA testado no navegador
- [ ] PWA testado no mobile

## 🎯 Comandos Rápidos (Sequência Completa)

```bash
# 1. Verificar DNS
dig identikdigital.com.br +short

# 2. Instalar Certbot
sudo apt update && sudo apt install certbot python3-certbot-nginx -y

# 3. Editar Nginx
sudo nano /etc/nginx/conf.d/dietyourself.conf
# (Cole a configuração acima)

# 4. Testar Nginx
sudo nginx -t

# 5. Obter certificado
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br

# 6. Testar HTTPS
curl -I https://identikdigital.com.br

# 7. Testar PWA
curl -I https://identikdigital.com.br/sw.js
```

---

**✨ Após seguir estes passos, seu PWA estará funcionando com HTTPS em identikdigital.com.br!**
