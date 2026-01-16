# 🔍 Verificação Completa da Porta 80

## ❌ Problema Persistente

Mesmo após parar containers, algo ainda está usando a porta 80.

## ✅ Verificações Completas

### **1. Verificar todos os processos**

```bash
# Ver processos usando porta 80
sudo ss -tlnp | grep :80
sudo netstat -tlnp | grep :80

# Ver processos Nginx
sudo ps aux | grep nginx
sudo systemctl status nginx

# Ver processos Apache
sudo ps aux | grep apache
sudo ps aux | grep httpd
sudo systemctl status httpd
sudo systemctl status apache2

# Ver todos os processos Docker
sudo docker ps -a | grep 80
```

### **2. Parar todos os serviços web possíveis**

```bash
# Parar Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Parar Apache
sudo systemctl stop httpd 2>/dev/null
sudo systemctl stop apache2 2>/dev/null

# Parar todos os containers Docker
sudo docker stop $(sudo docker ps -q)
```

### **3. Verificar firewall/proxy**

```bash
# Ver regras de firewall
sudo iptables -L -n | grep 80
sudo firewall-cmd --list-all 2>/dev/null

# Ver se há proxy reverso
sudo netstat -tlnp | grep -E ":80|:443"
```

### **4. Tentar usar porta diferente temporariamente**

Se nada funcionar, podemos usar o método webroot ao invés de standalone:

```bash
# Criar diretório
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Usar webroot (não precisa parar serviços)
sudo certbot certonly --webroot -w /var/www/html -d identikdigital.com.br -d www.identikdigital.com.br
```

## 🎯 Sequência de Diagnóstico

```bash
# 1. Ver tudo que está escutando
sudo ss -tlnp | grep -E ":80|:443"

# 2. Ver processos Nginx
sudo systemctl status nginx

# 3. Parar Nginx
sudo systemctl stop nginx

# 4. Ver processos Apache
sudo systemctl status httpd 2>/dev/null || sudo systemctl status apache2 2>/dev/null

# 5. Parar Apache
sudo systemctl stop httpd 2>/dev/null
sudo systemctl stop apache2 2>/dev/null

# 6. Ver containers Docker
sudo docker ps | grep 80

# 7. Parar todos containers
sudo docker stop $(sudo docker ps -q)

# 8. Verificar novamente
sudo ss -tlnp | grep :80

# 9. Tentar Certbot
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br
```
