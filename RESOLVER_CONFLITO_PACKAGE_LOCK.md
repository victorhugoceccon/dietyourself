# 🔧 Resolver Conflito package-lock.json

## ❌ Problema

Git pull falha porque há mudanças locais no `package-lock.json`.

## ✅ Solução

Como `package-lock.json` é gerado automaticamente, podemos descartar as mudanças locais:

```bash
# Descartar mudanças locais no package-lock.json
git checkout -- package-lock.json

# Fazer pull novamente
git pull origin main
```

## 🎯 Sequência Completa

```bash
# 1. Descartar mudanças locais
git checkout -- package-lock.json

# 2. Fazer pull
git pull origin main

# 3. Instalar dependências (se necessário)
npm install

# 4. Fazer build
npm run build

# 5. Reiniciar backend
pm2 restart gibaapp-api
```

---

**✨ Execute: `git checkout -- package-lock.json && git pull origin main`**
