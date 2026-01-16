# 🔐 Obter Certificado SSL - Método Standalone

## ❌ Problema

O Certbot não consegue validar via Nginx. Vamos usar o método **standalone**, que é mais confiável.

## ✅ Solução: Certbot Standalone

### **Passo 1: Parar Nginx temporariamente**

```bash
sudo systemctl stop nginx
```

### **Passo 2: Verificar se a porta 80 está livre**

```bash
sudo netstat -tlnp | grep :80
# Não deve mostrar nada (porta livre)
```

### **Passo 3: Obter certificado em modo standalone**

```bash
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

**Durante a execução:**
- Digite seu email: `victorhugoceccon@gmail.com`
- Digite `A` para aceitar termos
- Digite `Y` ou `N` para compartilhar email (sua escolha)

### **Passo 4: Reiniciar Nginx**

```bash
sudo systemctl start nginx
```

### **Passo 5: Configurar Nginx manualmente com os certificados**

Agora que temos os certificados, vamos adicionar a configuração HTTPS:

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Adicione este bloco ANTES do bloco da porta 8082:**

```nginx
# ============================================
# SERVIDOR HTTPS - PORTA 443
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

    # Frontend
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA)
    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
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
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    location /api/diet/generate {
        proxy_pass http://127.0.0.1:8081/api/diet/generate;
        proxy_set_header Host $host;
        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;
        proxy_buffering off;
    }

    client_max_body_size 20M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
```

### **Passo 6: Atualizar bloco HTTP para redirecionar para HTTPS**

**No bloco HTTP (porta 80), substitua o conteúdo por:**

```nginx
server {
    listen 80;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Redirecionar tudo para HTTPS
    return 301 https://$server_name$request_uri;
}
```

### **Passo 7: Testar e recarregar**

```bash
# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

### **Passo 8: Testar HTTPS**

```bash
# Testar HTTPS
curl -I https://identikdigital.com.br

# Testar redirecionamento HTTP -> HTTPS
curl -I http://identikdigital.com.br
# Deve retornar: HTTP/1.1 301 Moved Permanently
```

## 🎯 Sequência Completa (Copiar e Colar)

```bash
# 1. Parar Nginx
sudo systemctl stop nginx

# 2. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 3. Reiniciar Nginx
sudo systemctl start nginx

# 4. Editar Nginx para adicionar HTTPS
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 5. Testar
sudo nginx -t

# 6. Recarregar
sudo systemctl reload nginx

# 7. Testar HTTPS
curl -I https://identikdigital.com.br
```

## ✅ Verificar Certificados

```bash
# Ver certificados instalados
sudo certbot certificates

# Ver conteúdo do certificado
sudo cat /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem
```

## 🔄 Renovação Automática

O Certbot já configura renovação automática, mas você pode testar:

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

---

**✨ Após seguir estes passos, você terá HTTPS funcionando!**
