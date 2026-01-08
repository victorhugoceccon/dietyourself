# 🔧 Corrigir VPS Completamente - Guia Definitivo

## 📋 Problema
A VPS tem problemas de permissões e migrações não estão sendo aplicadas corretamente.

## ✅ Solução Completa

### **Passo 1: Executar script SQL completo (como postgres)**

```bash
# Na VPS
sudo -u postgres psql -d dietyourself_db -f fix-vps-completo.sql
```

**OU execute manualmente:**

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db
```

Depois cole e execute todo o conteúdo do arquivo `fix-vps-completo.sql`.

---

### **Passo 2: Verificar permissões**

```bash
# Verificar owner das tabelas
sudo -u postgres psql -d dietyourself_db -c "\dt"

# Deve mostrar que todas as tabelas pertencem a dietyourself_user
```

---

### **Passo 3: Aplicar migrações e regenerar Prisma**

```bash
cd /caminho/do/projeto/dietyourself-login

# Parar servidor
pm2 stop all

# Verificar status das migrações
npx prisma migrate status

# Deve mostrar: "Database schema is up to date!"

# Regenerar Prisma Client
npx prisma generate

# Build frontend
npm run build

# Reiniciar servidor
pm2 restart all
```

---

## 🚀 Sequência Completa (Uma Linha)

```bash
# 1. Executar script SQL
sudo -u postgres psql -d dietyourself_db -f fix-vps-completo.sql

# 2. Atualizar código e regenerar
cd /caminho/do/projeto/dietyourself-login && \
git pull origin main && \
npm install && \
pm2 stop all && \
npx prisma migrate status && \
npx prisma generate && \
npm run build && \
pm2 restart all
```

---

## 🔍 Verificar se Funcionou

```bash
# 1. Verificar migrações
npx prisma migrate status
# Deve mostrar: "Database schema is up to date!"

# 2. Verificar estrutura do questionário
psql -U dietyourself_user -d dietyourself_db -c "\d questionnaire_data"
# Deve mostrar todas as novas colunas

# 3. Verificar logs do servidor
pm2 logs --lines 50
# Não deve ter erros de Prisma

# 4. Testar no navegador
# Tentar fazer login e preencher questionário
```

---

## 🐛 Se Ainda Der Erro

### Erro: "must be owner"
```bash
# Executar novamente o script de permissões
sudo -u postgres psql -d dietyourself_db -f fix-vps-completo.sql
```

### Erro: "Migration failed"
```bash
# Limpar migrações falhadas
sudo -u postgres psql -d dietyourself_db -c "DELETE FROM \"_prisma_migrations\" WHERE \"finished_at\" IS NULL;"

# Marcar todas como aplicadas novamente
sudo -u postgres psql -d dietyourself_db -f fix-vps-completo.sql
```

### Erro: "Unknown argument"
```bash
# Regenerar Prisma Client
npx prisma generate
pm2 restart all
```

---

## ✅ O que o Script Faz

1. ✅ Dá **todas as permissões** ao usuário do aplicativo
2. ✅ Altera **owner de todas as tabelas** para o usuário correto
3. ✅ Altera **owner de todas as sequences**
4. ✅ Cria e configura tabela `_prisma_migrations`
5. ✅ Remove migrações falhadas
6. ✅ Marca todas as migrações como aplicadas
7. ✅ Garante que todas as colunas do questionário existem
8. ✅ Garante que `duracaoMinutos` existe

---

**✨ Após executar este script, a VPS deve estar completamente corrigida!**
