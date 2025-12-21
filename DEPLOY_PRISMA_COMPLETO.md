# 🚀 Deploy Completo com Prisma - Guia Correto

## 📋 Fluxo Correto de Deploy

### **1️⃣ No seu computador LOCAL**

#### 1.1 Fazer alterações no schema.prisma
```bash
# Editar prisma/schema.prisma conforme necessário
```

#### 1.2 Criar nova migração
```bash
# Criar migração baseada nas mudanças
npx prisma migrate dev --name nome_da_migracao

# Isso vai:
# - Criar arquivo SQL em prisma/migrations/
# - Aplicar no banco LOCAL
# - Regenerar Prisma Client
```

#### 1.3 Commit e Push
```bash
git add .
git commit -m "feat: adicionar nova funcionalidade X"
git push origin main
```

---

### **2️⃣ Na VPS**

#### 2.1 Atualizar código
```bash
cd /caminho/do/projeto/dietyourself-login
git pull origin main
```

#### 2.2 Instalar dependências (se necessário)
```bash
npm install
```

#### 2.3 Aplicar migrações no banco de produção
```bash
# Parar servidor
pm2 stop all

# Aplicar migrações pendentes no banco de PRODUÇÃO
npx prisma migrate deploy

# Isso vai:
# - Verificar quais migrações já foram aplicadas
# - Aplicar apenas as novas migrações
# - NÃO vai regenerar o Prisma Client automaticamente
```

#### 2.4 Regenerar Prisma Client
```bash
# IMPORTANTE: Sempre regenerar após aplicar migrações
npx prisma generate
```

#### 2.5 Build do frontend
```bash
npm run build
```

#### 2.6 Reiniciar servidor
```bash
pm2 restart all
```

---

## ⚠️ **IMPORTANTE: Diferença entre `migrate dev` e `migrate deploy`**

### `npx prisma migrate dev` (LOCAL/Desenvolvimento)
- ✅ Cria nova migração baseada em mudanças no schema
- ✅ Aplica migração no banco LOCAL
- ✅ Regenera Prisma Client automaticamente
- ❌ **NÃO usar em produção!**

### `npx prisma migrate deploy` (VPS/Produção)
- ✅ Aplica migrações pendentes no banco
- ✅ Verifica histórico de migrações aplicadas
- ✅ Seguro para produção
- ❌ **NÃO cria novas migrações**
- ❌ **NÃO regenera Prisma Client automaticamente**

---

## 🔄 **Fluxo Completo: Exemplo Prático**

### Cenário: Adicionar nova coluna `telefone` na tabela `users`

#### **LOCAL:**

```bash
# 1. Editar schema.prisma
# Adicionar: telefone String? no model User

# 2. Criar migração
npx prisma migrate dev --name add_telefone_to_user

# 3. Commit e push
git add .
git commit -m "feat: adicionar campo telefone ao usuário"
git push origin main
```

#### **VPS:**

```bash
# 1. Atualizar código
cd /caminho/do/projeto/dietyourself-login
git pull origin main

# 2. Parar servidor
pm2 stop all

# 3. Aplicar migração no banco de produção
npx prisma migrate deploy

# 4. Regenerar Prisma Client (IMPORTANTE!)
npx prisma generate

# 5. Build frontend
npm run build

# 6. Reiniciar servidor
pm2 restart all
```

---

## 🐛 **Problemas Comuns e Soluções**

### Problema 1: "Migration failed"
```bash
# Resolver migração falhada
sudo -u postgres psql -d dietyourself_db -f resolve-failed-migration.sql
npx prisma generate
pm2 restart all
```

### Problema 2: "Schema is not empty" (P3005)
```bash
# Marcar migrações existentes como aplicadas
sudo -u postgres psql -d dietyourself_db -f mark-migrations-applied.sql
npx prisma generate
pm2 restart all
```

### Problema 3: "Unknown argument" no Prisma Client
```bash
# Regenerar Prisma Client sempre após mudanças
npx prisma generate
pm2 restart all
```

---

## ✅ **Checklist de Deploy**

- [ ] Alterações feitas no `schema.prisma` local
- [ ] Migração criada com `npx prisma migrate dev`
- [ ] Código commitado e enviado para git
- [ ] Na VPS: `git pull origin main`
- [ ] Na VPS: `npm install` (se houver novas dependências)
- [ ] Na VPS: `pm2 stop all`
- [ ] Na VPS: `npx prisma migrate deploy` (aplicar migrações)
- [ ] Na VPS: `npx prisma generate` (regenerar Prisma Client)
- [ ] Na VPS: `npm run build` (build frontend)
- [ ] Na VPS: `pm2 restart all` (reiniciar servidor)
- [ ] Verificar logs: `pm2 logs --lines 50`
- [ ] Testar aplicação no navegador

---

## 🚀 **Comando Rápido (Sequência Completa)**

```bash
# Na VPS
cd /caminho/do/projeto/dietyourself-login && \
git pull origin main && \
npm install && \
pm2 stop all && \
npx prisma migrate deploy && \
npx prisma generate && \
npm run build && \
pm2 restart all && \
pm2 logs --lines 30
```

---

## 📝 **Resumo**

1. **LOCAL**: Criar migração com `migrate dev` → Commit → Push
2. **VPS**: Pull → `migrate deploy` → `prisma generate` → Build → Restart

**Nunca use `migrate dev` na VPS!** Use apenas `migrate deploy`.

---

**✨ Agora você tem o fluxo correto de deploy com Prisma!**
