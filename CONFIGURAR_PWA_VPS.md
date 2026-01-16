# 📱 Configurar PWA na VPS - Guia Completo

## ✅ O que já está configurado

- ✅ `manifest.json` configurado
- ✅ Service Worker (`sw.js`) criado
- ✅ Ícones PNG gerados (todos os tamanhos)
- ✅ `index.html` com referências ao manifest e SW
- ✅ Nginx com configuração para manifest.json

## 🔧 Passos para Ativar PWA na VPS

### **PASSO 1: Verificar se os arquivos estão no build**

Após fazer `npm run build`, verifique se os arquivos PWA estão em `dist/`:

```bash
cd /opt/dietyourself/dietyourself
ls -la dist/
ls -la dist/icons/
```

**Deve conter:**
- `dist/manifest.json`
- `dist/sw.js`
- `dist/icons/icon-*.png` (todos os tamanhos)

### **PASSO 2: Configurar Nginx para Service Worker**

O Nginx precisa servir o `sw.js` com o MIME type correto. Edite a configuração:

```bash
sudo nano /etc/nginx/sites-available/gibaapp
```

Adicione ou verifique esta seção (deve estar após a seção do manifest):

```nginx
# Service Worker (PWA) - IMPORTANTE: deve estar na raiz
location = /sw.js {
    root /opt/dietyourself/dietyourself/dist;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    access_log off;
}

# Manifest e outros arquivos JSON
location ~* \.(webmanifest|json)$ {
    root /opt/dietyourself/dietyourself/dist;
    add_header Content-Type "application/json";
    expires 1h;
    add_header Cache-Control "public";
}

# Ícones PWA
location /icons/ {
    root /opt/dietyourself/dietyourself/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Testar configuração:**
```bash
sudo nginx -t
```

**Recarregar Nginx:**
```bash
sudo systemctl reload nginx
```

### **PASSO 3: Configurar HTTPS (OBRIGATÓRIO para PWA)**

**⚠️ IMPORTANTE:** Service Workers só funcionam em HTTPS (ou localhost).

#### Opção A: Usar Let's Encrypt (Recomendado - Grátis)

```bash
# 1. Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Obter certificado SSL (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# 3. Certbot vai configurar automaticamente o Nginx
# Siga as instruções na tela

# 4. Testar renovação automática
sudo certbot renew --dry-run
```

#### Opção B: Se não tiver domínio (apenas IP)

Para desenvolvimento/teste, você pode usar um túnel HTTPS:

```bash
# Instalar ngrok ou Cloudflare Tunnel
# ngrok: https://ngrok.com/
# Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
```

### **PASSO 4: Verificar se o Service Worker está sendo servido**

```bash
# Testar se o manifest está acessível
curl http://seu-dominio.com/manifest.json

# Testar se o service worker está acessível
curl http://seu-dominio.com/sw.js
```

**Deve retornar o conteúdo dos arquivos, não erro 404.**

### **PASSO 5: Verificar MIME Types no Nginx**

Certifique-se de que o Nginx está servindo os arquivos com os MIME types corretos:

```bash
# Verificar configuração do Nginx
sudo nginx -T | grep -A 5 "types_hash"
```

Se necessário, adicione ao `nginx.conf`:

```nginx
# No arquivo /etc/nginx/nginx.conf, dentro de http {}
types {
    application/javascript js;
    application/json json webmanifest;
    text/javascript js;
}
```

### **PASSO 6: Testar PWA no Navegador**

1. **Acesse o site via HTTPS:**
   ```
   https://seu-dominio.com
   ```

2. **Abrir DevTools (F12):**
   - Aba "Application" → "Service Workers"
   - Deve mostrar o service worker registrado
   - Aba "Application" → "Manifest"
   - Deve mostrar as informações do PWA

3. **Testar instalação:**
   - Chrome/Edge: Ícone de instalação na barra de endereços
   - Menu → "Instalar aplicativo"

## 📱 Testar no Mobile

### Android (Chrome)

1. Abra o Chrome no Android
2. Acesse `https://seu-dominio.com`
3. Menu (3 pontos) → "Adicionar à tela inicial" ou "Instalar app"
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

### iOS (Safari)

1. Abra o Safari no iOS
2. Acesse `https://seu-dominio.com`
3. Botão de compartilhar (quadrado com seta) → "Adicionar à Tela de Início"
4. Personalize o nome se desejar
5. Toque em "Adicionar"

## 🔍 Troubleshooting

### ❌ Service Worker não registra

**Verificar:**
```bash
# 1. Verificar se o arquivo existe
ls -la /opt/dietyourself/dietyourself/dist/sw.js

# 2. Verificar permissões
sudo chmod 644 /opt/dietyourself/dietyourself/dist/sw.js

# 3. Verificar se está acessível
curl -I https://seu-dominio.com/sw.js
# Deve retornar HTTP 200, não 404
```

**Solução:**
- Verifique se está usando HTTPS
- Verifique se o caminho no Nginx está correto
- Limpe o cache do navegador (Ctrl+Shift+Delete)

### ❌ Manifest não carrega

**Verificar:**
```bash
# Testar se o manifest está acessível
curl https://seu-dominio.com/manifest.json

# Verificar se o Content-Type está correto
curl -I https://seu-dominio.com/manifest.json
# Deve mostrar: Content-Type: application/json
```

**Solução:**
- Verifique a configuração do Nginx para arquivos `.json`
- Certifique-se de que o arquivo está em `dist/manifest.json`

### ❌ Ícones não aparecem

**Verificar:**
```bash
# Verificar se os ícones existem
ls -la /opt/dietyourself/dietyourself/dist/icons/

# Testar acesso
curl -I https://seu-dominio.com/icons/icon-192x192.png
curl -I https://seu-dominio.com/icons/icon-512x512.png
```

**Solução:**
- Certifique-se de que os ícones foram copiados para `dist/icons/` após o build
- Verifique as permissões dos arquivos

### ❌ App não aparece como instalável

**Verificar:**
1. Está usando HTTPS? (obrigatório)
2. O manifest.json está válido? (use validador: https://manifest-validator.appspot.com/)
3. Tem pelo menos `icon-192x192.png` e `icon-512x512.png`?
4. O service worker está registrado?

**Solução:**
```bash
# Validar manifest
curl https://seu-dominio.com/manifest.json | python3 -m json.tool
# Se der erro, o JSON está inválido
```

## ✅ Checklist Final

- [ ] Build feito (`npm run build`)
- [ ] Arquivos PWA em `dist/` (manifest.json, sw.js, icons/)
- [ ] Nginx configurado para servir sw.js e manifest.json
- [ ] HTTPS configurado (Let's Encrypt ou túnel)
- [ ] Service Worker acessível em `/sw.js`
- [ ] Manifest acessível em `/manifest.json`
- [ ] Ícones acessíveis em `/icons/`
- [ ] Testado no navegador (DevTools → Application)
- [ ] Testado no mobile (Android/iOS)

## 🚀 Comandos Rápidos (Copiar e Colar)

```bash
# 1. Fazer build
cd /opt/dietyourself/dietyourself
npm run build

# 2. Verificar arquivos PWA
ls -la dist/manifest.json dist/sw.js dist/icons/

# 3. Testar Nginx
sudo nginx -t
sudo systemctl reload nginx

# 4. Testar acesso
curl -I https://seu-dominio.com/sw.js
curl -I https://seu-dominio.com/manifest.json
curl -I https://seu-dominio.com/icons/icon-192x192.png

# 5. Ver logs do Nginx (se houver erros)
sudo tail -f /var/log/nginx/gibaapp-error.log
```

## 📝 Configuração Completa do Nginx para PWA

Aqui está uma configuração completa do Nginx otimizada para PWA:

```nginx
server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root do frontend
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # Service Worker - DEVE estar na raiz e sem cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        access_log off;
    }

    # Manifest
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
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
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
    }

    client_max_body_size 20M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

**✨ Após seguir estes passos, o PWA deve estar funcionando perfeitamente na VPS!**
