# 🔧 Resolver Erro de Conexão no Login

## ❌ Problema

Erro `ERR_CONNECTION_RESET` ao tentar fazer login:
```
Failed to load resource: net::ERR_CONNECTION_RESET
TypeError: Failed to fetch
```

## 🔍 Causa

O frontend está tentando conectar ao backend na porta errada ou o backend não está rodando.

## ✅ Soluções

### **Solução 1: Verificar se o Backend está Rodando**

```bash
# Verificar se o backend está rodando
pm2 status

# Se não estiver, iniciar:
pm2 start server/index.js --name gibaapp-api --env production

# Ver logs:
pm2 logs gibaapp-api
```

### **Solução 2: Verificar Porta do Backend**

O backend pode estar rodando na porta **8081** ou **5000**. Verifique:

```bash
# Ver qual porta está configurada no .env
cat .env | grep PORT

# Ver qual porta está em uso
netstat -tlnp | grep -E ':(5000|8081)'
# ou
ss -tlnp | grep -E ':(5000|8081)'
```

### **Solução 3: Atualizar Configuração do Vite (Desenvolvimento)**

Se estiver em **desenvolvimento local**, o `vite.config.js` precisa apontar para a porta correta:

**Se backend está na porta 8081:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // ← Mudar para 8081
        changeOrigin: true,
      },
    },
  },
})
```

**Se backend está na porta 5000:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ← Manter 5000
        changeOrigin: true,
      },
    },
  },
})
```

### **Solução 4: Criar/Atualizar .env (Desenvolvimento)**

Criar arquivo `.env` na raiz do projeto:

```env
# Para desenvolvimento local
VITE_API_URL=http://localhost:8081/api
# ou
VITE_API_URL=http://localhost:5000/api
```

**Depois, reiniciar o servidor de desenvolvimento:**
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### **Solução 5: Verificar CORS (Se backend está em outra origem)**

Se o backend está em outra origem (ex: `http://192.168.1.100:8081`), pode haver problema de CORS.

**No backend (`server/index.js`), verificar se CORS está configurado:**
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // URLs do frontend
  credentials: true
}))
```

### **Solução 6: Testar Conexão Manualmente**

```bash
# Testar se o backend responde
curl http://localhost:8081/api/health
# ou
curl http://localhost:5000/api/health

# Testar endpoint de login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"senha123"}'
```

## 🎯 Checklist de Verificação

- [ ] Backend está rodando? (`pm2 status`)
- [ ] Qual porta o backend está usando? (verificar `.env` e logs)
- [ ] `vite.config.js` aponta para a porta correta?
- [ ] Arquivo `.env` existe e tem `VITE_API_URL` configurado?
- [ ] Servidor de desenvolvimento foi reiniciado após mudanças?
- [ ] CORS está configurado no backend?

## 📝 Notas

- **Em desenvolvimento:** Use o proxy do Vite (`/api`) ou configure `VITE_API_URL`
- **Em produção:** O Nginx faz o proxy, então use `/api` (caminho relativo)
- **Porta padrão:** O backend pode estar em 8081 (conforme logs anteriores) ou 5000
