# 🌱 Seed de Usuários Padrão

## Descrição
Script para criar usuários padrão no banco de dados após migrations ou limpeza.

## Como Usar

### Opção 1: Usando npm script (Recomendado)
```bash
npm run db:seed
```

### Opção 2: Executar diretamente
```bash
node prisma/seed.js
```

## Usuários Criados

### 👤 Administrador
- **Email:** `admin@lifefit.com`
- **Senha:** `123456`
- **Roles:** ADMIN, NUTRICIONISTA, PERSONAL

### 🥗 Nutricionista
- **Email:** `nutricionista@lifefit.com`
- **Senha:** `123456`
- **Roles:** NUTRICIONISTA

### 💪 Personal Trainer
- **Email:** `personal@lifefit.com`
- **Senha:** `123456`
- **Roles:** PERSONAL

### 👤 Pacientes

#### Paciente 1
- **Email:** `paciente@teste.com`
- **Senha:** `123456`
- **Nutricionista:** Dr. Ana Silva
- **Personal:** Carlos Personal
- **Questionário:** Preenchido com dados de exemplo

#### Paciente 2
- **Email:** `maria@teste.com`
- **Senha:** `123456`
- **Nutricionista:** Dr. Ana Silva
- **Personal:** Carlos Personal

#### Paciente 3
- **Email:** `teste@teste.com`
- **Senha:** `123456`
- **Nutricionista:** Dr. Ana Silva

## Observações

- O script usa `upsert`, então pode ser executado múltiplas vezes sem criar duplicatas
- As senhas são hasheadas com bcrypt (salt rounds: 10)
- O paciente 1 já vem com questionário preenchido para testes
- Os pacientes estão vinculados aos profissionais criados

## Fluxo Completo de Setup

```bash
# 1. Gerar Prisma Client
npx prisma generate

# 2. Aplicar migrations
npx prisma migrate dev --name add_new_features

# 3. Popular com usuários padrão
npm run db:seed

# 4. Iniciar servidor
npm run dev
```

## Personalização

Para modificar os usuários padrão, edite o arquivo:
```
prisma/seed.js
```


