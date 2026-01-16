# 🚀 Iniciar Backend - Solução Alternativa

## ❌ Problema

PM2 não está reconhecendo o script no `ecosystem.config.js`.

## ✅ Soluções Alternativas

### **Opção 1: Verificar se o arquivo existe**

```bash
# Verificar se server/index.js existe
ls -la server/index.js

# Verificar caminho completo
pwd
ls -la /opt/dietyourself/dietyourself/server/index.js
```

### **Opção 2: Iniciar diretamente sem ecosystem.config.js**

```bash
# Iniciar diretamente com o script
pm2 start server/index.js --name gibaapp-api --env production

# OU com variáveis de ambiente
NODE_ENV=production PORT=5000 pm2 start server/index.js --name gibaapp-api
```

### **Opção 3: Usar caminho absoluto no ecosystem.config.js**

Se o arquivo existe, tente usar caminho absoluto:

```bash
# Ver caminho atual
pwd

# Editar ecosystem.config.js
nano ecosystem.config.js
```

**Mudar:**
```javascript
script: './server/index.js',
```

**Para (usar caminho absoluto):**
```javascript
script: '/opt/dietyourself/dietyourself/server/index.js',
```

### **Opção 4: Renomear para .cjs**

Se o PM2 não reconhecer ES module, renomeie:

```bash
# Renomear arquivo
mv ecosystem.config.js ecosystem.config.cjs

# Editar para usar CommonJS
nano ecosystem.config.cjs
```

**Mudar de:**
```javascript
export default {
```

**Para:**
```javascript
module.exports = {
```

**Depois iniciar:**
```bash
pm2 start ecosystem.config.cjs
```

## 🎯 Solução Mais Simples (Recomendada)

```bash
# 1. Verificar se arquivo existe
ls -la server/index.js

# 2. Iniciar diretamente
pm2 start server/index.js --name gibaapp-api --env production

# 3. Verificar status
pm2 status

# 4. Ver logs
pm2 logs gibaapp-api --lines 30

# 5. Salvar
pm2 save
```

## 🔍 Verificar Problema

```bash
# 1. Verificar se server/index.js existe
ls -la server/index.js

# 2. Verificar se está no diretório correto
pwd

# 3. Testar executar manualmente
node server/index.js
# (Pressione Ctrl+C para parar)

# 4. Se funcionar manualmente, iniciar com PM2
pm2 start server/index.js --name gibaapp-api
```

---

**✨ Execute primeiro: `ls -la server/index.js` para verificar se o arquivo existe!**
