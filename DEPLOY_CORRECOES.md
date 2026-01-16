# 🚀 Deploy das Correções para VPS

## 📋 Alterações Feitas Localmente

1. ✅ `index.html` - Corrigido prompt de atualização travado
2. ✅ `public/sw.js` - Melhorado resposta do service worker
3. ✅ `ecosystem.config.js` - Convertido para ES module

## 🔄 PASSO 1: No seu computador local (Windows)

### 1.1 Verificar alterações

```powershell
git status
```

### 1.2 Adicionar alterações

```powershell
git add index.html public/sw.js ecosystem.config.js
```

### 1.3 Fazer commit

```powershell
git commit -m "fix: corrigir prompt de atualização e ecosystem.config.js para ES module"
```

### 1.4 Enviar para repositório

```powershell
git push origin main
```

## 🖥️ PASSO 2: Na VPS

### 2.1 Conectar na VPS

```bash
ssh root@seu-ip-vps
```

### 2.2 Ir para o diretório do projeto

```bash
cd /opt/dietyourself/dietyourself
```

### 2.3 Atualizar código

```bash
git pull origin main
```

### 2.4 Criar diretório de logs

```bash
mkdir -p logs
```

### 2.5 Parar processos antigos

```bash
pm2 delete all
```

### 2.6 Iniciar backend

```bash
pm2 start ecosystem.config.js
```

### 2.7 Verificar status

```bash
pm2 status
```

### 2.8 Ver logs

```bash
pm2 logs gibaapp-api --lines 30
```

### 2.9 Salvar configuração

```bash
pm2 save
```

### 2.10 Fazer build do frontend (se necessário)

```bash
npm run build
```

### 2.11 Testar backend

```bash
curl http://localhost:5000/api/health
```

## 🎯 Sequência Completa (Copiar e Colar)

### No seu computador:

```powershell
git add index.html public/sw.js ecosystem.config.js
git commit -m "fix: corrigir prompt de atualização e ecosystem.config.js"
git push origin main
```

### Na VPS:

```bash
cd /opt/dietyourself/dietyourself && \
git pull origin main && \
mkdir -p logs && \
pm2 delete all && \
pm2 start ecosystem.config.js && \
pm2 save && \
pm2 status && \
pm2 logs gibaapp-api --lines 30
```

## ✅ Checklist

- [ ] Alterações commitadas localmente
- [ ] Push feito para repositório
- [ ] Código atualizado na VPS (`git pull`)
- [ ] Diretório de logs criado
- [ ] Backend iniciado com PM2
- [ ] Backend testado (`curl http://localhost:5000/api/health`)
- [ ] Frontend buildado (se necessário)
- [ ] Login testado no navegador

---

**✨ Execute primeiro no seu computador, depois na VPS!**
