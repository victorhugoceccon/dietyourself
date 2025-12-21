# 🔍 Diagnosticar Problema de Permissões

## 📋 Problema

Mesmo após conceder permissões, o erro `permission denied for table users` persiste.

## ✅ Passos para Diagnosticar

### 1. Verificar qual usuário está sendo usado na DATABASE_URL

```bash
# Na VPS, verificar a DATABASE_URL
cat .env | grep DATABASE_URL

# Deve ser algo como:
# DATABASE_URL="postgresql://dietyourself_user:senha@localhost:5432/dietyourself_db"
```

**IMPORTANTE:** Verifique se o usuário na URL é realmente `dietyourself_user`!

---

### 2. Executar script de diagnóstico

```bash
sudo -u postgres psql -d dietyourself_db -f diagnose-permissions.sql
```

Isso vai mostrar:
- Qual usuário está tentando acessar
- Se o usuário existe
- Em qual schema está a tabela
- Se há problemas com permissões

---

### 3. Verificar se o schema está correto

```bash
sudo -u postgres psql -d dietyourself_db -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users';"
```

A tabela deve estar no schema `public`.

---

### 4. Conceder permissão no schema também

```bash
sudo -u postgres psql -d dietyourself_db -c "GRANT USAGE ON SCHEMA public TO dietyourself_user;"
```

---

### 5. Limpar cache do Prisma e reiniciar

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules/.prisma
npx prisma generate
pm2 restart all
```

---

## 🚨 Possíveis Causas

1. **DATABASE_URL usando usuário diferente**
   - Verifique se está usando `dietyourself_user` e não `postgres` ou outro usuário

2. **Tabela em schema diferente**
   - A tabela pode estar em outro schema além de `public`

3. **Prisma Client em cache**
   - Limpe o cache e regenere o Prisma Client

4. **Pool de conexões antigo**
   - Reinicie o servidor completamente

---

## 🔄 Solução Rápida

```bash
# 1. Verificar DATABASE_URL
cat .env | grep DATABASE_URL

# 2. Conceder permissões no schema também
sudo -u postgres psql -d dietyourself_db -c "GRANT USAGE ON SCHEMA public TO dietyourself_user;"
sudo -u postgres psql -d dietyourself_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;"

# 3. Limpar cache do Prisma
rm -rf node_modules/.prisma
npx prisma generate

# 4. Reiniciar servidor
pm2 restart all --update-env

# 5. Testar novamente
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifefit.com","password":"123456"}'
```

---

**✨ Execute os passos acima e compartilhe os resultados!**
