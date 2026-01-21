# 🔍 Diagnosticar Carregamento Infinito no Domínio

## 📋 Análise dos Logs

Os logs mostram apenas:
- ✅ Erros de `favicon.ico` (não crítico - apenas aviso)
- ✅ Erros SSL de bots/scanners (não afeta usuários reais)

**O problema do "carregando infinitamente" não aparece nos logs de erro!**

Isso indica que pode ser:
1. Frontend não está sendo servido corretamente
2. Backend não está respondendo
3. Problema de CORS
4. Build não foi feito corretamente
5. Certificado SSL com problema

---

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar se o build existe e tem conteúdo

```bash
# Verificar se dist/ existe
ls -la /opt/dietyourself/dietyourself/dist/

# Verificar conteúdo
ls -la /opt/dietyourself/dietyourself/dist/ | head -20

# Verificar se index.html existe
cat /opt/dietyourself/dietyourself/dist/index.html | head -20
```

**Se não existir ou estiver vazio:**
```bash
cd /opt/dietyourself/dietyourself
npm run build
```

---

### 2. Verificar se backend está rodando

```bash
# Status do PM2
pm2 status

# Verificar se API responde
curl http://localhost:8081/api/health

# Ver logs do backend
pm2 logs gibaapp-api --lines 50
```

---

### 3. Verificar logs de acesso do Nginx

```bash
# Ver últimas requisições
sudo tail -50 /var/log/nginx/access.log

# Filtrar apenas requisições do domínio
sudo tail -100 /var/log/nginx/access.log | grep identikdigital.com.br

# Ver requisições em tempo real
sudo tail -f /var/log/nginx/access.log
```

**Procure por:**
- Requisições que retornam 200 (sucesso)
- Requisições que retornam 404 (arquivo não encontrado)
- Requisições que retornam 502 (bad gateway - backend não responde)
- Requisições que retornam 504 (gateway timeout)

---

### 4. Testar requisições manualmente

```bash
# Testar frontend (deve retornar HTML)
curl -I https://identikdigital.com.br

# Testar API (deve retornar JSON ou erro de autenticação)
curl -I https://identikdigital.com.br/api/health

# Testar com verbose para ver detalhes
curl -v https://identikdigital.com.br 2>&1 | head -30
```

---

### 5. Verificar configuração do Nginx

```bash
# Ver configuração ativa
sudo nginx -T | grep -A 30 "server_name identikdigital"

# Verificar se proxy_pass está correto
sudo grep -r "proxy_pass" /etc/nginx/ | grep -v "#"

# Verificar porta do backend
sudo grep -r "8081\|5000" /etc/nginx/
```

---

### 6. Verificar certificado SSL

```bash
# Ver certificados
sudo certbot certificates

# Testar certificado
openssl s_client -connect identikdigital.com.br:443 -servername identikdigital.com.br < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

### 7. Verificar CORS no backend

```bash
# Ver configuração de CORS
grep -r "cors" /opt/dietyourself/dietyourself/server/ | head -10

# Verificar se domínio está permitido
grep -r "identikdigital\|origin" /opt/dietyourself/dietyourself/server/
```

---

## 🎯 Comandos de Diagnóstico Completo

Execute todos de uma vez:

```bash
echo "=== 1. Verificar Build ===" && \
ls -la /opt/dietyourself/dietyourself/dist/ | head -10 && \
echo "" && \
echo "=== 2. Verificar Backend ===" && \
pm2 status && \
curl -s http://localhost:8081/api/health && \
echo "" && \
echo "=== 3. Verificar Nginx ===" && \
sudo nginx -t && \
echo "" && \
echo "=== 4. Verificar Proxy ===" && \
sudo grep -r "proxy_pass.*localhost" /etc/nginx/conf.d/ && \
echo "" && \
echo "=== 5. Testar Domínio ===" && \
curl -I https://identikdigital.com.br 2>&1 | head -10
```

---

## ✅ Soluções Comuns

### Solução 1: Rebuild do Frontend

```bash
cd /opt/dietyourself/dietyourself
npm run build
ls -la dist/
sudo systemctl reload nginx
```

---

### Solução 2: Verificar e Corrigir Proxy

```bash
# Verificar porta atual
sudo grep "proxy_pass" /etc/nginx/conf.d/dietyourself.conf

# Se estiver 5000, corrigir para 8081
sudo sed -i 's/localhost:5000/localhost:8081/g' /etc/nginx/conf.d/dietyourself.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

### Solução 3: Verificar Permissões

```bash
# Verificar permissões do diretório dist
ls -la /opt/dietyourself/dietyourself/dist/

# Se necessário, corrigir
sudo chown -R $USER:$USER /opt/dietyourself/dietyourself/dist/
sudo chmod -R 755 /opt/dietyourself/dietyourself/dist/
```

---

### Solução 4: Reiniciar Serviços

```bash
# Reiniciar backend
pm2 restart all
pm2 save

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status
pm2 status
sudo systemctl status nginx
```

---

### Solução 5: Verificar CORS

Se o problema for CORS, edite o arquivo do backend:

```bash
nano /opt/dietyourself/dietyourself/server/index.js
```

**Procurar por configuração de CORS e adicionar:**
```javascript
const corsOptions = {
  origin: [
    'https://identikdigital.com.br',
    'http://identikdigital.com.br',
    'https://www.identikdigital.com.br',
    'http://69.6.215.140:8082'  // IP direto se necessário
  ],
  credentials: true
};
```

**Depois reiniciar:**
```bash
pm2 restart all
```

---

## 🔍 Verificar no Navegador

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Recarregue a página
4. Veja quais requisições estão:
   - ✅ Carregando (200)
   - ❌ Falhando (404, 500, 502, 504)
   - ⏳ Pendentes (travadas)

**Compartilhe:**
- Quais requisições estão travadas?
- Qual o status code das requisições que falham?
- Há erros no Console (aba Console do DevTools)?

---

## 📝 Checklist de Diagnóstico

Execute e compartilhe os resultados:

```bash
# 1. Build existe?
ls -la /opt/dietyourself/dietyourself/dist/ | head -5

# 2. Backend rodando?
pm2 status

# 3. API responde?
curl http://localhost:8081/api/health

# 4. Nginx configurado corretamente?
sudo nginx -t
sudo grep "proxy_pass.*8081" /etc/nginx/conf.d/dietyourself.conf

# 5. Domínio responde?
curl -I https://identikdigital.com.br

# 6. Últimas requisições
sudo tail -20 /var/log/nginx/access.log | grep identikdigital
```

---

## 🎯 Próximos Passos

Após executar os comandos acima, compartilhe:
1. ✅ O que funcionou
2. ❌ O que não funcionou
3. 📋 Resultados dos comandos de diagnóstico

Com essas informações, posso identificar exatamente o problema!
