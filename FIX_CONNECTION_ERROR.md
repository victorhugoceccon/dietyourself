# 🔧 Correção: Erro de Conexão

## Problema
Após as mudanças, o servidor não está acessível.

## Solução Passo a Passo

### 1. **Parar o servidor** (se estiver rodando)
Pressione `Ctrl+C` no terminal onde o servidor está rodando.

### 2. **Regenerar o Prisma Client**
Os novos models (Notification, DietTemplate, BodyMeasurement, Recipe) precisam ser gerados:

```bash
npx prisma generate
```

### 3. **Aplicar as migrations** (se ainda não aplicou)
```bash
npx prisma db execute --file ./prisma/migrations/20251219_add_new_features/migration.sql --schema ./prisma/schema.prisma
```

Ou use o Prisma Migrate (recomendado):
```bash
npx prisma migrate dev --name add_new_features
```

### 4. **Reiniciar o servidor**
```bash
npm run dev
```

---

## Verificações Adicionais

### Se ainda houver erro, verifique:

1. **Porta 5000 está livre?**
   - O servidor usa a porta 5000 por padrão
   - Verifique se outra aplicação não está usando essa porta

2. **Variáveis de ambiente**
   - Verifique se o arquivo `.env` tem `DATABASE_URL` configurado

3. **Logs do servidor**
   - Veja o terminal onde o servidor está rodando
   - Procure por mensagens de erro específicas

4. **Teste a rota de health**
   - Acesse: `http://localhost:5000/api/health`
   - Deve retornar: `{"message":"Servidor funcionando!","timestamp":"..."}`

---

## Erros Comuns

### ❌ "Cannot find module './middleware/auth.js'"
**Solução:** O middleware `requireRole` foi adicionado. Verifique se o arquivo `server/middleware/auth.js` existe e tem a função exportada.

### ❌ "PrismaClient is not configured"
**Solução:** Execute `npx prisma generate`

### ❌ "Table does not exist"
**Solução:** Execute a migration SQL ou `npx prisma migrate dev`

### ❌ "Port 5000 is already in use"
**Solução:** 
- Pare o processo que está usando a porta 5000
- Ou altere a porta no `.env`: `PORT=5001`

---

## Teste Rápido

Após seguir os passos acima, teste:

```bash
# Terminal 1 - Servidor
npm run dev

# Terminal 2 - Teste
curl http://localhost:5000/api/health
```

Deve retornar JSON com mensagem de sucesso.


