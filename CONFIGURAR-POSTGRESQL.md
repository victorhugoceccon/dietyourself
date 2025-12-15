# 🐘 Configuração do PostgreSQL - Guia Completo

## ⚠️ Situação Atual

O PostgreSQL não está acessível no momento. Siga estes passos para configurar:

## 📋 Opção 1: PostgreSQL já instalado

### 1. Verificar se está rodando
```powershell
# Verificar serviços PostgreSQL
Get-Service | Where-Object { $_.Name -like "*postgres*" }

# Se encontrar um serviço, iniciar:
Start-Service postgresql-x64-16  # (ajuste o nome do serviço)
```

### 2. Criar o banco de dados

**Método A: Usando Script PowerShell**
```powershell
.\setup-database.ps1
```

**Método B: Usando psql (se estiver no PATH)**
```bash
psql -U postgres
CREATE DATABASE dietyourself;
\q
```

**Método C: Usando pgAdmin**
1. Abra o pgAdmin
2. Conecte-se ao servidor PostgreSQL
3. Clique com botão direito em "Databases" → "Create" → "Database"
4. Nome: `dietyourself`
5. Clique em "Save"

**Método D: Usando arquivo SQL**
```bash
psql -U postgres -f create-database.sql
```

### 3. Configurar .env
Verifique se o arquivo `.env` tem a conexão correta:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/dietyourself?schema=public"
```

### 4. Executar Migration
```bash
npm run db:migrate
```

---

## 📦 Opção 2: Instalar PostgreSQL

Se o PostgreSQL não estiver instalado:

### Download e Instalação

1. **Download**: https://www.postgresql.org/download/windows/
   - Ou use o instalador automático: https://www.postgresql.org/download/windows/enterprisedb/

2. **Durante a instalação:**
   - Porta: `5432` (padrão)
   - Usuário: `postgres`
   - Senha: anote a senha que você definir!

3. **Após instalação:**
   - Adicione PostgreSQL ao PATH (opcional):
     - `C:\Program Files\PostgreSQL\16\bin` (ajuste a versão)

### Depois da instalação:

```bash
# Criar banco
psql -U postgres
CREATE DATABASE dietyourself;
\q

# Executar migration
npm run db:migrate
```

---

## 🔍 Verificar Instalação

### Testar conexão:
```bash
psql -U postgres -h localhost -p 5432 -d postgres
```

Se conectar, está tudo certo!

---

## ⚙️ Configuração do .env

Depois de criar o banco, ajuste o `.env`:

```env
# Se você definiu senha durante instalação:
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/dietyourself?schema=public"

# Se não tem senha (não recomendado):
DATABASE_URL="postgresql://postgres@localhost:5432/dietyourself?schema=public"
```

---

## ✅ Após Configurar

Execute:
```bash
npm run db:migrate
```

Isso vai criar as tabelas no banco de dados.

---

## 🆘 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Verifique a porta (padrão: 5432)
- Verifique firewall

### Erro: "password authentication failed"
- Verifique a senha no `.env`
- Tente resetar a senha do postgres

### Erro: "database does not exist"
- Crie o banco primeiro (veja métodos acima)

### PostgreSQL não encontrado
- Verifique se está instalado
- Adicione ao PATH ou use o caminho completo

---

## 📝 Próximos Passos

Após configurar o PostgreSQL:

1. ✅ Banco criado
2. ✅ `.env` configurado
3. ✅ `npm run db:migrate` executado
4. ✅ `npm run dev` para rodar o projeto


