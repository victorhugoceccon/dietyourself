# 🔧 Corrigir Prisma Client Desatualizado

## 📋 Problema

Erro: `The column questionnaire_data.nivelAtividade does not exist`

O Prisma Client foi gerado com uma versão antiga do schema e ainda referencia colunas que foram removidas.

## ✅ Solução

### 1. Limpar cache do Prisma completamente

```bash
cd /opt/dietyourself/dietyourself

# Remover cache do Prisma
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Limpar também o cache do npm (opcional mas recomendado)
npm cache clean --force
```

### 2. Regenerar Prisma Client

```bash
# Regenerar Prisma Client com o schema atual
npx prisma generate
```

### 3. Verificar se o schema está sincronizado com o banco

```bash
# Verificar status das migrações
npx prisma migrate status

# Se houver migrações pendentes, aplicar:
npx prisma migrate deploy
```

### 4. Sincronizar schema com banco (se necessário)

Se o problema persistir, pode ser que o schema do Prisma não esteja sincronizado com o banco real:

```bash
# Puxar schema do banco para o Prisma (cuidado: isso pode sobrescrever mudanças locais)
npx prisma db pull

# Depois regenerar o client
npx prisma generate
```

### 5. Reiniciar servidor

```bash
pm2 restart all --update-env
```

### 6. Verificar logs

```bash
pm2 logs dietyourself-api --err --lines 30
```

---

## 🚀 Solução Rápida Completa

```bash
cd /opt/dietyourself/dietyourself

# 1. Limpar cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Reiniciar servidor
pm2 restart all --update-env

# 4. Verificar logs
pm2 logs dietyourself-api --lines 20
```

---

## 🔍 Verificar Schema do Prisma

Se quiser verificar se o schema está correto:

```bash
# Ver modelo QuestionnaireData no schema
cat prisma/schema.prisma | grep -A 50 "model QuestionnaireData"
```

Não deve conter `nivelAtividade` - deve ter `frequenciaAtividade` em vez disso.

---

**✨ Execute a solução rápida e teste novamente!**
