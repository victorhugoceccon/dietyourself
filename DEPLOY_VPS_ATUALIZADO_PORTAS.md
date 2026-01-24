# 🚀 Deploy VPS - Configuração de Portas Atualizada

## 📋 Configuração de Portas

### Frontend (Vite Build)
- **Porta:** 8082 (servido pelo Nginx)
- **URL:** https://identikdigital.com.br

### Backend (Node.js/Express)
- **Porta:** 8081
- **URL interna:** http://localhost:8081
- **Proxy Nginx:** /api → http://localhost:8081/api

## 🔧 Passo a Passo

### 1. Copiar `.env.production` para VPS

```bash
# Na sua máquina local, o arquivo .env.production já está criado
# Copie para a VPS:

scp .env.production root@69.6.215.140:/root/dietyourself-main/.env
```

### 2. Verificar Nginx na VPS

O Nginx deve estar configurado assim:

```nginx
# Frontend - porta 8082
server {
    listen 80;
    listen [::]:80;
    server_name identikdigital.com.br www.identikdigital.com.br;
    
    root /root/dietyourself-main/dist;
    index index.html;
    
    # Proxy para o backend
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
        
        # Timeouts para geração de dieta (10 minutos)
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Atualizar Nginx se necessário

```bash
# Conectar na VPS
ssh root@69.6.215.140

# Verificar qual arquivo de configuração está ativo
sudo ls -la /etc/nginx/sites-enabled/
sudo ls -la /etc/nginx/conf.d/

# Editar o arquivo correto (exemplo: dietyourself.conf)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# OU se estiver em sites-enabled
sudo nano /etc/nginx/sites-enabled/default

# Verificar se proxy_pass aponta para porta 8081
# Procurar por: proxy_pass http://localhost:5000
# Substituir por: proxy_pass http://localhost:8081

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4. Rebuild Frontend na VPS

```bash
# Na VPS
cd /root/dietyourself-main

# Fazer build de produção
npm run build

# Verificar se dist foi criado
ls -la dist/
```

### 5. Reiniciar Backend

```bash
# Verificar se está rodando
pm2 list

# Reiniciar
pm2 restart gibaapp-api

# Ver logs
pm2 logs gibaapp-api --lines 50

# Verificar se está na porta 8081
sudo ss -tlnp | grep :8081
```

### 6. Verificar Funcionamento

```bash
# Testar backend diretamente
curl http://localhost:8081/api/health

# Testar através do Nginx
curl http://localhost/api/health

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔍 Diagnóstico de Problemas

### Problema: "net::ERR_CONNECTION_REFUSED"

**Causa:** Backend não está rodando ou está na porta errada.

**Solução:**
```bash
# Verificar se backend está rodando
pm2 list

# Verificar porta
sudo ss -tlnp | grep :8081

# Se não aparecer nada, backend não está rodando
# Reiniciar:
pm2 restart gibaapp-api

# Ver erros:
pm2 logs gibaapp-api --err --lines 50
```

### Problema: "502 Bad Gateway"

**Causa:** Nginx não consegue conectar ao backend.

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:8081/api/health

# 2. Verificar configuração do Nginx
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep proxy_pass

# 3. Deve mostrar: proxy_pass http://localhost:8081
# Se mostrar porta diferente, corrigir

# 4. Corrigir automaticamente
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf

# 5. Recarregar Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Problema: "404 Not Found"

**Causa:** Build do frontend não foi feito ou está incompleto.

**Solução:**
```bash
# Fazer build novamente
cd /root/dietyourself-main
npm run build

# Verificar se index.html existe
ls -la dist/index.html

# Verificar permissões
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
```

## ✅ Checklist Final

- [ ] `.env` copiado com `PORT=8081`
- [ ] Backend rodando na porta 8081
- [ ] Nginx configurado com `proxy_pass http://localhost:8081`
- [ ] Frontend buildado (`npm run build`)
- [ ] Nginx aponta para `/root/dietyourself-main/dist`
- [ ] Tudo testado e funcionando

## 🚀 Deploy Rápido (Script)

```bash
# Na sua máquina local:
scp .env.production root@69.6.215.140:/root/dietyourself-main/.env

# Na VPS:
ssh root@69.6.215.140
cd /root/dietyourself-main
npm run build
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf
sudo nginx -t
sudo systemctl reload nginx
pm2 restart gibaapp-api
pm2 logs gibaapp-api --lines 20
```

---

**✨ Após seguir esses passos, acesse: https://identikdigital.com.br**
