# 🔧 Corrigir Erro do Nginx - "location directive is not allowed here"

## ❌ Erro
```
nginx: [emerg] "location" directive is not allowed here in /etc/nginx/conf.d/dietyourself.conf:58
```

## ✅ Solução

O erro indica que há um `location` na linha 58 que está fora do bloco `server {}`.

### **1. Ver o arquivo e identificar o problema**

```bash
# Ver o arquivo completo
sudo cat /etc/nginx/conf.d/dietyourself.conf

# OU ver as linhas ao redor da linha 58
sudo sed -n '50,70p' /etc/nginx/conf.d/dietyourself.conf
```

### **2. Editar o arquivo**

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

### **3. Problemas comuns e soluções**

#### Problema A: Falta fechar chave `}` do bloco `server`

**Errado:**
```nginx
server {
    listen 80;
    location / {
        # ...
    }
    # FALTA FECHAR O SERVER AQUI
location /api {  # ❌ ERRO: location fora do server
    # ...
}
```

**Correto:**
```nginx
server {
    listen 80;
    location / {
        # ...
    }
    
    location /api {
        # ...
    }
}  # ✅ FECHAR O SERVER AQUI
```

#### Problema B: Location dentro de outro location

**Errado:**
```nginx
server {
    location / {
        # ...
        location /api {  # ❌ ERRO: location dentro de location
            # ...
        }
    }
}
```

**Correto:**
```nginx
server {
    location / {
        # ...
    }
    
    location /api {  # ✅ location no mesmo nível
        # ...
    }
}
```

#### Problema C: Comentário ou linha quebrada

Verifique se há alguma linha comentada ou quebrada antes da linha 58.

### **4. Estrutura correta do arquivo**

O arquivo deve ter esta estrutura:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}  # ✅ IMPORTANTE: Fechar o bloco server
```

### **5. Depois de corrigir, testar**

```bash
# Testar configuração
sudo nginx -t

# Se estiver OK, recarregar
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

## 🎯 Comandos Rápidos

```bash
# 1. Ver o arquivo
sudo cat /etc/nginx/conf.d/dietyourself.conf

# 2. Ver linha 58 e contexto
sudo sed -n '50,70p' /etc/nginx/conf.d/dietyourself.conf

# 3. Editar
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 4. Testar
sudo nginx -t

# 5. Recarregar
sudo systemctl reload nginx
```

## 📝 Exemplo de Arquivo Completo Corrigido

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
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

**⚠️ IMPORTANTE:** Todos os `location` devem estar DENTRO do bloco `server {}` e o bloco deve ser fechado com `}` no final!
