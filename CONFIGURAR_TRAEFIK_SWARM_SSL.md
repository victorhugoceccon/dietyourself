# 🔐 Configurar Traefik no Docker Swarm para SSL

## ✅ Situação Atual

- ✅ Traefik rodando no Docker Swarm
- ✅ Já tentando obter certificado (mas falhando)
- ❌ Precisa configurar corretamente o Let's Encrypt

## 🔧 Solução: Atualizar Serviço Traefik

### **PASSO 1: Ver Configuração Atual do Serviço**

```bash
# Ver configuração do serviço
sudo docker service inspect traefik --pretty

# Ver comandos atuais
sudo docker service inspect traefik | grep -A 20 "Command\|Args"
```

### **PASSO 2: Atualizar Serviço com Let's Encrypt**

```bash
# Atualizar serviço Traefik com configuração Let's Encrypt
sudo docker service update \
  --args "--api.insecure=true" \
  --args "--providers.docker=true" \
  --args "--providers.docker.exposedbydefault=false" \
  --args "--entrypoints.web.address=:80" \
  --args "--entrypoints.websecure.address=:443" \
  --args "--certificatesresolvers.letsencrypt.acme.tlschallenge=true" \
  --args "--certificatesresolvers.letsencrypt.acme.email=victorhugoceccon@gmail.com" \
  --args "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json" \
  --mount-add type=volume,source=letsencrypt,destination=/letsencrypt \
  traefik
```

### **PASSO 3: Verificar se Funcionou**

```bash
# Ver logs do Traefik
sudo docker service logs traefik --tail 50 | grep -i "acme\|certificate\|letsencrypt"

# Ver se volume foi criado
sudo docker volume ls | grep letsencrypt
```

### **PASSO 4: Adicionar Labels ao Seu App**

Para que o Traefik gerencie o certificado do seu app, você precisa adicionar labels ao serviço/container do seu app:

```bash
# Se seu app for um serviço do Swarm
sudo docker service update \
  --label-add "traefik.enable=true" \
  --label-add "traefik.http.routers.identikdigital.rule=Host(\`identikdigital.com.br\`) || Host(\`www.identikdigital.com.br\`)" \
  --label-add "traefik.http.routers.identikdigital.entrypoints=websecure" \
  --label-add "traefik.http.routers.identikdigital.tls.certresolver=letsencrypt" \
  --label-add "traefik.http.services.identikdigital.loadbalancer.server.port=8082" \
  <nome_do_servico>

# OU se for um container normal, adicione labels ao criar/atualizar
```

## 🎯 Solução Alternativa: Usar HTTP Challenge

Se TLS challenge não funcionar, use HTTP challenge:

```bash
sudo docker service update \
  --args "--certificatesresolvers.letsencrypt.acme.httpchallenge=true" \
  --args "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web" \
  --args "--certificatesresolvers.letsencrypt.acme.email=victorhugoceccon@gmail.com" \
  --args "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json" \
  --mount-add type=volume,source=letsencrypt,destination=/letsencrypt \
  traefik
```

## 📝 Exemplo Completo: Atualizar Serviço

```bash
# 1. Ver serviço atual
sudo docker service inspect traefik --pretty

# 2. Atualizar com Let's Encrypt (TLS Challenge)
sudo docker service update \
  --args "--certificatesresolvers.letsencrypt.acme.tlschallenge=true" \
  --args "--certificatesresolvers.letsencrypt.acme.email=victorhugoceccon@gmail.com" \
  --args "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json" \
  --mount-add type=volume,source=letsencrypt,destination=/letsencrypt \
  traefik

# 3. Aguardar alguns segundos e verificar logs
sleep 10
sudo docker service logs traefik --tail 30
```

## 🔍 Verificar Configuração

```bash
# Ver configuração atualizada
sudo docker service inspect traefik --pretty | grep -A 10 "Args\|Mounts"

# Ver logs em tempo real
sudo docker service logs traefik -f
```

## ✅ Próximos Passos

Depois de configurar o Traefik:

1. **Adicionar labels ao seu app** para usar o certificado
2. **Verificar se certificado foi obtido** nos logs
3. **Testar HTTPS** no navegador

---

**✨ Execute o PASSO 2 primeiro para configurar o Let's Encrypt no Traefik!**
