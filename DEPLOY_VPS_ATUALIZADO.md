# 🚀 Guia Completo - Deploy na VPS (Atualizado)

## 📋 Resumo das Alterações Recentes

As seguintes alterações foram feitas e precisam ser deployadas:
- ✅ Correção do import do `jspdf` (PDFs de dieta e treino)
- ✅ PDFs completos com todas as informações (alimentos, substituições, análises, etc.)
- ✅ Novos estilos CSS para os PDFs
- ✅ Melhorias gerais no código

---

## 🔄 **PASSO 1: Preparar Código Local (Windows)**

### 1.1 Verificar status do Git
```powershell
git status
```

### 1.2 Adicionar todas as alterações
```powershell
git add .
```

### 1.3 Fazer commit
```powershell
git commit -m "feat: correção jspdf e PDFs completos com todas informações"
```

### 1.4 Enviar para o repositório
```powershell
git push origin main
```

**✅ Aguarde confirmação do push**

---

## 🖥️ **PASSO 2: Conectar na VPS**

```bash
ssh usuario@seu-ip-da-vps
```

*Exemplo: `ssh root@192.168.1.100` ou `ssh gibaapp@45.33.22.11`*

---

## 📁 **PASSO 3: Ir para o Diretório do Projeto**

```bash
cd /var/www/gibaapp
```

*(Ajuste o caminho conforme sua configuração)*

Verificar localização:
```bash
pwd
ls -la
```

---

## 🔄 **PASSO 4: Atualizar Código do Git**

### 4.1 Verificar branch
```bash
git branch
```

### 4.2 Puxar alterações
```bash
git pull origin main
```

**Se houver conflitos:**
```bash
git stash
git pull origin main
git stash pop
```

**✅ Código atualizado**

---

## 📦 **PASSO 5: Instalar Dependências**

**IMPORTANTE:** As novas dependências (`jspdf`, `html2canvas`) precisam ser instaladas:

```bash
npm install
```

**✅ Aguarde a instalação terminar**

Verificar se as dependências foram instaladas:
```bash
npm list jspdf html2canvas
```

---

## 🔧 **PASSO 6: Regenerar Prisma Client**

```bash
npx prisma generate
```

**✅ Prisma Client regenerado**

---

## 🗄️ **PASSO 7: Executar Migrations (se houver novas)**

```bash
npx prisma migrate deploy
```

**Nota:** Execute apenas se houver novas migrations. Se não houver, o comando informará.

**✅ Migrations aplicadas (ou nenhuma nova migration)**

---

## 🏗️ **PASSO 8: Build do Frontend**

```bash
npm run build
```

**✅ Aguarde até aparecer:**
```
✓ built in X.XXs
```

Verificar se o diretório `dist/` foi criado:
```bash
ls -la dist/
```

Verificar se os arquivos foram gerados corretamente:
```bash
ls -la dist/assets/ | head -20
```

---

## 🚀 **PASSO 9: Reiniciar Aplicação com PM2**

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

**OU reiniciar todos:**
```bash
pm2 restart all
```

### 9.3 Salvar configuração
```bash
pm2 save
```

**✅ Aplicação reiniciada**

---

## 🔍 **PASSO 10: Verificar Funcionamento**

### 10.1 Status do PM2
```bash
pm2 status
```

**Deve mostrar:**
```
┌─────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name        │ status  │ restart │ uptime   │
├─────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ gibaapp-api │ online  │ 0       │ 1m       │
└─────┴─────────────┴─────────┴─────────┴──────────┘
```

### 10.2 Ver logs recentes
```bash
pm2 logs gibaapp-api --lines 50
```

**Pressione `Ctrl+C` para sair**

**✅ Verifique se não há erros**

### 10.3 Testar API (opcional)
```bash
curl http://localhost:8081/api/health
```

*(Ajuste a porta conforme sua configuração - pode ser 5000 ou 8081)*

---

## 🌐 **PASSO 11: Recarregar Nginx**

### 11.1 Testar configuração
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

## ✅ **PASSO 12: Testar no Navegador**

1. Abra o navegador
2. Acesse: `https://seu-dominio.com` ou `http://seu-ip`
3. Teste as funcionalidades:
   - ✅ Login funciona
   - ✅ Página de dieta carrega
   - ✅ Botão "Baixar PDF" da dieta funciona
   - ✅ Página de treino carrega
   - ✅ Botão "Baixar PDF" do treino funciona
   - ✅ PDFs contêm todas as informações (alimentos, substituições, análises)

**✅ Tudo funcionando!**

---

## 🎯 **OPÇÃO RÁPIDA: Script Automatizado**

Se você tem o script `deploy-producao.sh`:

```bash
cd /var/www/gibaapp
chmod +x deploy-producao.sh
./deploy-producao.sh
```

---

## 📝 **Comandos Rápidos (Sequência Completa)**

Copie e cole tudo de uma vez:

```bash
cd /var/www/gibaapp && \
git pull origin main && \
npm install && \
npx prisma generate && \
npx prisma migrate deploy && \
npm run build && \
pm2 restart gibaapp-api && \
pm2 save && \
sudo systemctl reload nginx && \
pm2 logs gibaapp-api --lines 20
```

---

## 🐛 **Troubleshooting**

### ❌ Erro: "Cannot find module 'jspdf'"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart all
```

### ❌ Erro: "Failed to resolve import 'jspdf'"
```bash
# Verificar se está instalado
npm list jspdf html2canvas

# Se não estiver, instalar manualmente
npm install jspdf html2canvas

# Rebuild
npm run build
pm2 restart all
```

### ❌ Erro: "Port already in use"
```bash
# Verificar qual processo está usando a porta
sudo lsof -i :8081

# Se necessário, matar processo
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
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

### ❌ PDFs não funcionam
```bash
# Verificar se as dependências estão instaladas
npm list jspdf html2canvas

# Se não estiverem, instalar
npm install jspdf html2canvas

# Rebuild
npm run build
pm2 restart all
```

---

## ✅ **Checklist Final**

- [ ] Código commitado e enviado (`git push`)
- [ ] Conectado na VPS via SSH
- [ ] Código atualizado (`git pull`)
- [ ] Dependências instaladas (`npm install`)
- [ ] `jspdf` e `html2canvas` instalados
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Build criado (`npm run build`)
- [ ] Diretório `dist/` existe e tem arquivos
- [ ] PM2 reiniciado (`pm2 restart`)
- [ ] PM2 salvo (`pm2 save`)
- [ ] Logs sem erros (`pm2 logs`)
- [ ] Nginx recarregado (`sudo systemctl reload nginx`)
- [ ] Site acessível no navegador
- [ ] PDFs de dieta funcionam
- [ ] PDFs de treino funcionam
- [ ] PDFs contêm todas as informações

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
npm list jspdf html2canvas
```

---

## 🎉 **Pronto!**

Sua aplicação está atualizada na VPS com todas as melhorias!

**Principais melhorias deployadas:**
- ✅ PDFs completos e funcionais
- ✅ Todas as informações incluídas nos PDFs
- ✅ Correções de imports
- ✅ Melhorias de performance
