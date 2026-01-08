# 👥 Criar Usuários de Teste - Script SQL Direto

## 📋 Script SQL Completo

Execute diretamente como usuário **postgres**:

```bash
# Na VPS
sudo -u postgres psql -d dietyourself_db -f create-test-users-postgres.sql
```

**OU execute manualmente:**

```bash
# Conectar como postgres
sudo -u postgres psql -d dietyourself_db
```

Depois cole e execute todo o conteúdo do arquivo `create-test-users-postgres.sql`.

---

## ✅ Usuários Criados

| Tipo | Email | Senha |
|------|-------|-------|
| 👤 Admin | `admin@lifefit.com` | `123456` |
| 🥗 Nutricionista | `nutricionista@lifefit.com` | `123456` |
| 💪 Personal | `personal@lifefit.com` | `123456` |
| 👤 Paciente 1 | `paciente@teste.com` | `123456` |
| 👤 Paciente 2 | `maria@teste.com` | `123456` |
| 👤 Paciente 3 | `teste@teste.com` | `123456` |

**Nota:** 
- O Paciente 1 já vem com questionário preenchido!
- Todos os pacientes estão vinculados ao nutricionista e personal (exceto Paciente 3 que só tem nutricionista)

---

## 🚀 Comando Rápido

```bash
sudo -u postgres psql -d dietyourself_db -f create-test-users-postgres.sql
```

---

## 🔍 Verificar se Funcionou

```bash
# Ver usuários criados
psql -U dietyourself_user -d dietyourself_db -c "SELECT email, name, role FROM users WHERE email LIKE '%@lifefit.com' OR email LIKE '%@teste.com' ORDER BY role, email;"

# Ver questionário do paciente 1
psql -U dietyourself_user -d dietyourself_db -c "SELECT u.email, q.idade, q.objetivo FROM users u JOIN questionnaire_data q ON u.id = q.\"userId\" WHERE u.email = 'paciente@teste.com';"
```

---

## ⚠️ Importante

- O script usa `ON CONFLICT DO UPDATE`, então **não duplica** usuários existentes
- Se o usuário já existe, apenas atualiza os dados
- As senhas são hasheadas com bcrypt (10 rounds)
- O hash da senha "123456" está incluído no script

---

**✨ Execute o script e os usuários serão criados!**
