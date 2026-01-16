# ✅ Configurar Nginx com HTTPS - Passos Finais

## 🎉 Certificado SSL Obtido com Sucesso!

Certificado salvo em:
- `/etc/letsencrypt/live/identikdigital.com.br/fullchain.pem`
- `/etc/letsencrypt/live/identikdigital.com.br/privkey.pem`

## 📝 PASSO 1: Copiar Configuração HTTPS

```bash
# Editar arquivo do Nginx
sudo nano /etc/nginx/conf.d/dietyourself.conf
```

**Delete TODO o conteúdo e cole o arquivo `NGINX_HTTPS_FINAL.conf` completo.**

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

## ✅ PASSO 2: Testar Configuração

```bash
sudo nginx -t
```

**Deve mostrar:** `nginx: configuration file /etc/nginx/nginx.conf test is successful`

## ⚠️ PASSO 3: Parar Traefik Temporariamente (se necessário)

Se o Nginx não iniciar porque a porta 80 está em uso:

```bash
# Parar Traefik
sudo docker service scale traefik=0

# Aguardar
sleep 5

# Iniciar Nginx
sudo systemctl start nginx

# Verificar status
sudo systemctl status nginx

# Reiniciar Traefik (opcional - se quiser manter ambos)
sudo docker service scale traefik=1
```

## 🔄 PASSO 4: Recarregar Nginx

```bash
# Se Nginx já estiver rodando
sudo systemctl reload nginx

# OU se não estiver rodando
sudo systemctl start nginx
```

## 🧪 PASSO 5: Testar HTTPS

```bash
# Testar HTTPS
curl -I https://identikdigital.com.br

# Testar redirecionamento HTTP -> HTTPS
curl -I http://identikdigital.com.br
# Deve retornar: HTTP/1.1 301 Moved Permanently

# Testar PWA
curl -I https://identikdigital.com.br/sw.js
curl -I https://identikdigital.com.br/manifest.json
```

## 📱 PASSO 6: Testar PWA no Navegador

1. **Acesse:** `https://identikdigital.com.br`
2. **Abra DevTools (F12):**
   - Aba **Application** → **Service Workers**
   - Deve mostrar o service worker registrado
   - Aba **Application** → **Manifest**
   - Deve mostrar as informações do PWA
3. **Testar instalação:**
   - Chrome/Edge: Ícone de instalação na barra de endereços
   - Menu → "Instalar aplicativo"

## ✅ Checklist Final

- [ ] Certificado SSL obtido ✅
- [ ] Configuração Nginx copiada
- [ ] Nginx testado (`nginx -t`)
- [ ] Nginx iniciado/recarregado
- [ ] HTTPS testado (`curl -I https://identikdigital.com.br`)
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Service Worker acessível (`/sw.js`)
- [ ] Manifest acessível (`/manifest.json`)
- [ ] PWA testado no navegador

## 🎯 Comandos Rápidos (Sequência Completa)

```bash
# 1. Editar Nginx (copiar NGINX_HTTPS_FINAL.conf)
sudo nano /etc/nginx/conf.d/dietyourself.conf

# 2. Testar
sudo nginx -t

# 3. Parar Traefik (se necessário)
sudo docker service scale traefik=0
sleep 5

# 4. Iniciar Nginx
sudo systemctl start nginx

# 5. Verificar status
sudo systemctl status nginx

# 6. Testar HTTPS
curl -I https://identikdigital.com.br

# 7. Testar PWA
curl -I https://identikdigital.com.br/sw.js
```

---

**✨ Após seguir estes passos, seu PWA estará funcionando com HTTPS!**
