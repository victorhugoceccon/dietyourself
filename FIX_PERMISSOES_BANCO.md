# 🔐 Corrigir Permissões do Banco de Dados

## 📋 Problema

Erro `42501: permission denied for table users` ao tentar fazer login.

O usuário `dietyourself_user` não tem permissões para acessar as tabelas do banco.

## ✅ Solução

Execute o script SQL como usuário **postgres**:

```bash
# Na VPS
sudo -u postgres psql -d dietyourself_db -f fix-database-permissions.sql
```

**OU execute manualmente:**

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db

# Depois cole e execute todo o conteúdo do arquivo fix-database-permissions.sql
```

---

## 🔍 Verificar se Funcionou

```bash
# Testar login novamente no frontend
# OU testar via cURL
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifefit.com","password":"123456"}'
```

---

## 📝 O que o Script Faz

1. **Concede permissões** na tabela `users` e outras tabelas principais
2. **Concede permissões** em todas as sequências (para IDs auto-incrementais)
3. **Define permissões padrão** para tabelas futuras
4. **Verifica** se as permissões foram aplicadas corretamente

---

## 🚨 Se o Problema Persistir

Verifique se o usuário `dietyourself_user` existe:

```bash
sudo -u postgres psql -d dietyourself_db -c "\du dietyourself_user"
```

Se não existir, crie:

```bash
sudo -u postgres psql -d dietyourself_db -c "CREATE USER dietyourself_user WITH PASSWORD 'sua_senha_aqui';"
```

Depois execute o script de permissões novamente.

---

**✨ Execute o script e teste o login novamente!**
