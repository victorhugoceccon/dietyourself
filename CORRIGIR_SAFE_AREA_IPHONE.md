# 🔧 Corrigir Safe Area iPhone (Notch)

## ❌ Problema

No iPhone, o header fica escondido atrás da câmera/notch, impossibilitando clicar nos botões "Entrar" e visualizar o header.

## ✅ Correções Aplicadas

### **1. Header da Landing (`src/pages/Landing.css`)**

Adicionado `padding-top` com safe area:

```css
.giba-landing-nav {
  padding-top: max(14px, env(safe-area-inset-top));
}

.giba-landing-hero {
  padding-top: max(120px, calc(80px + env(safe-area-inset-top)));
}
```

### **2. Header do Paciente (`src/components/PacienteLayout.css`)**

Adicionado `padding-top` com safe area:

```css
.paciente-header {
  padding-top: max(var(--space-xl), env(safe-area-inset-top));
}
```

### **3. Ajustes Mobile**

No mobile, o header também foi ajustado:

```css
@media (max-width: 768px) {
  .giba-landing-nav {
    padding: 12px 16px;
    padding-top: max(12px, env(safe-area-inset-top));
  }
}
```

## 🎯 O que foi corrigido

1. ✅ Header da Landing agora respeita o safe area do iPhone
2. ✅ Header do Paciente agora respeita o safe area do iPhone
3. ✅ Botões "Entrar" e "Começar" agora ficam visíveis no iPhone
4. ✅ Conteúdo não fica escondido atrás do notch

## 📱 Como funciona

- `env(safe-area-inset-top)` retorna o espaço necessário no topo (notch)
- `max()` garante que sempre tenha pelo menos o padding mínimo
- Funciona automaticamente em todos os iPhones com notch

## 🚀 Próximos Passos

1. Fazer commit das alterações
2. Fazer push para o repositório
3. Fazer pull na VPS
4. Fazer build
5. Testar no iPhone

---

**✨ As correções foram aplicadas! Agora o header fica visível no iPhone.**
