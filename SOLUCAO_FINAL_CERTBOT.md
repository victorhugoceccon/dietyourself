# 🔐 Solução Final - Obter Certificado com Certbot Standalone

## ❌ Problema

Traefik está com problemas de compatibilidade com Docker API e reinicia automaticamente.

## ✅ Solução: Parar Traefik via Swarm e Obter Certificado

### **PASSO 1: Escalar Serviço Traefik para 0 (Parar)**

```bash
# Escalar serviço Traefik para 0 réplicas (para completamente)
sudo docker service scale traefik=0

# Aguardar alguns segundos
sleep 5

# Verificar se parou
sudo docker service ps traefik

# Verificar se porta 80 está livre
sudo ss -tlnp | grep :80
# Não deve mostrar nada
```

### **PASSO 2: Obter Certificado**

```bash
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

**Durante a execução:**
- Email: `victorhugoceccon@gmail.com`
- Digite `A` para aceitar termos
- Digite `Y` ou `N` para compartilhar email

### **PASSO 3: Reiniciar Traefik**

```bash
# Escalar serviço Traefik de volta para 1 réplica
sudo docker service scale traefik=1

# Verificar se iniciou
sudo docker service ps traefik
```

### **PASSO 4: Configurar Nginx com HTTPS**

Depois de obter o certificado, configure o Nginx com a configuração completa que está no arquivo `PASSO_A_PASSO_COMPLETO_SSL.md` (PASSO 6).

## 🎯 Sequência Completa

```bash
# 1. Parar Traefik
sudo docker service scale traefik=0
sleep 5

# 2. Verificar porta 80
sudo ss -tlnp | grep :80

# 3. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 4. Reiniciar Traefik
sudo docker service scale traefik=1

# 5. Configurar Nginx (copiar do PASSO_A_PASSO_COMPLETO_SSL.md)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 6. Testar e recarregar
sudo nginx -t && sudo systemctl reload nginx
```

---

**✨ Esta é a solução mais simples e efetiva!**
