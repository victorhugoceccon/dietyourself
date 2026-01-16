# 🔧 Resolver 502 Bad Gateway - Nginx não conecta ao Backend

## ❌ Problema

Backend está rodando, mas Nginx retorna 502 Bad Gateway.

## ✅ Diagnóstico

### **PASSO 1: Verificar se Backend está respondendo**

```bash
# Verificar se está rodando
pm2 status

# Testar backend diretamente
curl http://localhost:5000/api/health

# OU testar qualquer endpoint
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"teste","password":"teste"}'
```

**Se retornar erro ou não responder, o problema é no backend.**

### **PASSO 2: Verificar Logs do Backend**

```bash
# Ver logs do backend
pm2 logs gibaapp-api --lines 50

# Ver erros específicos
pm2 logs gibaapp-api --err --lines 50
```

### **PASSO 3: Verificar Configuração do Nginx**

```bash
# Ver configuração do proxy
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep -A 15 "location /api"
```

### **PASSO 4: Verificar Logs do Nginx**

```bash
# Ver logs de erro do Nginx
sudo tail -50 /var/log/nginx/gibaapp-error.log

# OU se não existir
sudo tail -50 /var/log/nginx/error.log
```

## 🔧 Soluções

### **Solução 1: Backend não está respondendo**

Se `curl http://localhost:5000/api/health` não funcionar:

```bash
# Ver logs do backend
pm2 logs gibaapp-api --lines 100

# Verificar variáveis de ambiente
cat .env | grep -E "PORT|DATABASE_URL|NODE_ENV"

# Verificar se porta está correta
sudo ss -tlnp | grep :5000
```

### **Solução 2: Nginx não está configurado corretamente**

Verificar se o proxy está apontando para a porta correta:

```bash
# Ver configuração atual
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep -A 10 "location /api"
```

**Deve ter:**
```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    ...
}
```

### **Solução 3: Testar conexão do Nginx ao Backend**

```bash
# Testar se Nginx consegue acessar o backend
curl -v http://localhost:5000/api/health

# Ver se há firewall bloqueando
sudo iptables -L | grep 5000
```

## 🎯 Sequência de Diagnóstico

```bash
# 1. Verificar PM2
pm2 status

# 2. Testar backend diretamente
curl http://localhost:5000/api/health

# 3. Ver logs do backend
pm2 logs gibaapp-api --lines 50

# 4. Ver logs do Nginx
sudo tail -50 /var/log/nginx/error.log

# 5. Verificar configuração do Nginx
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep -A 10 "location /api"
```

---

**✨ Execute os comandos de diagnóstico e me envie os resultados!**
