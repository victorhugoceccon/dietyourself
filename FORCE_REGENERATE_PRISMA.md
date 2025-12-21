# 🔧 Forçar Regeneração Completa do Prisma Client

## 📋 Problema

O Prisma Client ainda referencia colunas antigas (`nivelAtividade`) mesmo após `npx prisma generate`.

## ✅ Solução FORÇADA

Execute estes comandos na VPS na ordem exata:

```bash
cd /opt/dietyourself/dietyourself

# 1. Parar o servidor
pm2 stop all

# 2. Remover COMPLETAMENTE o Prisma Client (mas manter @prisma/engines)
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
# NÃO remover node_modules/@prisma (contém engines necessários)

# 3. Verificar se o schema.prisma está correto (não deve ter nivelAtividade)
grep -n "nivelAtividade" prisma/schema.prisma
# Se aparecer algo, há um problema no schema

# 4. Sincronizar schema com banco (puxar estrutura real do banco)
npx prisma db pull

# 5. Regenerar Prisma Client
npx prisma generate

# 6. Verificar se foi gerado corretamente
grep -r "nivelAtividade" node_modules/.prisma/client/ || echo "✅ Prisma Client não contém nivelAtividade (correto!)"

# 7. Reiniciar servidor
pm2 start all --update-env

# 8. Verificar logs
pm2 logs dietyourself-api --lines 20
```

---

## 🔍 Verificar Schema do Banco

Se o problema persistir, verifique se o banco realmente não tem a coluna:

```bash
sudo -u postgres psql -d dietyourself_db -c "\d questionnaire_data" | grep nivelAtividade
```

Se aparecer `nivelAtividade`, ela ainda existe no banco e precisa ser removida.

---

## 🚨 Se nivelAtividade ainda existir no banco

Execute:

```bash
sudo -u postgres psql -d dietyourself_db -c "ALTER TABLE questionnaire_data DROP COLUMN IF EXISTS \"nivelAtividade\";"
```

Depois execute `npx prisma db pull` e `npx prisma generate` novamente.

---

**✨ Execute os comandos acima na ordem e teste novamente!**
