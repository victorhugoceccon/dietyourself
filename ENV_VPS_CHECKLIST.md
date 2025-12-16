# Checklist de Variáveis de Ambiente para VPS

## Variáveis Obrigatórias no `.env` da VPS:

### 1. **Banco de Dados**
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/dietyourself_db?schema=public"
```

### 2. **JWT Secret**
```env
JWT_SECRET="sua_chave_secreta_jwt_aqui"
```

### 3. **Servidor Backend**
```env
PORT=5000
FRONTEND_URL="http://seu-ip-ou-dominio:8081"
```

### 4. **N8N Integration**
```env
N8N_WEBHOOK_URL="http://seu-ip:8080/webhook/chat-dietyourself"
N8N_API_KEY="sua_api_key_n8n"
N8N_TIMEOUT=600000
```
**Nota:** `N8N_TIMEOUT` está em milissegundos (600000 = 10 minutos)

### 5. **Frontend (arquivo `client/.env` ou `.env` na raiz)**
```env
VITE_API_URL=http://seu-ip:5000/api
```

### 6. **Ambiente (opcional mas recomendado)**
```env
NODE_ENV=production
```

## ⚠️ IMPORTANTE - Verificações na VPS:

1. **Backend `.env`** deve estar em: `/opt/dietyourself/dietyourself/.env`
2. **Frontend `.env`** (se existir) deve estar em: `/opt/dietyourself/dietyourself/client/.env` ou na raiz
3. **DATABASE_URL** deve usar PostgreSQL, não SQLite
4. **FRONTEND_URL** deve apontar para a URL onde o frontend está rodando (ex: IP:8081)
5. **N8N_WEBHOOK_URL** deve usar o IP correto da VPS onde o N8N está rodando


