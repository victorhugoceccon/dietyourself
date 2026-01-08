# 🔧 Troubleshooting: Erro 500 no Login

## 📋 Problema

Erro `500 (Internal Server Error)` ao tentar fazer login na VPS.

## 🔍 Passos para Diagnosticar

### 1. Verificar Logs do Servidor

```bash
# Ver logs do PM2
pm2 logs

# OU ver logs específicos do processo
pm2 logs dietyourself-login --lines 100

# Verificar se há erros recentes
pm2 logs dietyourself-login --err --lines 50
```

**Procure por:**
- `Erro ao fazer login:` seguido de detalhes do erro
- Erros de conexão com banco de dados
- Erros de Prisma Client não encontrado

---

### 2. Verificar Variáveis de Ambiente

```bash
# Na VPS, verificar se o arquivo .env existe e tem as variáveis corretas
cat .env | grep -E "(DATABASE_URL|JWT_SECRET)"

# Verificar se DATABASE_URL está correto
echo $DATABASE_URL
```

**Verifique:**
- `DATABASE_URL` está configurado corretamente
- `JWT_SECRET` está definido (ou está usando o padrão)
- Formato: `postgresql://usuario:senha@localhost:5432/dietyourself_db`

---

### 3. Verificar Prisma Client

```bash
# Na VPS, verificar se Prisma Client está gerado
cd /caminho/do/projeto/dietyourself-login
npx prisma generate

# Verificar se node_modules está atualizado
npm install
```

---

### 4. Verificar Conexão com Banco de Dados

```bash
# Testar conexão direta
psql -U dietyourself_user -d dietyourself_db -c "SELECT 1;"

# Verificar se o usuário existe e tem senha
psql -U dietyourself_user -d dietyourself_db -c "SELECT email, CASE WHEN password IS NULL THEN 'NULL' WHEN password = '' THEN 'VAZIO' ELSE 'OK' END as senha_status FROM users WHERE email = 'admin@lifefit.com';"
```

**Se a senha estiver NULL ou VAZIO:**
- Execute o script `create-test-users-postgres.sql` novamente
- Ou atualize manualmente a senha do usuário

---

### 5. Verificar se Usuário Existe e Tem Senha

```bash
# Verificar usuários e status da senha
psql -U dietyourself_user -d dietyourself_db -c "
SELECT 
  email, 
  name,
  role,
  CASE 
    WHEN password IS NULL THEN 'SENHA NULL'
    WHEN password = '' THEN 'SENHA VAZIA'
    WHEN LENGTH(password) < 50 THEN 'SENHA INVÁLIDA'
    ELSE 'OK'
  END as senha_status,
  LENGTH(password) as tamanho_hash
FROM users 
WHERE email IN (
  'admin@lifefit.com',
  'nutricionista@lifefit.com',
  'personal@lifefit.com',
  'paciente@teste.com'
)
ORDER BY email;
"
```

---

### 6. Atualizar Senha Manualmente (se necessário)

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db

# Atualizar senha do admin (hash de "123456")
UPDATE "users" 
SET "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO'
WHERE email = 'admin@lifefit.com';

# Atualizar senha do nutricionista
UPDATE "users" 
SET "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO'
WHERE email = 'nutricionista@lifefit.com';

# Atualizar senha do personal
UPDATE "users" 
SET "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO'
WHERE email = 'personal@lifefit.com';

# Atualizar senha dos pacientes
UPDATE "users" 
SET "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO'
WHERE email IN ('paciente@teste.com', 'maria@teste.com', 'teste@teste.com');
```

---

### 7. Reiniciar Servidor

```bash
# Reiniciar PM2
pm2 restart all

# OU reiniciar processo específico
pm2 restart dietyourself-login

# Verificar status
pm2 status
```

---

### 8. Testar Login via cURL

```bash
# Testar login diretamente na API
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifefit.com","password":"123456"}'

# Se funcionar localmente mas não na VPS, verificar Nginx
```

---

## 🚨 Problemas Comuns

### Problema 1: Prisma Client não gerado
**Solução:**
```bash
npx prisma generate
pm2 restart all
```

### Problema 2: Senha NULL no banco
**Solução:** Execute `create-test-users-postgres.sql` novamente ou atualize manualmente (passo 6)

### Problema 3: DATABASE_URL incorreto
**Solução:** Verifique o arquivo `.env` e reinicie o servidor

### Problema 4: Erro de conexão com banco
**Solução:** 
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar se o usuário tem permissões
psql -U dietyourself_user -d dietyourself_db -c "\dt"
```

### Problema 5: Código não atualizado na VPS
**Solução:**
```bash
cd /caminho/do/projeto/dietyourself-login
git pull origin main
npm install
npm run build
npx prisma generate
pm2 restart all
```

---

## 📝 Checklist Rápido

- [ ] Logs do PM2 mostram erro específico?
- [ ] Variáveis de ambiente estão configuradas?
- [ ] Prisma Client está gerado (`npx prisma generate`)?
- [ ] Usuário existe no banco?
- [ ] Senha do usuário não está NULL?
- [ ] Conexão com banco funciona (`psql`)?
- [ ] Servidor foi reiniciado após mudanças?
- [ ] Código está atualizado na VPS (`git pull`)?

---

## 🔄 Solução Rápida (Tentar Primeiro)

```bash
# 1. Atualizar código
cd /caminho/do/projeto/dietyourself-login
git pull origin main

# 2. Reinstalar dependências e gerar Prisma
npm install
npx prisma generate

# 3. Recriar usuários de teste
sudo -u postgres psql -d dietyourself_db -f create-test-users-postgres.sql

# 4. Reiniciar servidor
pm2 restart all

# 5. Verificar logs
pm2 logs --lines 50
```

---

**✨ Se o problema persistir, verifique os logs detalhados do PM2 para identificar o erro específico!**
