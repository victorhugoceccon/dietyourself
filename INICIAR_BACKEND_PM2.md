# 🚀 Iniciar Backend com PM2

## ✅ Problema Resolvido

O `ecosystem.config.js` foi convertido para ES module (compatível com `"type": "module"` no package.json).

## 🔧 Passos para Iniciar Backend

### **PASSO 1: Verificar se há processos antigos**

```bash
# Ver processos PM2
pm2 status

# Se houver processos antigos, parar todos
pm2 delete all
```

### **PASSO 2: Criar diretório de logs (se não existir)**

```bash
mkdir -p logs
```

### **PASSO 3: Iniciar Backend**

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs gibaapp-api --lines 30
```

### **PASSO 4: Salvar Configuração**

```bash
# Salvar para iniciar automaticamente após reboot
pm2 save

# Configurar startup (se ainda não tiver)
pm2 startup
# Execute o comando que aparecer
```

### **PASSO 5: Testar Backend**

```bash
# Testar se está respondendo
curl http://localhost:5000/api/health

# OU testar endpoint de login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456"}'
```

## 🎯 Sequência Completa

```bash
# 1. Parar processos antigos (se houver)
pm2 delete all

# 2. Criar diretório de logs
mkdir -p logs

# 3. Iniciar backend
pm2 start ecosystem.config.js

# 4. Verificar status
pm2 status

# 5. Ver logs
pm2 logs gibaapp-api --lines 30

# 6. Salvar
pm2 save

# 7. Testar
curl http://localhost:5000/api/health
```

## 🔍 Se Der Erro

### **Erro: "Cannot find module"**

```bash
# Verificar se node_modules existe
ls -la node_modules

# Se não existir, instalar
npm install
```

### **Erro: "Port 5000 already in use"**

```bash
# Ver o que está usando a porta 5000
sudo ss -tlnp | grep :5000

# Parar processo antigo
pm2 delete all
```

### **Erro no Backend**

```bash
# Ver logs detalhados
pm2 logs gibaapp-api --lines 100

# Verificar variáveis de ambiente
cat .env | grep -E "PORT|DATABASE_URL|NODE_ENV"
```

---

**✨ Execute os comandos acima para iniciar o backend!**
