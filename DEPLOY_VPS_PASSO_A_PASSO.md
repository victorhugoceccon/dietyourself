# 🚀 Passo a Passo - Deploy na VPS

## 📋 Pré-requisitos
- Acesso SSH à VPS
- Git configurado na VPS
- PM2 instalado e rodando
- Nginx configurado

---

## 🔄 **PASSO 1: No seu computador local**

### 1.1 Verificar alterações
```bash
git status
```

### 1.2 Adicionar todas as alterações
```bash
git add .
```

### 1.3 Fazer commit
```bash
git commit -m "fix: corrigir dark mode padrão e melhorias no compartilhamento"
```

### 1.4 Enviar para o repositório
```bash
git push origin main
```

---

## 🖥️ **PASSO 2: Conectar na VPS**

### 2.1 Conectar via SSH
```bash
ssh usuario@seu-ip-da-vps
# Exemplo: ssh root@192.168.1.100
```

---

## 📁 **PASSO 3: Ir para o diretório do projeto**

```bash
# Substitua pelo caminho real do seu projeto
cd /caminho/do/projeto/dietyourself-login

# Exemplos comuns:
# cd /var/www/dietyourself-login
# cd /home/usuario/dietyourself-login
# cd ~/dietyourself-login
```

---

## 🔄 **PASSO 4: Atualizar código do Git**

### 4.1 Verificar branch atual
```bash
git branch
```

### 4.2 Puxar as alterações mais recentes
```bash
git pull origin main
```

**Se der erro de conflito:**
```bash
git stash
git pull origin main
git stash pop
```

---

## 📦 **PASSO 5: Instalar dependências (se necessário)**

```bash
npm install
```

**Nota:** Só execute se houver novas dependências no `package.json`

---

## 🏗️ **PASSO 6: Build do frontend**

```bash
npm run build
```

**Aguarde até aparecer:**
```
✓ built in X.XXs
```

---

## 🔄 **PASSO 7: Regenerar Prisma Client (se necessário)**

```bash
npx prisma generate
```

**Nota:** Execute apenas se houver mudanças no `schema.prisma`

---

## 🚀 **PASSO 8: Reiniciar aplicação com PM2**

### 8.1 Verificar status atual
```bash
pm2 status
```

### 8.2 Reiniciar todos os processos
```bash
pm2 restart all
```

**OU se usar ecosystem.config.js:**
```bash
pm2 restart ecosystem.config.js
```

### 8.3 Verificar se está rodando corretamente
```bash
pm2 logs --lines 50
```

**Pressione `Ctrl+C` para sair dos logs**

---

## 🔍 **PASSO 9: Verificar se está funcionando**

### 9.1 Verificar processos PM2
```bash
pm2 status
```

**Deve mostrar algo como:**
```
┌─────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name        │ status  │ restart │ uptime   │
├─────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ server      │ online  │ 0       │ 5m       │
│ 1   │ vite        │ online  │ 0       │ 5m       │
└─────┴─────────────┴─────────┴─────────┴──────────┘
```

### 9.2 Testar API do backend
```bash
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifefit.com","password":"123456"}'
```

**Se funcionar, deve retornar JSON com token.**

### 9.3 Verificar se o build foi criado
```bash
ls -la dist/
```

**Deve mostrar arquivos como `index.html`, `assets/`, etc.**

---

## 🌐 **PASSO 10: Verificar Nginx (se necessário)**

### 10.1 Testar configuração do Nginx
```bash
sudo nginx -t
```

**Deve mostrar:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 10.2 Recarregar Nginx (se fez alterações)
```bash
sudo systemctl reload nginx
```

### 10.3 Verificar status do Nginx
```bash
sudo systemctl status nginx
```

---

## ✅ **PASSO 11: Testar no navegador**

1. Abra o navegador
2. Acesse: `http://seu-ip-ou-dominio.com`
3. Tente fazer login
4. Verifique se o dark mode está desativado por padrão

---

## 🐛 **Troubleshooting**

### ❌ Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart all
```

### ❌ Erro: "Port already in use"
```bash
# Verificar qual processo está usando a porta
sudo lsof -i :5000
sudo lsof -i :5173

# Matar processo se necessário
pm2 delete all
pm2 start ecosystem.config.js
```

### ❌ Erro: "Permission denied"
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER /caminho/do/projeto
chmod -R 755 /caminho/do/projeto
```

### ❌ Backend não responde
```bash
# Ver logs detalhados
pm2 logs 0 --lines 100

# Verificar variáveis de ambiente
cat .env | grep DATABASE_URL
cat .env | grep PORT

# Reiniciar com logs
pm2 restart all --update-env
```

### ❌ Frontend não carrega
```bash
# Verificar se o build existe
ls -la dist/

# Verificar Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📝 **Comandos rápidos (copiar e colar)**

```bash
# Sequência completa em uma linha
cd /caminho/do/projeto/dietyourself-login && \
git pull origin main && \
npm install && \
npm run build && \
npx prisma generate && \
pm2 restart all && \
pm2 logs --lines 20
```

---

## 🎯 **Checklist final**

- [ ] Código atualizado (`git pull`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Build criado (`npm run build`)
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] PM2 reiniciado (`pm2 restart all`)
- [ ] Backend respondendo (`curl` testou OK)
- [ ] Frontend acessível no navegador
- [ ] Login funcionando
- [ ] Dark mode desativado por padrão

---

## 📞 **Se precisar de ajuda**

Execute estes comandos e compartilhe a saída:

```bash
# Status geral
pm2 status
pm2 logs --lines 50
sudo nginx -t
ls -la dist/
```

---

**✨ Pronto! Sua aplicação está atualizada na VPS!**
