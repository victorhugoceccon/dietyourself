# 🔧 Resolver Conflito Git na VPS

## ❌ Erro Encontrado
```
error: Your local changes to the following files would be overwritten by merge:
        package-lock.json
Please commit your changes or stash them before you merge.
```

## ✅ Solução Rápida

### Opção 1: Descartar mudanças locais (Recomendado)
Como `package-lock.json` pode ser regenerado, podemos descartar as mudanças locais:

```bash
# Descartar mudanças no package-lock.json
git checkout -- package-lock.json

# Agora fazer o pull novamente
git pull origin main
```

### Opção 2: Fazer stash (Salvar mudanças temporariamente)
Se quiser manter as mudanças locais:

```bash
# Salvar mudanças temporariamente
git stash

# Fazer o pull
git pull origin main

# Aplicar mudanças salvas (se necessário)
git stash pop
```

### Opção 3: Forçar atualização (Mais seguro)
Se as mudanças locais não são importantes:

```bash
# Resetar mudanças locais
git reset --hard HEAD

# Fazer o pull
git pull origin main
```

---

## 🎯 Sequência Completa Recomendada

```bash
# 1. Descartar mudanças locais no package-lock.json
git checkout -- package-lock.json

# 2. Fazer pull
git pull origin main

# 3. Instalar dependências (vai regenerar package-lock.json)
npm install

# 4. Continuar com o deploy
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart gibaapp-api
pm2 save
sudo systemctl reload nginx
```

---

## 📝 Explicação

O `package-lock.json` é um arquivo gerado automaticamente pelo npm. 
É seguro descartá-lo porque será regenerado quando você executar `npm install`.

**Por que isso acontece?**
- O arquivo foi modificado localmente na VPS (provavelmente por um `npm install` anterior)
- O repositório remoto tem uma versão diferente
- Git não permite sobrescrever mudanças locais sem confirmação

**Solução:**
Descartar as mudanças locais e deixar o `npm install` regenerar o arquivo com as dependências corretas.
