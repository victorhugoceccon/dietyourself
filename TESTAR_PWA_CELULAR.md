# 📱 Testar PWA no Celular

## ✅ Pré-requisitos

1. ✅ Site rodando em HTTPS (`https://identikdigital.com.br`)
2. ✅ Backend funcionando
3. ✅ Manifest.json configurado
4. ✅ Service Worker registrado

## 🎯 PASSO 1: Acessar no Celular

### **Android (Chrome)**

1. Abra o navegador Chrome no celular
2. Acesse: `https://identikdigital.com.br`
3. Aguarde o site carregar completamente

### **iOS (Safari)**

1. Abra o Safari no iPhone
2. Acesse: `https://identikdigital.com.br`
3. Aguarde o site carregar completamente

## 🔍 PASSO 2: Verificar se PWA está Funcionando

### **Android (Chrome)**

1. **Verificar prompt de instalação:**
   - Deve aparecer um banner na parte inferior: "Adicionar à tela inicial"
   - OU menu (3 pontos) → "Adicionar à tela inicial"

2. **Instalar PWA:**
   - Toque em "Adicionar à tela inicial"
   - Confirme o nome do app
   - Toque em "Adicionar"

3. **Verificar instalação:**
   - O ícone do app deve aparecer na tela inicial
   - Ao abrir, deve abrir em tela cheia (sem barra do navegador)

### **iOS (Safari)**

1. **Instalar PWA:**
   - Toque no botão de compartilhar (quadrado com seta)
   - Role para baixo e toque em "Adicionar à Tela de Início"
   - Confirme o nome do app
   - Toque em "Adicionar"

2. **Verificar instalação:**
   - O ícone do app deve aparecer na tela inicial
   - Ao abrir, deve abrir em tela cheia

## 🧪 PASSO 3: Testar Funcionalidades

### **1. Testar Offline (Android Chrome)**

1. Abra o PWA instalado
2. Vá em Configurações do Android → Wi-Fi → Desligar Wi-Fi
3. OU ative o Modo Avião
4. Tente navegar pelo app
5. **Esperado:** Páginas já visitadas devem carregar do cache

### **2. Testar Atualização**

1. Abra o PWA instalado
2. Faça uma alteração no código e faça deploy
3. Feche completamente o app (remova dos apps recentes)
4. Abra novamente
5. **Esperado:** Deve aparecer prompt de atualização (se configurado)

### **3. Testar Ícone e Nome**

1. Verifique se o ícone aparece corretamente na tela inicial
2. Verifique se o nome do app está correto
3. **Esperado:** Ícone e nome conforme `manifest.json`

## 🔧 PASSO 4: Verificar no DevTools (Opcional)

### **Android Chrome - Remote Debugging**

1. **No celular:**
   - Vá em Configurações → Sobre o telefone
   - Toque 7 vezes em "Número da versão" (para ativar Opções do desenvolvedor)
   - Vá em Configurações → Opções do desenvolvedor
   - Ative "Depuração USB"

2. **No computador:**
   - Conecte o celular via USB
   - Abra Chrome no computador
   - Acesse: `chrome://inspect`
   - Clique em "inspect" no dispositivo conectado

3. **Verificar PWA:**
   - Vá na aba "Application"
   - Verifique "Manifest" (deve mostrar informações do PWA)
   - Verifique "Service Workers" (deve mostrar o service worker ativo)
   - Verifique "Storage" → "Cache Storage" (deve ter caches)

### **iOS Safari - Web Inspector**

1. **No iPhone:**
   - Vá em Configurações → Safari → Avançado
   - Ative "Inspeção Web"

2. **No Mac:**
   - Conecte iPhone via USB
   - Abra Safari no Mac
   - Vá em Desenvolver → [Nome do iPhone] → [Nome do site]
   - Verifique Console e Storage

## 🐛 Troubleshooting

### **Problema: Não aparece opção de instalar**

**Soluções:**

1. **Verificar HTTPS:**
   ```bash
   # No celular, verifique se a URL começa com https://
   # Deve aparecer um cadeado no navegador
   ```

2. **Verificar manifest.json:**
   ```bash
   # No celular, acesse:
   https://identikdigital.com.br/manifest.json
   # Deve retornar JSON válido
   ```

3. **Verificar service worker:**
   ```bash
   # No celular, acesse:
   https://identikdigital.com.br/sw.js
   # Deve retornar código JavaScript
   ```

4. **Limpar cache:**
   - Chrome: Menu → Configurações → Privacidade → Limpar dados de navegação
   - Safari: Configurações → Safari → Limpar histórico e dados do site

### **Problema: App não abre em tela cheia**

**Solução:**

1. Verificar `manifest.json`:
   ```json
   {
     "display": "standalone"  // ou "fullscreen"
   }
   ```

2. Verificar se está abrindo o app instalado (não o navegador)

### **Problema: Ícone não aparece**

**Solução:**

1. Verificar se os ícones existem:
   ```bash
   # Na VPS
   ls -la public/icons/
   ```

2. Verificar URLs no manifest.json:
   ```bash
   # Acessar no celular:
   https://identikdigital.com.br/icons/icon-192x192.png
   # Deve carregar a imagem
   ```

## ✅ Checklist de Testes

- [ ] Site carrega em HTTPS no celular
- [ ] Manifest.json é acessível (`/manifest.json`)
- [ ] Service Worker é registrado (`/sw.js`)
- [ ] Prompt de instalação aparece (Android) ou opção no menu (iOS)
- [ ] App instala corretamente
- [ ] Ícone aparece na tela inicial
- [ ] Nome do app está correto
- [ ] App abre em tela cheia (sem barra do navegador)
- [ ] Funcionalidades básicas funcionam (login, navegação)
- [ ] Cache funciona (páginas visitadas carregam offline)

## 🎯 Testes Rápidos

### **Teste 1: Verificar Manifest**

No celular, acesse:
```
https://identikdigital.com.br/manifest.json
```

**Esperado:** JSON válido com informações do PWA

### **Teste 2: Verificar Service Worker**

No celular, acesse:
```
https://identikdigital.com.br/sw.js
```

**Esperado:** Código JavaScript do service worker

### **Teste 3: Verificar Ícones**

No celular, acesse:
```
https://identikdigital.com.br/icons/icon-192x192.png
https://identikdigital.com.br/icons/icon-512x512.png
```

**Esperado:** Imagens dos ícones carregam

## 📝 Notas Importantes

1. **Android:** Precisa acessar o site pelo menos 2 vezes para o prompt aparecer
2. **iOS:** Precisa usar Safari (não funciona no Chrome iOS)
3. **HTTPS obrigatório:** PWA só funciona em HTTPS
4. **Service Worker:** Deve estar registrado sem erros no console

---

**✨ Acesse `https://identikdigital.com.br` no celular e teste a instalação!**
