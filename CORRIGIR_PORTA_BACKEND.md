# 🔧 Corrigir Porta do Backend

## ❌ Problema Identificado

O backend está rodando na porta **8081**, mas o Nginx está configurado para fazer proxy na porta **5000**.

**Logs do Backend:**
```
🚀 Servidor rodando em http://localhost:8081
```

**Configuração do Nginx:**
```nginx
proxy_pass http://localhost:5000;
```

## ✅ Solução

Temos duas opções:

### **Opção 1: Atualizar Nginx para usar porta 8081** (Recomendado)

### **Opção 2: Mudar .env para usar porta 5000**

## 🔧 PASSO 1: Verificar .env

```bash
# Ver qual porta está configurada
cat .env | grep PORT
```

## 🔧 PASSO 2: Escolher Solução

### **Se PORT=8081 no .env:**

Atualizar Nginx para usar porta 8081:

```bash
# Editar configuração do Nginx
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Mudar:**
```nginx
proxy_pass http://localhost:5000;
```

**Para:**
```nginx
proxy_pass http://localhost:8081;
```

**OU se estiver usando NGINX_HTTPS_FINAL.conf:**

```bash
# Verificar se existe
ls -la NGINX_HTTPS_FINAL.conf

# Copiar para Nginx (se ainda não copiou)
sudo cp NGINX_HTTPS_FINAL.conf /etc/nginx/conf.d/dietyourself.conf

# Editar para mudar porta
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Procurar todas as ocorrências de `:5000` e mudar para `:8081`:**

```bash
# Fazer substituição automática
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf
sudo sed -i 's/127.0.0.1:5000/127.0.0.1:8081/g' /etc/nginx/conf.d/dietyourself.conf
```

### **Se quiser mudar .env para porta 5000:**

```bash
# Editar .env
nano .env

# Mudar PORT=8081 para PORT=5000
# Salvar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar backend
pm2 restart gibaapp-api
```

## 🎯 Sequência Recomendada (Opção 1)

```bash
# 1. Verificar porta no .env
cat .env | grep PORT

# 2. Atualizar Nginx para usar porta 8081
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf
sudo sed -i 's/127.0.0.1:5000/127.0.0.1:8081/g' /etc/nginx/conf.d/dietyourself.conf

# 3. Verificar mudanças
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep -A 5 "location /api"

# 4. Testar configuração do Nginx
sudo nginx -t

# 5. Recarregar Nginx
sudo systemctl reload nginx

# 6. Testar backend
curl http://localhost:8081/api/health

# 7. Testar login no navegador
```

## ✅ Verificação Final

```bash
# 1. Verificar se backend está na porta 8081
sudo ss -tlnp | grep :8081

# 2. Testar backend diretamente
curl http://localhost:8081/api/health

# 3. Verificar configuração do Nginx
sudo cat /etc/nginx/conf.d/dietyourself.conf | grep "proxy_pass" | grep -v "diet/generate"

# 4. Testar login no navegador
# Acesse: https://identikdigital.com.br/login
```

---

**✨ Execute primeiro: `cat .env | grep PORT` para ver qual porta está configurada!**
