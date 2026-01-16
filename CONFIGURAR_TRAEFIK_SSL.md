# 🔐 Configurar Traefik para Obter Certificado SSL

## ✅ Vantagens

- ✅ Não precisa parar o Traefik
- ✅ Renovação automática
- ✅ Gerenciamento automático de certificados
- ✅ Suporte nativo para Let's Encrypt

## 🔧 Configuração do Traefik

### **PASSO 1: Verificar Configuração Atual do Traefik**

```bash
# Ver containers Traefik
sudo docker ps | grep traefik

# Ver logs do Traefik
sudo docker logs <container_id> | tail -50

# Ver arquivo de configuração (se usar docker-compose)
sudo docker inspect <container_id> | grep -i "com.docker.compose"
```

### **PASSO 2: Configurar Traefik com Let's Encrypt**

O Traefik precisa ser configurado com as seguintes opções:

#### **Se usar docker-compose:**

Edite o arquivo `docker-compose.yml`:

```yaml
services:
  traefik:
    image: traefik:v3.3.7
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=victorhugoceccon@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    labels:
      - "traefik.enable=true"
```

#### **Se usar Docker Swarm:**

Adicione labels ao serviço:

```bash
sudo docker service update \
  --label-add "traefik.http.routers.identikdigital.rule=Host(\`identikdigital.com.br\`)" \
  --label-add "traefik.http.routers.identikdigital.entrypoints=websecure" \
  --label-add "traefik.http.routers.identikdigital.tls.certresolver=letsencrypt" \
  <service_name>
```

### **PASSO 3: Configurar Labels no Container do Seu App**

Para que o Traefik gerencie o certificado do seu app, adicione labels:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.identikdigital.rule=Host(`identikdigital.com.br`)"
  - "traefik.http.routers.identikdigital.entrypoints=websecure"
  - "traefik.http.routers.identikdigital.tls.certresolver=letsencrypt"
  - "traefik.http.services.identikdigital.loadbalancer.server.port=8082"
```

### **PASSO 4: Verificar Certificados**

```bash
# Ver logs do Traefik
sudo docker logs <traefik_container_id> | grep -i "certificate\|acme\|letsencrypt"

# Verificar se certificado foi obtido
sudo docker exec <traefik_container_id> ls -la /letsencrypt/
```

## 🎯 Solução Alternativa: Usar Traefik como Proxy Reverso

Se você quiser manter o Nginx mas usar o Traefik apenas para SSL:

1. **Traefik na porta 443** (HTTPS) com certificado
2. **Nginx na porta interna** (8082)
3. **Traefik faz proxy** para o Nginx

## 📝 Exemplo Completo: Traefik + Nginx

### **Configuração do Traefik (docker-compose.yml):**

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.3.7
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=victorhugoceccon@gmail.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

  nginx:
    image: nginx:alpine
    container_name: nginx-app
    restart: unless-stopped
    volumes:
      - /opt/dietyourself/dietyourself/dist:/usr/share/nginx/html:ro
      - /etc/nginx/conf.d/dietyourself.conf:/etc/nginx/conf.d/default.conf:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.identikdigital.rule=Host(`identikdigital.com.br`) || Host(`www.identikdigital.com.br`)"
      - "traefik.http.routers.identikdigital.entrypoints=websecure"
      - "traefik.http.routers.identikdigital.tls.certresolver=letsencrypt"
      - "traefik.http.services.identikdigital.loadbalancer.server.port=80"
```

## 🔍 Verificar Configuração Atual

Primeiro, vamos ver como o Traefik está configurado:

```bash
# Ver configuração do container Traefik
sudo docker inspect <traefik_container_id> | grep -A 20 "Args\|Cmd"

# Ver se já tem Let's Encrypt configurado
sudo docker logs <traefik_container_id> 2>&1 | grep -i "acme\|letsencrypt\|certificate"
```

## ✅ Próximos Passos

1. **Verificar configuração atual do Traefik**
2. **Adicionar configuração Let's Encrypt** (se não tiver)
3. **Adicionar labels ao seu app** para usar o certificado
4. **Verificar se certificado foi obtido**

---

**✨ Vamos verificar primeiro como o Traefik está configurado!**
