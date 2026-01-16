# 🔍 Como Encontrar a Configuração do Nginx

## Se o diretório `sites-enabled` não existe

O Nginx pode estar configurado de forma diferente. Vamos descobrir:

### **1. Verificar se o Nginx está instalado e rodando**

```bash
# Verificar se está instalado
nginx -v

# Verificar status
systemctl status nginx
```

### **2. Encontrar o arquivo de configuração principal**

```bash
# Verificar arquivo principal
cat /etc/nginx/nginx.conf | grep -E "include|sites"

# OU verificar diretamente
ls -la /etc/nginx/
```

### **3. Verificar onde está a configuração do seu site**

```bash
# Ver todas as configurações ativas
nginx -T 2>/dev/null | grep -E "server_name|root"

# OU verificar processos do Nginx
ps aux | grep nginx

# OU verificar qual porta está escutando
netstat -tlnp | grep :80
```

### **4. Possíveis localizações da configuração**

O Nginx pode estar configurado em:

**Opção A: Configuração direta no nginx.conf**
```bash
sudo nano /etc/nginx/nginx.conf
```

**Opção B: Arquivo separado em conf.d**
```bash
ls -la /etc/nginx/conf.d/
sudo nano /etc/nginx/conf.d/default.conf
```

**Opção C: Criar sites-available e sites-enabled**
```bash
# Criar os diretórios
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Adicionar include no nginx.conf
sudo nano /etc/nginx/nginx.conf
```

No arquivo `nginx.conf`, dentro do bloco `http {`, adicione:
```nginx
http {
    # ... outras configurações ...
    
    include /etc/nginx/sites-enabled/*;
}
```

## 🎯 Solução Rápida: Verificar Configuração Atual

Execute estes comandos para descobrir:

```bash
# 1. Ver configuração completa
sudo nginx -T

# 2. Ver qual arquivo está servindo na porta 80
sudo nginx -T | grep -A 10 "listen.*80"

# 3. Ver onde está o root do seu site
sudo nginx -T | grep -E "root|server_name"
```

## 📝 Criar Estrutura Padrão (Recomendado)

Se não existir, vamos criar a estrutura padrão:

```bash
# 1. Criar diretórios
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 2. Editar nginx.conf para incluir sites-enabled
sudo nano /etc/nginx/nginx.conf
```

**No arquivo `nginx.conf`, dentro do bloco `http {`, adicione:**
```nginx
http {
    # ... outras configurações existentes ...
    
    # Incluir configurações de sites
    include /etc/nginx/sites-enabled/*;
}
```

**3. Criar arquivo de configuração do seu app:**
```bash
sudo nano /etc/nginx/sites-available/dietyourself
```

**4. Criar link simbólico:**
```bash
sudo ln -s /etc/nginx/sites-available/dietyourself /etc/nginx/sites-enabled/dietyourself
```

**5. Testar e recarregar:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Alternativa: Editar nginx.conf Diretamente

Se preferir editar diretamente:

```bash
# 1. Fazer backup
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 2. Editar
sudo nano /etc/nginx/nginx.conf

# 3. Adicionar configuração do seu app dentro do bloco http {}
```

## 📋 Exemplo de Configuração Completa

Se você for criar um novo arquivo em `/etc/nginx/sites-available/dietyourself`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    # OU se não tiver domínio: server_name SEU_IP_VPS;

    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA) - SEM CACHE
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Manifest JSON
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
        expires 1h;
        add_header Cache-Control "public";
    }

    # Ícones PWA
    location /icons/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache de assets estáticos
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
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    client_max_body_size 20M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}
```

## ✅ Próximos Passos

Depois de encontrar ou criar a configuração:

1. **Editar o arquivo** com as configurações PWA
2. **Testar:** `sudo nginx -t`
3. **Recarregar:** `sudo systemctl reload nginx`
4. **Verificar:** `curl -I http://seu-dominio.com/sw.js`

---

**Execute primeiro: `sudo nginx -T` para ver a configuração atual completa!**
