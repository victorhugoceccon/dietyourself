# 🛑 Parar Traefik Manualmente

## 🔍 Verificar Containers

```bash
# Ver todos os containers rodando
sudo docker ps

# Ver containers que usam porta 80
sudo docker ps | grep 80

# Ver processo usando porta 80
sudo ss -tlnp | grep :80
```

## ✅ Parar Containers Manualmente

```bash
# Ver ID dos containers Traefik
sudo docker ps | grep traefik

# Parar pelo ID (substitua pelo ID real)
sudo docker stop <container_id>

# OU parar todos os containers que usam porta 80
sudo docker ps --format "{{.ID}} {{.Ports}}" | grep 80
# Anote o ID e pare:
sudo docker stop <container_id>
```

## 🎯 Solução Rápida

```bash
# 1. Ver o que está usando porta 80
sudo ss -tlnp | grep :80

# 2. Ver containers Docker
sudo docker ps

# 3. Parar container específico (anote o ID do container que usa porta 80)
sudo docker stop <container_id>

# 4. Verificar se porta 80 está livre
sudo ss -tlnp | grep :80
```
