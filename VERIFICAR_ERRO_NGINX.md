# 🔍 Verificar Erro do Nginx

## ❌ Problema

Nginx não está iniciando. Vamos diagnosticar.

## ✅ Verificar Erro

```bash
# Ver status detalhado
sudo systemctl status nginx.service

# Ver logs de erro
sudo journalctl -xeu nginx.service

# Testar configuração
sudo nginx -t
```

## 🔧 Possíveis Causas e Soluções

### **1. Porta 80 em uso**

Se o erro for "bind() to 0.0.0.0:80 failed", a porta 80 está em uso:

```bash
# Ver o que está usando porta 80
sudo ss -tlnp | grep :80

# Parar Traefik
sudo docker stop $(sudo docker ps -q --filter ancestor=traefik)

# Tentar iniciar Nginx novamente
sudo systemctl start nginx
```

### **2. Erro de configuração**

Se o erro for de sintaxe:

```bash
# Testar configuração
sudo nginx -t

# Ver erro específico
sudo nginx -t 2>&1 | grep error
```

### **3. Permissões**

```bash
# Verificar permissões
ls -la /opt/dietyourself/dietyourself/dist
sudo chown -R nginx:nginx /opt/dietyourself/dietyourself/dist
```

## 🎯 Comandos Rápidos

```bash
# 1. Ver erro
sudo systemctl status nginx.service

# 2. Ver logs
sudo journalctl -xeu nginx.service --no-pager | tail -20

# 3. Testar config
sudo nginx -t

# 4. Ver porta 80
sudo ss -tlnp | grep :80
```
