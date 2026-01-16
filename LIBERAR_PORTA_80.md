# 🔍 Liberar Porta 80 Completamente

## ❌ Problema

Ainda há algo usando a porta 80, mesmo após parar o Traefik.

## ✅ Solução: Identificar e Parar o Processo

### **1. Ver o que está usando a porta 80**

```bash
# Ver processo usando porta 80
sudo lsof -i :80

# OU
sudo netstat -tlnp | grep :80

# OU ver todos os processos
sudo ps aux | grep -E "nginx|apache|httpd"
```

### **2. Parar o processo**

Dependendo do que aparecer:

```bash
# Se for Nginx
sudo systemctl stop nginx

# Se for Apache
sudo systemctl stop httpd
sudo systemctl stop apache2

# Se for outro processo Docker
sudo docker ps | grep 80
sudo docker stop <container_id>

# Se for outro processo, matar pelo PID
sudo kill -9 <PID>
```

### **3. Verificar novamente**

```bash
sudo lsof -i :80
# Não deve mostrar nada
```

### **4. Tentar Certbot novamente**

```bash
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

## 🎯 Comandos Rápidos

```bash
# 1. Ver o que está usando porta 80
sudo lsof -i :80

# 2. Parar Nginx (se estiver rodando)
sudo systemctl stop nginx

# 3. Parar Apache (se estiver rodando)
sudo systemctl stop httpd 2>/dev/null
sudo systemctl stop apache2 2>/dev/null

# 4. Verificar novamente
sudo lsof -i :80

# 5. Tentar Certbot
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```
