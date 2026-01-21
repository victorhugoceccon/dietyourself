# 🔧 Resolver Erro Rollup - VPS

## ❌ Problema

Erro ao fazer build: `Cannot find module @rollup/rollup-linux-x64-gnu`

## ✅ Solução

Limpar node_modules e package-lock.json, depois reinstalar:

```bash
# 1. Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# 2. Limpar cache do npm
npm cache clean --force

# 3. Reinstalar dependências
npm install

# 4. Fazer build
npm run build
```

## 🎯 Sequência Completa

```bash
# 1. Ir para o diretório do projeto
cd /opt/dietyourself/dietyourself

# 2. Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# 3. Limpar cache
npm cache clean --force

# 4. Reinstalar
npm install

# 5. Fazer build
npm run build

# 6. Reiniciar backend
pm2 restart gibaapp-api
```

---

**✨ Execute os comandos acima para resolver o erro do Rollup!**
