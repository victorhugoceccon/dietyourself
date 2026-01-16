# 🔧 Desabilitar Restart Automático do Traefik

## ❌ Problema

Traefik reinicia automaticamente, impedindo liberar a porta 80.

## ✅ Solução: Desabilitar Restart Policy

### **Opção 1: Atualizar Restart Policy do Container**

```bash
# 1. Ver containers Traefik
sudo docker ps | grep traefik

# 2. Ver restart policy atual
sudo docker inspect <container_id> | grep -i restart

# 3. Atualizar restart policy para "no"
sudo docker update --restart=no <container_id>

# 4. Parar container
sudo docker stop <container_id>

# 5. Verificar porta 80
sudo ss -tlnp | grep :80

# 6. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 7. Depois, reabilitar restart (se necessário)
sudo docker update --restart=unless-stopped <container_id>
```

### **Opção 2: Se for Docker Swarm**

```bash
# Ver serviços do Swarm
sudo docker service ls

# Ver detalhes do serviço Traefik
sudo docker service ps traefik

# Escalar serviço para 0 (parar)
sudo docker service scale traefik=0

# Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# Depois, escalar de volta
sudo docker service scale traefik=1
```

### **Opção 3: Se for docker-compose**

```bash
# Ir para diretório do docker-compose
cd /caminho/do/docker-compose

# Parar serviços
sudo docker-compose stop traefik

# OU editar docker-compose.yml e mudar restart: always para restart: "no"
sudo nano docker-compose.yml
# Mudar: restart: always → restart: "no"

# Recriar container
sudo docker-compose up -d traefik
```

### **Opção 4: Usar Porta Diferente Temporariamente**

Se não conseguir parar o Traefik, configure o Nginx para usar outra porta e obtenha o certificado:

```bash
# 1. Editar Nginx para usar porta 8080 temporariamente
sudo nano /etc/nginx/conf.d/dietyourself.conf
# Mudar: listen 80; → listen 8080;

# 2. Testar e iniciar Nginx
sudo nginx -t
sudo systemctl start nginx

# 3. Obter certificado (vai usar porta 80 que está livre para Certbot)
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 4. Depois, voltar porta 80 no Nginx e configurar HTTPS
```

## 🎯 Solução Mais Simples: Identificar e Atualizar

```bash
# 1. Ver container Traefik
sudo docker ps | grep traefik

# 2. Anotar o ID do container que usa porta 80
# Exemplo: e1d6db21d719

# 3. Desabilitar restart
sudo docker update --restart=no e1d6db21d719

# 4. Parar
sudo docker stop e1d6db21d719

# 5. Verificar porta 80
sudo ss -tlnp | grep :80

# 6. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 7. Reiniciar Traefik (se necessário)
sudo docker start e1d6db21d719
```

---

**✨ Execute a Opção 1 primeiro - é a mais simples!**
