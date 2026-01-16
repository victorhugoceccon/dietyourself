# 🚀 Passo a Passo - Atualizar VPS com Novas Mudanças

## 📋 Pré-requisitos
- Acesso SSH à VPS
- Git configurado e código commitado localmente
- PM2 instalado e rodando na VPS
- Nginx configurado

---

## 🔄 **PASSO 1: No seu computador local (Windows)**

### 1.1 Verificar alterações pendentes
```powershell
git status
```

### 1.2 Adicionar todas as alterações
```powershell
git add .
```

### 1.3 Fazer commit das mudanças
```powershell
git commit -m "feat: atualizações da landing page e melhorias gerais"
```
*(Ajuste a mensagem conforme suas alterações)*

### 1.4 Enviar para o repositório remoto
```powershell
git push origin main
```
*(Ou `git push origin master` se sua branch principal for master)*

**✅ Aguarde a confirmação de que o push foi bem-sucedido**

---

## 🖥️ **PASSO 2: Conectar na VPS**

### 2.1 Abrir terminal/PowerShell e conectar via SSH
```bash
ssh usuario@seu-ip-da-vps
```
*Exemplo: `ssh root@192.168.1.100` ou `ssh gibaapp@45.33.22.11`*

**✅ Você deve estar conectado na VPS agora**

---

## 📁 **PASSO 3: Ir para o diretório do projeto**

```bash
cd /var/www/gibaapp
```

*(Se o caminho for diferente, ajuste conforme sua configuração)*

**✅ Verifique que está no diretório correto:**
```bash
pwd
ls -la
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

**✅ O código deve estar atualizado agora**

---

## 📦 **PASSO 5: Instalar novas dependências (se houver)**

```bash
npm install
```

**Nota:** Execute sempre para garantir que todas as dependências estão instaladas

**✅ Aguarde a instalação terminar**

---

## 🔧 **PASSO 6: Regenerar Prisma Client**

```bash
npx prisma generate
```

**✅ Prisma Client regenerado**

---

## 🗄️ **PASSO 7: Executar migrations do banco (se houver novas)**

```bash
npx prisma migrate deploy
```

**Nota:** Execute apenas se houver novas migrations no projeto

**✅ Migrations aplicadas**

---

## 🏗️ **PASSO 8: Build do frontend**

```bash
npm run build
```

**✅ Aguarde até aparecer:**
```
✓ built in X.XXs
```

**Verifique se o diretório `dist/` foi criado:**
```bash
ls -la dist/
```

---

## 🚀 **PASSO 9: Reiniciar aplicação com PM2**

### 9.1 Verificar status atual
```bash
pm2 status
```

### 9.2 Reiniciar aplicação
```bash
pm2 restart gibaapp-api
```

**OU se usar ecosystem.config.js:**
```bash
pm2 restart ecosystem.config.js
```

**OU reiniciar todos os processos:**
```bash
pm2 restart all
```

### 9.3 Salvar configuração do PM2
```bash
pm2 save
```

**✅ Aplicação reiniciada**

---

## 🔍 **PASSO 10: Verificar se está funcionando**

### 10.1 Verificar status do PM2
```bash
pm2 status
```

**Deve mostrar algo como:**
```
┌─────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name        │ status  │ restart │ uptime   │
├─────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ gibaapp-api │ online  │ 0       │ 1m       │
└─────┴─────────────┴─────────┴─────────┴──────────┘
```

### 10.2 Ver logs recentes
```bash
pm2 logs gibaapp-api --lines 30
```

**Pressione `Ctrl+C` para sair dos logs**

**✅ Verifique se não há erros nos logs**

### 10.3 Testar API (opcional)
```bash
curl http://localhost:5000/api/health
```

**✅ Se retornar algo, a API está funcionando**

---

## 🌐 **PASSO 11: Recarregar Nginx (se necessário)**

### 11.1 Testar configuração do Nginx
```bash
sudo nginx -t
```

**Deve mostrar:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 11.2 Recarregar Nginx
```bash
sudo systemctl reload nginx
```

**✅ Nginx recarregado**

---

## ✅ **PASSO 12: Testar no navegador**

1. Abra o navegador
2. Acesse: `http://seu-ip-ou-dominio.com` ou `https://seu-dominio.com`
3. Verifique se as novas alterações estão visíveis
4. Teste funcionalidades principais (login, landing page, etc.)

**✅ Tudo funcionando!**

---

## 🎯 **OPÇÃO RÁPIDA: Usar Script Automatizado**

Se você já tem o script `deploy-producao.sh` configurado, pode usar:

```bash
cd /var/www/gibaapp
chmod +x deploy-producao.sh
./deploy-producao.sh
```

**Este script faz todos os passos acima automaticamente!**

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

# Se necessário, matar processo
pm2 delete all
pm2 start ecosystem.config.js
```

### ❌ Erro: "Permission denied"
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER /var/www/gibaapp
chmod -R 755 /var/www/gibaapp
```

### ❌ Backend não responde
```bash
# Ver logs detalhados
pm2 logs gibaapp-api --lines 100

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

## 📝 **Comandos Rápidos (Copiar e Colar)**

### Sequência completa em uma linha:
```bash
cd /var/www/gibaapp && \
git pull origin main && \
npm install && \
npx prisma generate && \
npx prisma migrate deploy && \
npm run build && \
pm2 restart gibaapp-api && \
pm2 save && \
pm2 logs gibaapp-api --lines 20
```

---

## ✅ **Checklist Final**

- [ ] Código commitado e enviado para o repositório (`git push`)
- [ ] Conectado na VPS via SSH
- [ ] Código atualizado (`git pull`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Build criado (`npm run build`)
- [ ] PM2 reiniciado (`pm2 restart`)
- [ ] PM2 salvo (`pm2 save`)
- [ ] Logs sem erros (`pm2 logs`)
- [ ] Nginx recarregado (`sudo systemctl reload nginx`)
- [ ] Site acessível no navegador
- [ ] Funcionalidades testadas

---

## 📞 **Se Precisar de Ajuda**

Execute estes comandos e compartilhe a saída:

```bash
# Status geral
pm2 status
pm2 logs gibaapp-api --lines 50
sudo nginx -t
ls -la dist/
git log --oneline -5
```

---

**✨ Pronto! Sua aplicação está atualizada na VPS!**
