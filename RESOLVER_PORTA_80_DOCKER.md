# 🐳 Resolver Conflito de Porta 80 com Docker

## ❌ Problema

A porta 80 está sendo usada pelo Docker, impedindo o Certbot de validar o domínio.

## ✅ Solução: Parar Docker Temporariamente

### **Opção 1: Parar Container Docker Específico (Recomendado)**

```bash
# Ver qual container está usando a porta 80
sudo docker ps | grep 80

# Parar o container específico
sudo docker stop <container_id>
# OU
sudo docker stop $(sudo docker ps -q --filter "publish=80")
```

### **Opção 2: Parar Todos os Containers Docker**

```bash
# Parar todos os containers
sudo docker stop $(sudo docker ps -q)
```

### **Opção 3: Parar Serviço Docker (se necessário)**

```bash
# Parar serviço Docker completamente
sudo systemctl stop docker
```

## 🔐 Obter Certificado

Depois de liberar a porta 80:

```bash
# Verificar se porta 80 está livre
sudo netstat -tlnp | grep :80
# Não deve mostrar nada

# Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

## 🔄 Reiniciar Docker

```bash
# Reiniciar containers Docker
sudo docker start $(sudo docker ps -aq)

# OU reiniciar serviço Docker
sudo systemctl start docker
```

## 🎯 Sequência Completa

```bash
# 1. Ver containers Docker
sudo docker ps

# 2. Parar containers que usam porta 80
sudo docker stop $(sudo docker ps -q --filter "publish=80")

# 3. Verificar se porta 80 está livre
sudo netstat -tlnp | grep :80

# 4. Parar Nginx (se estiver rodando)
sudo systemctl stop nginx

# 5. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 6. Reiniciar Nginx
sudo systemctl start nginx

# 7. Reiniciar containers Docker
sudo docker start $(sudo docker ps -aq)
```

## 🔍 Identificar Container Específico

```bash
# Ver qual processo está usando a porta 80
sudo lsof -i :80

# Ver containers Docker
sudo docker ps

# Ver portas mapeadas
sudo docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Ports}}"
```

## ⚠️ Alternativa: Usar Porta Diferente no Docker

Se você não quiser parar o Docker, pode:

1. **Mudar a porta do container Docker** para outra (ex: 8000)
2. **Deixar a porta 80 livre** para o Certbot
3. **Depois voltar** a configuração original

---

**✨ Execute os comandos acima para liberar a porta 80 e obter o certificado!**
