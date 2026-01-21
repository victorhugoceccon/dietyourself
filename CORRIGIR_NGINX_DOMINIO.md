# 🔧 Corrigir Nginx - Domínio Carregando Infinitamente

## ❌ Problema Identificado

Na configuração do Nginx, o `proxy_pass` está apontando para a porta **5000**, mas o backend está rodando na porta **8081**.

**Linha 95 do NGINX_HTTPS_FINAL.conf:**
```nginx
proxy_pass http://localhost:5000;  # ❌ ERRADO
```

**Deveria ser:**
```nginx
proxy_pass http://localhost:8081;  # ✅ CORRETO
```

---

## ✅ Solução Rápida

Execute na VPS:

```bash
# 1. Editar configuração do Nginx
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**OU se usar sites-available:**
```bash
sudo nano /etc/nginx/sites-available/identikdigital.com.br
```

---

## 🔧 Correções Necessárias

### 1. Corrigir proxy_pass principal (linha ~95)

**Trocar:**
```nginx
location /api/ {
    proxy_pass http://localhost:5000;
```

**Por:**
```nginx
location /api/ {
    proxy_pass http://localhost:8081;
```

---

### 2. Verificar se há outras referências à porta 5000

```bash
# Procurar todas as referências à porta 5000
sudo grep -r "5000" /etc/nginx/
```

**Trocar todas por 8081**

---

### 3. Configuração Completa Corrigida

```nginx
# Proxy para a API Node (backend na porta 8081)
location /api/ {
    proxy_pass http://localhost:8081;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts aumentados para requisições longas
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;

    # Buffer settings
    proxy_buffering off;
    proxy_request_buffering off;
}
```

---

## 🚀 Passos para Aplicar Correção

```bash
# 1. Fazer backup da configuração atual
sudo cp /etc/nginx/conf.d/dietyourself.conf /etc/nginx/conf.d/dietyourself.conf.backup

# 2. Editar configuração
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 3. Trocar todas as ocorrências de :5000 por :8081
# (Use Ctrl+W para buscar e substituir)

# 4. Testar configuração
sudo nginx -t

# 5. Se teste passar, recarregar Nginx
sudo systemctl reload nginx

# 6. Verificar logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔍 Comando Rápido para Substituir

```bash
# Substituir automaticamente todas as ocorrências
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf

# OU se usar sites-available
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/sites-available/identikdigital.com.br

# Testar
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## ✅ Verificação

Após corrigir, verifique:

```bash
# 1. Verificar se backend está rodando na porta 8081
pm2 status
curl http://localhost:8081/api/health

# 2. Verificar configuração do Nginx
sudo nginx -t

# 3. Ver logs em tempo real
sudo tail -f /var/log/nginx/error.log

# 4. Testar domínio
curl -I https://identikdigital.com.br
```

---

## 🎯 Sequência Completa (Copiar e Colar)

```bash
# Fazer backup
sudo cp /etc/nginx/conf.d/dietyourself.conf /etc/nginx/conf.d/dietyourself.conf.backup

# Substituir porta
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf

# Testar
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Verificar logs
sudo tail -20 /var/log/nginx/error.log
```

---

## 🔍 Outros Problemas Possíveis

### 1. Verificar se backend está rodando
```bash
pm2 status
pm2 logs gibaapp-api --lines 20
```

### 2. Verificar se porta 8081 está aberta
```bash
sudo netstat -tlnp | grep 8081
# ou
sudo ss -tlnp | grep 8081
```

### 3. Verificar DNS
```bash
dig identikdigital.com.br +short
# Deve retornar o IP da VPS
```

### 4. Verificar certificado SSL
```bash
sudo certbot certificates
```

---

## 📝 Checklist

- [ ] Backup da configuração feito
- [ ] Porta 5000 substituída por 8081
- [ ] `sudo nginx -t` passou sem erros
- [ ] Nginx recarregado (`sudo systemctl reload nginx`)
- [ ] Backend rodando na porta 8081 (`pm2 status`)
- [ ] Logs sem erros (`sudo tail -f /var/log/nginx/error.log`)
- [ ] Domínio testado no navegador

---

## 🎉 Após Corrigir

O domínio deve funcionar normalmente! Teste:
- https://identikdigital.com.br
- Login
- Funcionalidades da aplicação
