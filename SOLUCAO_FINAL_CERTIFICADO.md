# 🔐 Solução Final - Obter Certificado SSL

## ❌ Problema

O Traefik está interceptando as requisições na porta 80, impedindo a validação.

## ✅ Solução: Usar Método Standalone

### **PASSO 1: Parar Traefik e Nginx**

```bash
# Parar Traefik
sudo docker stop $(sudo docker ps -q --filter ancestor=traefik)

# Parar Nginx
sudo systemctl stop nginx

# Verificar se porta 80 está livre
sudo ss -tlnp | grep :80
# Não deve mostrar nada
```

### **PASSO 2: Obter Certificado Standalone**

```bash
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```

**Durante a execução:**
- Email: `victorhugoceccon@gmail.com`
- Digite `A` para aceitar termos
- Digite `Y` ou `N` para compartilhar email

**✅ Se funcionar, você verá:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/identikdigital.com.br/fullchain.pem
```

### **PASSO 3: Reiniciar Nginx**

```bash
sudo systemctl start nginx
```

### **PASSO 4: Configurar Nginx com HTTPS**

Agora edite o Nginx com a configuração completa que está no arquivo `PASSO_A_PASSO_COMPLETO_SSL.md` (PASSO 6).

---

## 🎯 Sequência Completa (Copiar e Colar)

```bash
# 1. Parar Traefik
sudo docker stop $(sudo docker ps -q --filter ancestor=traefik)

# 2. Parar Nginx
sudo systemctl stop nginx

# 3. Verificar porta 80
sudo ss -tlnp | grep :80

# 4. Obter certificado
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# 5. Reiniciar Nginx
sudo systemctl start nginx

# 6. Editar Nginx para adicionar HTTPS (copiar do PASSO_A_PASSO_COMPLETO_SSL.md)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 7. Testar e recarregar
sudo nginx -t && sudo systemctl reload nginx
```

---

**✨ Execute estes comandos na ordem!**
