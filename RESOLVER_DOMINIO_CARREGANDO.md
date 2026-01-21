# 🔧 Resolver Problema: Domínio Carregando Infinitamente

## ❌ Problema
- ✅ Site funciona pelo IP: `http://69.x.x.x`
- ❌ Site não funciona pelo domínio: `https://identikdigital.com.br` (carrega infinitamente)

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar DNS
```bash
# Verificar se o DNS está apontando corretamente
dig identikdigital.com.br
# ou
nslookup identikdigital.com.br

# Deve retornar o IP da VPS (69.x.x.x)
```

**Se o DNS não estiver correto:**
- Configure o registro A no seu provedor de domínio apontando para o IP da VPS

---

### 2. Verificar Configuração do Nginx

```bash
# Verificar se existe configuração para o domínio
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Verificar configuração do Nginx
sudo nginx -t

# Ver logs de erro do Nginx
sudo tail -f /var/log/nginx/error.log
```

---

### 3. Verificar se o Nginx está escutando no domínio

```bash
# Ver configurações ativas
sudo nginx -T | grep -A 10 "server_name"
```

**Deve mostrar algo como:**
```
server_name identikdigital.com.br www.identikdigital.com.br;
```

---

### 4. Verificar Certificado SSL

```bash
# Verificar se o certificado existe
sudo ls -la /etc/letsencrypt/live/identikdigital.com.br/

# Verificar validade do certificado
sudo certbot certificates
```

---

### 5. Verificar Firewall

```bash
# Verificar se as portas 80 e 443 estão abertas
sudo firewall-cmd --list-all
# ou
sudo ufw status

# Se necessário, abrir portas
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## ✅ Soluções Comuns

### Solução 1: Criar/Atualizar Configuração do Nginx

```bash
# Criar arquivo de configuração para o domínio
sudo nano /etc/nginx/sites-available/identikdigital.com.br
```

**Conteúdo do arquivo:**
```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name identikdigital.com.br www.identikdigital.com.br;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/identikdigital.com.br/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root do frontend
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # PWA - Service Worker
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Content-Type "application/javascript";
        try_files $uri =404;
    }

    # PWA - Manifest
    location = /manifest.json {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    # PWA - Icons
    location ~ ^/icons/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Frontend - SPA
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

**Ativar a configuração:**
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/identikdigital.com.br /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### Solução 2: Gerar Certificado SSL (se não existir)

```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Gerar certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# Reiniciar Nginx
sudo systemctl start nginx
```

---

### Solução 3: Verificar se o Backend está rodando

```bash
# Verificar status do PM2
pm2 status

# Verificar se a API responde
curl http://localhost:8081/api/health

# Ver logs
pm2 logs gibaapp-api --lines 50
```

---

### Solução 4: Verificar CORS (se aplicável)

Se o problema for CORS, verifique a configuração do backend em `server/index.js`:

```javascript
// Deve permitir o domínio
const corsOptions = {
  origin: [
    'https://identikdigital.com.br',
    'http://identikdigital.com.br',
    'https://www.identikdigital.com.br'
  ],
  credentials: true
};
```

---

## 🔍 Comandos de Diagnóstico Rápido

```bash
# 1. Verificar DNS
dig identikdigital.com.br +short

# 2. Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# 3. Ver logs em tempo real
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 4. Testar conexão local
curl -I https://identikdigital.com.br
curl -I http://localhost

# 5. Verificar certificado
sudo certbot certificates

# 6. Verificar firewall
sudo firewall-cmd --list-all
```

---

## 🎯 Checklist de Verificação

- [ ] DNS aponta para o IP correto da VPS
- [ ] Nginx está rodando (`sudo systemctl status nginx`)
- [ ] Configuração do Nginx existe para o domínio
- [ ] Certificado SSL existe e é válido
- [ ] Portas 80 e 443 estão abertas no firewall
- [ ] Backend está rodando (`pm2 status`)
- [ ] Arquivo `dist/` existe e tem conteúdo
- [ ] Logs do Nginx não mostram erros críticos

---

## 🐛 Troubleshooting Avançado

### Se o problema persistir:

1. **Verificar logs detalhados:**
```bash
sudo tail -100 /var/log/nginx/error.log
```

2. **Testar configuração do Nginx:**
```bash
sudo nginx -T | grep -A 50 "identikdigital"
```

3. **Verificar se há múltiplas configurações conflitantes:**
```bash
sudo grep -r "server_name" /etc/nginx/
```

4. **Reiniciar serviços:**
```bash
sudo systemctl restart nginx
pm2 restart all
```

---

## 📞 Informações para Debug

Execute e compartilhe a saída:

```bash
# Status geral
sudo nginx -t
sudo systemctl status nginx
pm2 status
dig identikdigital.com.br +short
sudo certbot certificates
sudo tail -50 /var/log/nginx/error.log
```
