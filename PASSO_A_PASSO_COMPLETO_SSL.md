# 🔐 Passo a Passo Completo - Configurar SSL e PWA

## 📋 Pré-requisitos

- ✅ Domínio: `identikdigital.com.br`
- ✅ DNS apontando para: `69.6.215.140`
- ✅ Nginx instalado
- ✅ Certbot instalado

---

## 🔧 PASSO 1: Fazer Backup

```bash
sudo cp /etc/nginx/conf.d/dietyourself.conf /etc/nginx/conf.d/dietyourself.conf.backup
```

---

## 📝 PASSO 2: Copiar Configuração do Nginx

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Delete TODO o conteúdo e cole o arquivo `dietyourself.conf` completo que acabei de criar.**

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## ✅ PASSO 3: Testar Configuração do Nginx

```bash
sudo nginx -t
```

**Deve mostrar:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

---

## 🛑 PASSO 4: Parar Traefik

```bash
# Ver containers Traefik
sudo docker ps | grep traefik

# Parar todos os containers Traefik
sudo docker stop $(sudo docker ps -q --filter ancestor=traefik)

# Verificar se porta 80 está livre
sudo ss -tlnp | grep :80
# Não deve mostrar nada
```

---

## 🔐 PASSO 5: Obter Certificado SSL

```bash
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

**Durante a execução:**
- Email: `victorhugoceccon@gmail.com`
- Digite `A` para aceitar termos
- Digite `Y` ou `N` para compartilhar email (sua escolha)

**✅ Se funcionar, você verá:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem
```

---

## 📝 PASSO 6: Configurar Nginx com HTTPS

Agora vamos descomentar e configurar os blocos HTTP e HTTPS:

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Substitua TODO o conteúdo por este (com HTTPS configurado):**

```nginx
# Configuração Nginx Completa - DietYourself
# Arquivo: /etc/nginx/conf.d/dietyourself.conf

# ============================================
# SERVIDOR HTTP - PORTA 80
# Redireciona para HTTPS
# ============================================
server {
    listen 80;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Redirecionar tudo para HTTPS
    return 301 https://$server_name$request_uri;
}

# ============================================
# SERVIDOR HTTPS - PORTA 443
# Configuração principal com SSL
# ============================================
server {
    listen 443 ssl http2;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/identikdigital.com.br/privkey.pem;

    # Configuração SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend build
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # ============================================
    # CONFIGURAÇÕES PWA
    # ============================================

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

    # ============================================
    # FRONTEND - SPA
    # ============================================
    location / {
        try_files $uri $uri/ /index.html;

        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Assets estáticos - cache longo
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

    # ============================================
    # BACKEND API
    # ============================================

    # Proxy para a API Node (backend na porta 5000)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts aumentados para requisições longas
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;

        # Buffer settings
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

        # Timeouts muito aumentados (15 minutos)
        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;

        # Desabilitar buffering
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_set_header Connection "";
    }

    # ============================================
    # CONFIGURAÇÕES GERAIS
    # ============================================

    # Tamanho máximo de upload
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types 
        text/plain 
        text/css 
        text/xml 
        text/javascript 
        application/x-javascript 
        application/xml+rss 
        application/json 
        application/javascript 
        application/xml
        image/svg+xml;
}

# ============================================
# SERVIDOR PORTA 8082 (Mantido para compatibilidade)
# ============================================
server {
    listen 8082;
    server_name 69.6.215.140;

    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA)
    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        add_header Service-Worker-Allowed "/";
    }

    # Manifest
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
        add_header Cache-Control "no-cache";
    }

    # Ícones
    location /icons/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend - SPA
    location / {
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

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

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## ✅ PASSO 7: Testar e Recarregar Nginx

```bash
# Testar configuração
sudo nginx -t

# Se estiver OK, recarregar
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

---

## 🧪 PASSO 8: Testar HTTPS

```bash
# Testar HTTPS
curl -I https://identikdigital.com.br

# Testar redirecionamento HTTP -> HTTPS
curl -I http://identikdigital.com.br
# Deve retornar: HTTP/1.1 301 Moved Permanently

# Testar PWA
curl -I https://identikdigital.com.br/sw.js
curl -I https://identikdigital.com.br/manifest.json
```

---

## 📱 PASSO 9: Testar PWA no Navegador

1. **Acesse:** `https://identikdigital.com.br`
2. **Abra DevTools (F12):**
   - Aba **Application** → **Service Workers** (deve mostrar registrado)
   - Aba **Application** → **Manifest** (deve mostrar informações)
3. **Testar instalação:**
   - Chrome/Edge: Ícone de instalação na barra de endereços
   - Menu → "Instalar aplicativo"

---

## 🔄 PASSO 10: Configurar Renovação Automática

O Certbot já configura renovação automática, mas você pode testar:

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates
```

---

## ✅ Checklist Final

- [ ] Backup feito
- [ ] Configuração do Nginx copiada
- [ ] Nginx testado (`nginx -t`)
- [ ] Traefik parado
- [ ] Certificado SSL obtido
- [ ] Nginx configurado com HTTPS
- [ ] Nginx recarregado
- [ ] HTTPS testado
- [ ] PWA testado no navegador
- [ ] Renovação automática configurada

---

## 🎯 Comandos Rápidos (Sequência Completa)

```bash
# 1. Backup
sudo cp /etc/nginx/conf.d/dietyourself.conf /etc/nginx/conf.d/dietyourself.conf.backup

# 2. Editar Nginx (copiar arquivo dietyourself.conf)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 3. Testar
sudo nginx -t

# 4. Parar Traefik
sudo docker stop $(sudo docker ps -q --filter ancestor=traefik)

# 5. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 6. Editar Nginx novamente (copiar configuração HTTPS completa)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 7. Testar e recarregar
sudo nginx -t && sudo systemctl reload nginx

# 8. Testar HTTPS
curl -I https://identikdigital.com.br
```

---

**✨ Após seguir todos os passos, seu PWA estará funcionando com HTTPS em identikdigital.com.br!**
