# 🔧 Como Editar o Nginx para PWA (Passo 2)

## 📝 Passo a Passo para Editar o Nginx

### **1. Localizar o arquivo de configuração do Nginx**

Primeiro, descubra qual arquivo está sendo usado:

```bash
# Verificar qual arquivo está ativo
ls -la /etc/nginx/sites-enabled/

# Verificar qual é o arquivo do seu app
sudo nginx -T | grep "server_name"
```

**Arquivos comuns:**
- `/etc/nginx/sites-available/gibaapp`
- `/etc/nginx/sites-available/dietyourself`
- `/etc/nginx/nginx.conf` (se configurado diretamente)

### **2. Editar o arquivo de configuração**

```bash
# Usando nano (mais fácil para iniciantes)
sudo nano /etc/nginx/sites-available/gibaapp

# OU usando vi/vim
sudo vi /etc/nginx/sites-available/gibaapp
```

**Se não souber qual arquivo, liste todos:**
```bash
ls -la /etc/nginx/sites-available/
```

### **3. Adicionar as configurações PWA**

Procure pela seção `location /` e adicione ANTES ou DEPOIS dela:

```nginx
# Service Worker (PWA) - DEVE estar antes do location /
location = /sw.js {
    root /opt/dietyourself/dietyourself/dist;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
    access_log off;
}

# Manifest JSON
location = /manifest.json {
    root /opt/dietyourself/dietyourself/dist;
    add_header Content-Type "application/manifest+json";
    expires 1h;
    add_header Cache-Control "public";
}

# Ícones PWA
location /icons/ {
    root /opt/dietyourself/dietyourself/dist;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Frontend (sua configuração existente)
location / {
    root /opt/dietyourself/dietyourself/dist;
    try_files $uri $uri/ /index.html;
    index index.html;
    # ... resto da sua configuração
}
```

### **4. Exemplo Completo de Arquivo Nginx**

Aqui está um exemplo completo de como deve ficar:

```nginx
server {
    listen 80;
    # Se tiver HTTPS, também terá um bloco server { listen 443 ssl; }
    server_name seu-dominio.com www.seu-dominio.com;

    # Root do frontend
    root /opt/dietyourself/dietyourself/dist;
    index index.html;

    # ============================================
    # CONFIGURAÇÕES PWA - ADICIONE AQUI
    # ============================================
    
    # Service Worker - SEM CACHE (muito importante!)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        access_log off;
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

    # ============================================
    # FIM DAS CONFIGURAÇÕES PWA
    # ============================================

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
    }

    client_max_body_size 20M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript application/xml image/svg+xml;
}
```

### **5. Salvar e Sair (nano)**

Se estiver usando `nano`:
- Pressione `Ctrl + O` para salvar
- Pressione `Enter` para confirmar
- Pressione `Ctrl + X` para sair

Se estiver usando `vi/vim`:
- Pressione `Esc` para sair do modo de edição
- Digite `:wq` e pressione `Enter` para salvar e sair
- Ou `:q!` para sair sem salvar

### **6. Testar a configuração**

```bash
# Testar se a sintaxe está correta
sudo nginx -t
```

**Se aparecer:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

✅ **Configuração está correta!**

### **7. Aplicar as mudanças**

```bash
# Recarregar Nginx (sem derrubar conexões)
sudo systemctl reload nginx

# OU reiniciar (se reload não funcionar)
sudo systemctl restart nginx
```

### **8. Verificar se está funcionando**

```bash
# Testar se o service worker está acessível
curl -I http://seu-dominio.com/sw.js
# Deve retornar HTTP 200

# Testar se o manifest está acessível
curl -I http://seu-dominio.com/manifest.json
# Deve retornar HTTP 200

# Ver logs se houver erro
sudo tail -f /var/log/nginx/error.log
```

## 🎯 Comandos Rápidos (Copiar e Colar)

```bash
# 1. Editar Nginx
sudo nano /etc/nginx/sites-available/gibaapp

# 2. Testar configuração
sudo nginx -t

# 3. Aplicar mudanças
sudo systemctl reload nginx

# 4. Verificar se está funcionando
curl -I http://seu-dominio.com/sw.js
```

## ⚠️ Dicas Importantes

1. **Sempre teste antes de recarregar:** `sudo nginx -t`
2. **Faça backup antes de editar:**
   ```bash
   sudo cp /etc/nginx/sites-available/gibaapp /etc/nginx/sites-available/gibaapp.backup
   ```
3. **Se der erro, restaure o backup:**
   ```bash
   sudo cp /etc/nginx/sites-available/gibaapp.backup /etc/nginx/sites-available/gibaapp
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. **Ajuste o caminho:** Se seu projeto está em outro lugar, ajuste:
   - `/opt/dietyourself/dietyourself/dist` → seu caminho real
   - Para descobrir: `cd /opt/dietyourself/dietyourself && pwd`

## 🐛 Se Der Erro

### Erro: "nginx: [emerg] unexpected end of file"
- Você esqueceu de fechar alguma chave `}` ou `;`
- Verifique a sintaxe do arquivo

### Erro: "nginx: [emerg] bind() to 0.0.0.0:80 failed"
- A porta 80 já está em uso
- Verifique: `sudo lsof -i :80`

### Service Worker não carrega
- Verifique se o caminho `root` está correto
- Verifique se o arquivo existe: `ls -la /opt/dietyourself/dietyourself/dist/sw.js`
- Verifique permissões: `sudo chmod 644 /opt/dietyourself/dietyourself/dist/sw.js`

---

**✨ Pronto! Agora você sabe como editar o Nginx para configurar o PWA!**
