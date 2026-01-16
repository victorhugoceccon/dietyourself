# 🔧 Resolver Erro do Certbot - Porta 80

## ❌ Problema

O Certbot precisa acessar a porta **80** (HTTP padrão) para validar o domínio, mas o Nginx está configurado para escutar na porta **8082**.

## ✅ Solução: Configurar Nginx para Porta 80

### **Opção 1: Adicionar Porta 80 ao Nginx (Recomendado)**

Edite o arquivo do Nginx para escutar também na porta 80:

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Adicione este bloco ANTES do bloco HTTPS:**

```nginx
# Servidor HTTP na porta 80 (para validação do Certbot)
server {
    listen 80;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Permitir acesso ao .well-known para validação do Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
    }

    # Frontend (temporário - será redirecionado para HTTPS depois)
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Servidor HTTPS na porta 443 (será configurado pelo Certbot)
server {
    listen 443 ssl http2;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Certificados (serão configurados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/identikdigital.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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

    # Frontend
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

**OU se preferir manter a porta 8082, adicione apenas o bloco HTTP na porta 80:**

```nginx
# Servidor HTTP na porta 80 (para validação do Certbot)
server {
    listen 80;
    server_name identikdigital.com.br www.identikdigital.com.br;

    # Permitir acesso ao .well-known para validação do Certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
    }

    # Redirecionar todo o resto para porta 8082 (temporário)
    location / {
        proxy_pass http://localhost:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **2. Criar diretório para validação**

```bash
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chmod -R 755 /var/www/html
```

### **3. Testar e recarregar Nginx**

```bash
# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Verificar se está escutando na porta 80
sudo netstat -tlnp | grep :80
```

### **4. Verificar DNS**

```bash
# Verificar se o DNS está apontando corretamente
dig identikdigital.com.br +short
# Deve retornar: 69.6.215.140

# Testar acesso HTTP
curl -I http://identikdigital.com.br
```

### **5. Tentar Certbot novamente**

```bash
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```

## 🔄 Alternativa: Usar Certbot Standalone

Se ainda der erro, use o método standalone (para temporariamente):

```bash
# Parar Nginx temporariamente
sudo systemctl stop nginx

# Obter certificado em modo standalone
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# Reiniciar Nginx
sudo systemctl start nginx

# Depois configurar o Nginx manualmente com os certificados obtidos
```

## 🐛 Troubleshooting

### Erro: "Port 80 is already in use"

```bash
# Verificar o que está usando a porta 80
sudo lsof -i :80

# Se for outro serviço, pare temporariamente
sudo systemctl stop nome-do-servico
```

### Erro: "DNS not pointing to this server"

```bash
# Verificar DNS
dig identikdigital.com.br +short
nslookup identikdigital.com.br

# Aguardar propagação (pode levar até 24h, geralmente alguns minutos)
```

### Erro: "Connection refused"

```bash
# Verificar firewall
sudo firewall-cmd --list-all
# OU
sudo iptables -L

# Permitir porta 80
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
# OU
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

## ✅ Checklist

- [ ] Nginx configurado para escutar na porta 80
- [ ] Diretório `.well-known` criado
- [ ] DNS apontando para `69.6.215.140`
- [ ] Porta 80 acessível (sem firewall bloqueando)
- [ ] Nginx testado e recarregado
- [ ] Certbot executado novamente

## 🎯 Sequência Completa

```bash
# 1. Editar Nginx (adicionar porta 80)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 2. Criar diretório
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chmod -R 755 /var/www/html

# 3. Testar Nginx
sudo nginx -t

# 4. Recarregar
sudo systemctl reload nginx

# 5. Verificar porta 80
sudo netstat -tlnp | grep :80

# 6. Verificar DNS
dig identikdigital.com.br +short

# 7. Tentar Certbot novamente
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```

---

**✨ Após configurar a porta 80, o Certbot deve funcionar!**
