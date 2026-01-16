# 🔧 Resolver Erro 502 Bad Gateway

## ❌ Problema

Erro 502 Bad Gateway ao tentar fazer login. Isso significa que o Nginx não consegue conectar ao backend na porta 5000.

## ✅ Solução: Verificar e Iniciar Backend

### **PASSO 1: Verificar se o Backend está rodando**

```bash
# Ver processos PM2
pm2 status

# Ver se há processo na porta 5000
sudo netstat -tlnp | grep :5000
# OU
sudo ss -tlnp | grep :5000

# Ver logs do PM2
pm2 logs gibaapp-api --lines 50
```

### **PASSO 2: Verificar se o Backend está configurado no PM2**

```bash
# Ver configuração do PM2
cat ecosystem.config.js

# OU ver processos
pm2 list
```

### **PASSO 3: Iniciar/Reiniciar Backend**

```bash
# Se não estiver rodando, iniciar
pm2 start ecosystem.config.js

# OU se já estiver rodando, reiniciar
pm2 restart gibaapp-api

# OU reiniciar todos
pm2 restart all

# Salvar configuração
pm2 save
```

### **PASSO 4: Verificar Logs para Erros**

```bash
# Ver logs em tempo real
pm2 logs gibaapp-api --lines 100

# Ver erros específicos
pm2 logs gibaapp-api --err --lines 50
```

### **PASSO 5: Testar Backend Diretamente**

```bash
# Testar se o backend responde na porta 5000
curl http://localhost:5000/api/health

# OU testar endpoint de login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'
```

## 🔍 Possíveis Causas

### **1. Backend não está rodando**

```bash
# Verificar PM2
pm2 status

# Se não estiver, iniciar
pm2 start ecosystem.config.js
```

### **2. Backend está rodando em outra porta**

```bash
# Verificar qual porta está sendo usada
sudo netstat -tlnp | grep node

# Verificar variável de ambiente
cat .env | grep PORT
```

### **3. Erro no Backend (crashes)**

```bash
# Ver logs de erro
pm2 logs gibaapp-api --err

# Verificar se há erros de banco de dados
pm2 logs gibaapp-api | grep -i "error\|database\|prisma"
```

### **4. Configuração do Nginx incorreta**

Verificar se o proxy está apontando para a porta correta:

```bash
# Ver configuração do Nginx
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep -A 10 "location /api"
```

## 🎯 Sequência de Diagnóstico

```bash
# 1. Verificar PM2
pm2 status

# 2. Verificar porta 5000
sudo ss -tlnp | grep :5000

# 3. Ver logs
pm2 logs gibaapp-api --lines 50

# 4. Testar backend
curl http://localhost:5000/api/health

# 5. Se não estiver rodando, iniciar
pm2 start ecosystem.config.js

# 6. Testar novamente
curl http://localhost:5000/api/health
```

## 📝 Verificar ecosystem.config.js

Se o PM2 não estiver configurado, verifique o arquivo:

```bash
cat ecosystem.config.js
```

Deve ter algo como:

```javascript
module.exports = {
  apps: [{
    name: 'gibaapp-api',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

---

**✨ Execute os comandos de diagnóstico primeiro para identificar o problema!**
