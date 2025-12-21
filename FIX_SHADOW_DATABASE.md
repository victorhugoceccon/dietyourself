# 🔧 Resolver Erro de Shadow Database

## 📋 Problema
O Prisma está falhando ao criar shadow database porque a migração `20251219201943_add_new_features` referencia uma tabela que não existe.

## ✅ Soluções

### **Opção 1: Resetar banco local (se não tiver dados importantes)**

```bash
# Resetar banco local completamente
npx prisma migrate reset

# Isso vai:
# - Deletar todos os dados
# - Aplicar todas as migrações do zero
# - Executar seed (se configurado)
```

### **Opção 2: Usar db push temporariamente (ignora migrações)**

```bash
# Sincronizar schema diretamente sem usar migrações
npx prisma db push

# Depois criar migração normalmente
npx prisma migrate dev --name novodb
```

### **Opção 3: Desabilitar shadow database temporariamente**

Edite `prisma/schema.prisma` e adicione:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // Adicionar esta linha
}
```

E no `.env` adicione:
```
SHADOW_DATABASE_URL="postgresql://usuario:senha@localhost:5432/shadow_db"
```

Depois crie o banco shadow:
```bash
createdb shadow_db
```

### **Opção 4: Marcar migração como aplicada (se já foi aplicada na VPS)**

```bash
# Se a migração já foi aplicada na VPS, marque como aplicada localmente
npx prisma migrate resolve --applied 20251219201943_add_new_features

# Depois criar nova migração
npx prisma migrate dev --name novodb
```

### **Opção 5: Corrigir migração manualmente**

A migração `20251219201943_add_new_features` já foi corrigida para verificar se a tabela existe antes de adicionar a foreign key. Mas você pode precisar resetar o banco local:

```bash
# Resetar banco local
npx prisma migrate reset

# Isso vai aplicar todas as migrações do zero
```

---

## 🚀 Solução Recomendada

Se você **não tem dados importantes** no banco local:

```bash
# Resetar tudo
npx prisma migrate reset

# Depois criar nova migração normalmente
npx prisma migrate dev --name novodb
```

Se você **tem dados importantes** no banco local:

```bash
# Usar db push para sincronizar sem resetar
npx prisma db push

# Depois criar migração
npx prisma migrate dev --name novodb
```

---

## ⚠️ Importante

- `migrate reset` **DELETA TODOS OS DADOS** do banco local
- `db push` sincroniza o schema mas **não cria arquivo de migração**
- Use `migrate dev` para criar migrações que serão aplicadas na VPS

---

**✨ Escolha a opção que melhor se adequa à sua situação!**
