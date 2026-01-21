# 🔧 Resolver: Assets JavaScript/CSS Não Carregam

## ❌ Problema Identificado

Os logs mostram que apenas arquivos básicos estão sendo carregados:
- ✅ `/sw.js` (200)
- ✅ `/index.html` (200)
- ✅ `/manifest.json` (200)

**Mas NÃO aparecem:**
- ❌ Requisições para `/assets/*.js`
- ❌ Requisições para `/assets/*.css`
- ❌ Requisições para `/api/*`

Isso indica que os **assets JavaScript/CSS não estão sendo carregados**, causando o carregamento infinito.

---

## 🔍 Diagnóstico

### 1. Verificar se assets existem

```bash
# Ver assets no diretório dist
ls -la /opt/dietyourself/dietyourself/dist/assets/

# Ver conteúdo do index.html
cat /opt/dietyourself/dietyourself/dist/index.html | grep -E "\.js|\.css"
```

---

### 2. Verificar caminho base no index.html

```bash
# Ver como os assets estão sendo referenciados
cat /opt/dietyourself/dietyourself/dist/index.html | head -30
```

**Problema comum:** Se o `BASE_URL` estiver configurado incorretamente, os assets podem estar com caminho errado.

---

### 3. Verificar Service Worker

O Service Worker pode estar bloqueando requisições. Verificar:

```bash
# Ver conteúdo do sw.js
cat /opt/dietyourself/dietyourself/dist/sw.js | head -50
```

---

## ✅ Soluções

### Solução 1: Verificar e Corrigir BASE_URL

Se o `index.html` estiver usando caminhos absolutos incorretos:

```bash
# Ver como está configurado
cat /opt/dietyourself/dietyourself/dist/index.html | grep -E "src=|href=" | head -10
```

**Se os caminhos estiverem errados, pode ser necessário:**
1. Verificar `vite.config.js` no código fonte
2. Rebuild com BASE_URL correto
3. Ou ajustar manualmente no index.html

---

### Solução 2: Verificar Configuração do Nginx para Assets

O Nginx precisa servir os assets corretamente. Verificar:

```bash
# Ver configuração de assets no Nginx
sudo grep -A 10 "assets\|\.js\|\.css" /etc/nginx/conf.d/dietyourself.conf
```

**Deve ter algo como:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

---

### Solução 3: Limpar Cache do Service Worker

O Service Worker pode estar servindo versão antiga em cache. Solução:

1. **No navegador (DevTools):**
   - Abrir DevTools (F12)
   - Ir em **Application** > **Service Workers**
   - Clicar em **Unregister** para todos os service workers
   - Limpar cache: **Application** > **Clear storage** > **Clear site data**

2. **Ou forçar atualização do Service Worker no código:**
   - Verificar se o `sw.js` tem version diferente
   - Rebuild pode gerar novo hash

---

### Solução 4: Rebuild com BASE_URL Correto

```bash
cd /opt/dietyourself/dietyourself

# Verificar vite.config.js
cat vite.config.js | grep -E "base|BASE"

# Se necessário, editar e rebuild
nano vite.config.js
# Garantir que base está como '/' ou vazio

# Rebuild
npm run build

# Verificar se assets foram gerados
ls -la dist/assets/

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### Solução 5: Verificar Permissões dos Assets

```bash
# Verificar permissões
ls -la /opt/dietyourself/dietyourself/dist/assets/

# Se necessário, corrigir
sudo chown -R $USER:$USER /opt/dietyourself/dietyourself/dist/
sudo chmod -R 755 /opt/dietyourself/dietyourself/dist/
```

---

## 🎯 Comandos de Diagnóstico Completo

Execute na VPS:

```bash
echo "=== 1. Verificar Assets ===" && \
ls -la /opt/dietyourself/dietyourself/dist/assets/ | head -10 && \
echo "" && \
echo "=== 2. Verificar index.html ===" && \
cat /opt/dietyourself/dietyourself/dist/index.html | grep -E "src=|href=" | head -5 && \
echo "" && \
echo "=== 3. Verificar Nginx Assets ===" && \
sudo grep -A 5 "\.js\|\.css" /etc/nginx/conf.d/dietyourself.conf && \
echo "" && \
echo "=== 4. Testar Asset Diretamente ===" && \
curl -I https://identikdigital.com.br/assets/$(ls /opt/dietyourself/dietyourself/dist/assets/ | grep "\.js$" | head -1) 2>&1 | head -5
```

---

## 🔧 Solução Rápida (Tentar Primeiro)

```bash
# 1. Verificar assets
ls -la /opt/dietyourself/dietyourself/dist/assets/

# 2. Se assets existem, testar acesso direto
# (Substitua NOME_DO_ARQUIVO.js pelo nome real)
curl -I https://identikdigital.com.br/assets/NOME_DO_ARQUIVO.js

# 3. Se retornar 404, verificar configuração do Nginx
sudo nginx -t
sudo systemctl reload nginx

# 4. Limpar cache e rebuild se necessário
cd /opt/dietyourself/dietyourself
npm run build
sudo systemctl reload nginx
```

---

## 📝 Próximos Passos

Execute os comandos acima e compartilhe:
1. ✅ Lista de arquivos em `dist/assets/`
2. ✅ Como os assets estão referenciados no `index.html`
3. ✅ Resultado do teste de acesso direto a um asset
4. ✅ Configuração do Nginx para assets

Com essas informações, posso identificar exatamente o problema!
