# 🔧 Arquivo Corrigido - /etc/nginx/conf.d/dietyourself.conf

## ❌ Problema Identificado

O arquivo tem:
1. Um bloco `server {}` que fecha
2. Depois há um `location /` FORA do bloco `server {}` (linha 58+)
3. Isso causa o erro: "location directive is not allowed here"

## ✅ Solução: Arquivo Corrigido

Edite o arquivo e substitua TODO o conteúdo por este:

```nginx
server {
    listen 8082;
    server_name 69.6.215.140;

    # Frontend build (React / Vite)
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker (PWA) - SEM CACHE - DEVE estar ANTES do location /
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

    # Frontend - SPA: sempre devolver index.html para rotas do frontend
    location / {
        try_files $uri $uri/ /index.html;

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

        # Timeouts aumentados para requisições longas (geração de dieta pode levar até 10 minutos)
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;

        # Buffer settings para requisições grandes
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Timeout específico para geração de dieta (pode levar muito tempo)
    location /api/diet/generate {
        proxy_pass http://127.0.0.1:8081/api/diet/generate;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts muito aumentados para geração de dieta (15 minutos)
        proxy_connect_timeout 900s;
        proxy_send_timeout 900s;
        proxy_read_timeout 900s;

        # Desabilitar buffering para streaming
        proxy_buffering off;
        proxy_request_buffering off;

        # Manter conexão viva
        proxy_set_header Connection "";
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Tamanho máximo de upload
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}
```

## 📝 Passos para Aplicar

### 1. Fazer backup do arquivo atual

```bash
sudo cp /etc/nginx/conf.d/dietyourself.conf /etc/nginx/conf.d/dietyourself.conf.backup
```

### 2. Editar o arquivo

```bash
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

### 3. Substituir TODO o conteúdo

- Pressione `Ctrl + K` várias vezes para deletar todo o conteúdo
- OU selecione tudo (`Ctrl + A`) e delete
- Cole o conteúdo corrigido acima
- Salve: `Ctrl + O`, `Enter`, `Ctrl + X`

### 4. Testar configuração

```bash
sudo nginx -t
```

**Deve mostrar:**
```
nginx: the configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Recarregar Nginx

```bash
sudo systemctl reload nginx
```

### 6. Verificar status

```bash
sudo systemctl status nginx
```

### 7. Testar PWA

```bash
# Testar service worker
curl -I http://69.6.215.140:8082/sw.js

# Testar manifest
curl -I http://69.6.215.140:8082/manifest.json
```

## ✅ O que foi corrigido

1. ✅ Removido bloco `server {}` duplicado
2. ✅ Todas as configurações agora estão dentro de UM único bloco `server {}`
3. ✅ Configurações PWA adicionadas corretamente:
   - `location = /sw.js` (sem cache)
   - `location = /manifest.json`
   - `location /icons/` (cache longo)
4. ✅ Mantidas todas as configurações existentes (API, timeouts, etc.)

## 🎯 Estrutura Correta

```nginx
server {
    # Configurações do servidor
    listen 8082;
    server_name 69.6.215.140;
    root /opt/dietyourself/dietyourself/dist;

    # PWA - Service Worker (ANTES do location /)
    location = /sw.js { ... }

    # PWA - Manifest
    location = /manifest.json { ... }

    # PWA - Ícones
    location /icons/ { ... }

    # Frontend
    location / { ... }

    # API
    location /api/ { ... }

    # API específica
    location /api/diet/generate { ... }
}  # ← FIM DO SERVER
```

**⚠️ IMPORTANTE:** Não pode haver nada FORA do bloco `server {}`!
