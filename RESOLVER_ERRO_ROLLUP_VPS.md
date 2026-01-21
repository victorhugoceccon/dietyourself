# 🔧 Resolver Erro Rollup na VPS

## ❌ Erro Encontrado
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

## ✅ Solução

Este é um problema conhecido com dependências opcionais do npm. A solução é remover `node_modules` e `package-lock.json` e reinstalar tudo.

### Passo a Passo

```bash
# 1. Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# 2. Limpar cache do npm (opcional, mas recomendado)
npm cache clean --force

# 3. Reinstalar todas as dependências
npm install

# 4. Verificar se o rollup foi instalado corretamente
npm list @rollup/rollup-linux-x64-gnu

# 5. Tentar build novamente
npm run build
```

---

## 🎯 Sequência Completa (Copiar e Colar)

```bash
cd /opt/dietyourself/dietyourself && \
rm -rf node_modules package-lock.json && \
npm cache clean --force && \
npm install && \
npx prisma generate && \
npx prisma migrate deploy && \
npm run build && \
pm2 restart gibaapp-api && \
pm2 save && \
sudo systemctl reload nginx
```

---

## 🔍 Verificação

Após reinstalar, verifique se o módulo foi instalado:

```bash
# Verificar se rollup está instalado
npm list rollup

# Verificar dependências opcionais do rollup
ls node_modules/@rollup/ | grep rollup-linux
```

Deve mostrar algo como:
```
rollup-linux-x64-gnu
```

---

## 📝 Explicação

O `@rollup/rollup-linux-x64-gnu` é uma dependência opcional do Rollup que contém o binário nativo para Linux x64. 

**Por que isso acontece?**
- npm às vezes não instala dependências opcionais corretamente
- Pode ser um problema de cache ou de instalação parcial
- A arquitetura do sistema (x64) precisa do binário específico

**Solução:**
Reinstalar tudo do zero garante que todas as dependências opcionais sejam instaladas corretamente.

---

## 🐛 Se Ainda Não Funcionar

### Alternativa 1: Instalar rollup explicitamente
```bash
npm install --save-dev @rollup/rollup-linux-x64-gnu
npm run build
```

### Alternativa 2: Usar npm ci (mais confiável)
```bash
rm -rf node_modules package-lock.json
npm install
npm ci  # Instala exatamente como package-lock.json especifica
npm run build
```

### Alternativa 3: Verificar arquitetura
```bash
# Verificar arquitetura do sistema
uname -m

# Se for x64, deve ser: x86_64
# Se for ARM, pode precisar de: @rollup/rollup-linux-arm64-gnu
```

---

## ✅ Após Resolver

Continue com o deploy normal:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart gibaapp-api
pm2 save
sudo systemctl reload nginx
```
