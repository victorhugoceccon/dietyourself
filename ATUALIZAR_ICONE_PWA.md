# 🎨 Atualizar Ícone PWA - GIBA (2).png

## ✅ Tarefas

1. ✅ Remover header do PacienteLayout
2. ✅ Botão de sair já está na página de perfil
3. ⏳ Atualizar ícones PWA com "GIBA (2).png"

## 📋 Passo a Passo para Atualizar Ícones

### **PASSO 1: Copiar o ícone para public/icons/**

```bash
# Copiar o arquivo para a pasta de ícones
cp "GIBA (2).png" public/icons/icon-base.png
```

### **PASSO 2: Gerar ícones em todos os tamanhos**

**Opção A: Usar o script (Recomendado)**

```bash
# Instalar sharp se ainda não tiver
npm install sharp

# Gerar todos os ícones
node scripts/generate-icons-from-png.js
```

**Opção B: Manual (se não tiver sharp)**

1. Abra o arquivo "GIBA (2).png" em um editor de imagens
2. Exporte nos seguintes tamanhos:
   - `icon-72x72.png` (72x72px)
   - `icon-96x96.png` (96x96px)
   - `icon-128x128.png` (128x128px)
   - `icon-144x144.png` (144x144px)
   - `icon-152x152.png` (152x152px)
   - `icon-192x192.png` (192x192px)
   - `icon-384x384.png` (384x384px)
   - `icon-512x512.png` (512x512px)
3. Salve todos em `public/icons/`

### **PASSO 3: Verificar se os ícones foram gerados**

```bash
# Verificar se todos os ícones existem
ls -la public/icons/icon-*.png
```

Deve ter 8 arquivos:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### **PASSO 4: Fazer build**

```bash
npm run build
```

### **PASSO 5: Testar no celular**

1. Limpar cache do navegador
2. Acessar o app
3. Instalar o PWA
4. Verificar se o novo ícone aparece na tela inicial

## 🎯 Checklist

- [ ] Arquivo "GIBA (2).png" copiado para public/icons/
- [ ] Ícones gerados em todos os tamanhos (8 arquivos)
- [ ] Build feito (`npm run build`)
- [ ] Ícones testados no celular
- [ ] Novo ícone aparece na tela inicial do PWA

## 📝 Notas

- O `manifest.json` já está configurado para usar os ícones em `/icons/`
- Não precisa editar o `manifest.json` se os arquivos tiverem os nomes corretos
- Os ícones devem ser PNG quadrados (mesma largura e altura)
- Recomendado: ícone com fundo transparente ou fundo sólido

---

**✨ Execute o script `node scripts/generate-icons-from-png.js` para gerar todos os ícones automaticamente!**
