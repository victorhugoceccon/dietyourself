# 🔧 Corrigir Traefik Pausado e Configurar SSL

## ❌ Problema

- Serviço Traefik está **pausado** devido a falha anterior
- Traefik usa **variáveis de ambiente**, não `--args`
- Já está configurado com Let's Encrypt (HTTP challenge)

## ✅ Solução

### **PASSO 1: Fazer Rollback do Serviço**

```bash
# Fazer rollback para versão anterior que funcionava
sudo docker service rollback traefik

# Aguardar alguns segundos
sleep 10

# Verificar status
sudo docker service ps traefik
```

### **PASSO 2: Verificar Configuração Atual**

O Traefik já está configurado com:
- ✅ Let's Encrypt: `TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_EMAIL`
- ✅ HTTP Challenge: `TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_HTTPCHALLENGE_ENTRYPOINT=http`
- ✅ Storage: `/data/acme.json` (montado em `/etc/easypanel/traefik`)

### **PASSO 3: Verificar se Precisa Mudar para TLS Challenge**

O HTTP challenge pode não estar funcionando. Vamos mudar para TLS challenge:

```bash
# Atualizar serviço com TLS challenge (usando variáveis de ambiente)
sudo docker service update \
  --env-rm TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_HTTPCHALLENGE_ENTRYPOINT \
  --env-add TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_TLSCHALLENGE=true \
  traefik
```

### **PASSO 4: Verificar Logs**

```bash
# Ver logs do Traefik
sudo docker service logs traefik --tail 100

# Ver se certificado foi obtido
sudo docker service logs traefik --tail 100 | grep -i "certificate\|acme\|letsencrypt"
```

### **PASSO 5: Adicionar Labels ao Seu App**

Para que o Traefik gerencie o certificado, você precisa adicionar labels. Primeiro, veja qual serviço/container é o seu app:

```bash
# Ver todos os serviços
sudo docker service ls

# Ver containers
sudo docker ps
```

Depois, adicione labels ao serviço/container do seu app.

## 🎯 Sequência Completa

```bash
# 1. Fazer rollback
sudo docker service rollback traefik
sleep 10

# 2. Verificar status
sudo docker service ps traefik

# 3. Mudar para TLS challenge (se HTTP não funcionar)
sudo docker service update \
  --env-rm TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_HTTPCHALLENGE_ENTRYPOINT \
  --env-add TRAEFIK_CERTIFICATESRESOLVERS_letsencrypt_ACME_TLSCHALLENGE=true \
  traefik

# 4. Ver logs
sleep 10
sudo docker service logs traefik --tail 50
```

## 📝 Nota sobre EasyPanel

Vejo que você está usando **EasyPanel** (montagem em `/etc/easypanel/traefik`). O EasyPanel pode ter uma interface para configurar o Traefik. Verifique se há uma interface web do EasyPanel onde você pode configurar o SSL.

---

**✨ Execute primeiro o rollback para desbloquear o serviço!**
