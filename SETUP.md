# 🚀 Guia de Configuração - DietYourself Login

## 📋 Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **PostgreSQL** instalado e rodando
3. **npm** ou **yarn**

## 🔧 Passo a Passo

### 1. Instalar Dependências

```bash
cd C:\Users\victo\dietyourself-login
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

#### Criar o banco de dados:
```sql
CREATE DATABASE dietyourself;
```

#### Configurar a conexão:
Edite o arquivo `.env` e ajuste a `DATABASE_URL`:

```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/dietyourself?schema=public"
```

**Exemplo:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dietyourself?schema=public"
```

### 3. Gerar Prisma Client

```bash
npm run db:generate
```

### 4. Criar as Tabelas no Banco

```bash
npm run db:migrate
```

Este comando vai:
- Criar as tabelas no PostgreSQL
- Criar o arquivo de migração
- Aplicar as mudanças no banco

### 5. Executar o Projeto

```bash
npm run dev
```

Este comando inicia:
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:5173`

## 📡 Endpoints da API

### POST `/api/auth/register`
Registrar novo usuário

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário" // opcional
}
```

### POST `/api/auth/login`
Fazer login

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

### GET `/api/auth/me`
Verificar token e obter dados do usuário

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Tokens JWT com validade de 7 dias
- Validação de dados com Zod
- CORS configurado para o frontend

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/dietyourself?schema=public"
JWT_SECRET="seu_jwt_secret_super_seguro_aqui"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme usuário, senha e nome do banco no `.env`
- Teste a conexão: `psql -U seu_usuario -d dietyourself`

### Erro "Prisma Client not generated"
Execute: `npm run db:generate`

### Porta já em uso
Altere a porta no arquivo `.env` ou mate o processo que está usando a porta 5000

## 📚 Comandos Úteis

```bash
# Ver banco de dados no Prisma Studio
npm run db:studio

# Criar nova migração
npm run db:migrate

# Gerar Prisma Client
npm run db:generate

# Rodar backend e frontend juntos
npm run dev
```

