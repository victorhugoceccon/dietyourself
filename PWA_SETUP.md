# Configuração PWA - LifeFit

O aplicativo LifeFit foi configurado como Progressive Web App (PWA), permitindo instalação no mobile com ícone na tela inicial.

## 📱 Funcionalidades PWA

- ✅ Instalação no mobile (Android e iOS)
- ✅ Ícone na tela inicial
- ✅ Funcionamento offline básico (cache de recursos)
- ✅ Tema personalizado (verde #9fef00)
- ✅ Atalhos rápidos (Dashboard, Dieta, Treinos)

## 🎨 Gerar Ícones PNG

Para que o PWA funcione completamente, você precisa gerar os ícones PNG a partir do SVG.

### Opção 1: Usando o script automatizado (Recomendado)

1. Instale a dependência `sharp`:
```bash
npm install sharp --save-dev
```

2. Execute o script:
```bash
npm run icons:generate
```

Isso irá gerar todos os ícones PNG necessários (72x72 até 512x512) na pasta `public/icons/`.

### Opção 2: Usando ferramentas online

Se preferir não instalar o `sharp`, você pode usar ferramentas online:

1. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Faça upload do arquivo `public/icons/icon.svg`
   - Configure os tamanhos necessários
   - Baixe e coloque os arquivos PNG em `public/icons/`

2. **PWA Builder Image Generator**: https://www.pwabuilder.com/imageGenerator
   - Faça upload do SVG
   - Gere os ícones automaticamente

3. **Favicon Generator**: https://www.favicon-generator.org/
   - Faça upload do SVG
   - Gere todos os tamanhos

### Tamanhos necessários

Certifique-se de ter os seguintes arquivos em `public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` ⭐ (obrigatório)
- `icon-384x384.png`
- `icon-512x512.png` ⭐ (obrigatório)

## 🧪 Testar o PWA

### No Desktop (Chrome/Edge)

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Abra o DevTools (F12)
3. Vá para a aba "Application" (Aplicação)
4. No menu lateral, clique em "Service Workers"
5. Verifique se o service worker está registrado
6. Clique em "Manifest" para ver as configurações do PWA
7. Clique no ícone de instalação na barra de endereços ou use o menu "Instalar aplicativo"

### No Mobile (Android)

1. Abra o Chrome no Android
2. Acesse o site do app
3. Toque no menu (3 pontos) → "Adicionar à tela inicial" ou "Instalar app"
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

### No Mobile (iOS - Safari)

1. Abra o Safari no iOS
2. Acesse o site do app
3. Toque no botão de compartilhar (quadrado com seta)
4. Role para baixo e toque em "Adicionar à Tela de Início"
5. Personalize o nome se desejar
6. Toque em "Adicionar"
7. O ícone aparecerá na tela inicial

## 📝 Arquivos Criados

- `public/manifest.json` - Configurações do PWA
- `public/sw.js` - Service Worker para cache offline
- `public/icons/icon.svg` - Ícone SVG base
- `index.html` - Atualizado com referências ao manifest e service worker

## 🔧 Personalização

### Alterar cores do tema

Edite `public/manifest.json`:
```json
{
  "theme_color": "#9fef00",  // Cor da barra de status
  "background_color": "#06080f"  // Cor de fundo ao carregar
}
```

### Alterar nome do app

Edite `public/manifest.json`:
```json
{
  "name": "Seu Nome Aqui",
  "short_name": "Nome Curto"
}
```

### Personalizar ícone

1. Substitua `public/icons/icon.svg` pelo seu ícone
2. Execute `npm run icons:generate` novamente

## 🚀 Deploy

Ao fazer o build para produção:
```bash
npm run build
```

Certifique-se de que:
- Todos os ícones PNG estão em `dist/icons/`
- O `manifest.json` está em `dist/`
- O `sw.js` está em `dist/`
- O servidor está configurado para servir esses arquivos com os MIME types corretos

## ⚠️ Notas Importantes

- O service worker só funciona em HTTPS (ou localhost em desenvolvimento)
- Em produção, certifique-se de usar HTTPS
- O cache do service worker pode ser limpo nas DevTools → Application → Clear storage
- Atualizações do service worker podem levar alguns minutos para serem detectadas

## 🐛 Troubleshooting

### Service Worker não registra

- Verifique se está usando HTTPS ou localhost
- Abra o DevTools → Console e verifique erros
- Verifique se o arquivo `sw.js` está acessível em `/sw.js`

### Ícones não aparecem

- Verifique se todos os arquivos PNG existem em `public/icons/`
- Verifique o console do navegador para erros 404
- Limpe o cache do navegador

### App não instala

- Verifique se o manifest.json está válido (use um validador online)
- Certifique-se de que tem pelo menos `icon-192x192.png` e `icon-512x512.png`
- Verifique se está usando HTTPS em produção
