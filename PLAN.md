### Landing `/landing` + Stripe — Etapas de Execução

1) Criar rota/página Landing
- Adicionar rota pública `/landing` no router.
- Criar `src/pages/Landing.jsx` (seções: hero, provas sociais, benefícios, planos Mensal/Anual, FAQ, footer).
- Criar `src/pages/Landing.css` (mobile-first, CTA gradiente verde, fundo escuro; reutilizar design system).
- CTA “Começar teste grátis” apontando para fluxo de cadastro/login existente.
- Link para a landing no header/login.

2) Conteúdo de conversão
- Diferenciais: IA dieta/treino, PWA, acompanhamento, check-in com foto/mapa.
- Blocos: hero + CTA, depoimentos/logos, benefícios em bullets, planos comparativos, perguntas frequentes.
- Opcional: SEO básico em `index.html` (title/description/OG).

3) Preparar integração Stripe
- Backend: `POST /api/billing/create-checkout-session` (Stripe SDK) recebendo plano (monthly/yearly) e retornando `session.url`.
- Webhook: `POST /api/billing/stripe-webhook` para ativar/cancelar assinatura e registrar pagamento, atualizando `Subscription`.
- Frontend: botões “Assinar” nos cards chamam endpoint e redirecionam; páginas de sucesso/erro pós-checkout.
- Segurança: webhook assinado, idempotência, validação de `priceId` no servidor.

4) Feature toggle
- Exibir botões “Assinar” só se chaves Stripe estiverem configuradas; fallback mantém trial atual.

5) Entregáveis imediatos
- Rota `/landing` criada e pública.
- Layout responsivo e CTAs funcionando.
- Conteúdo PT-BR focado em B2C SaaS com 7 dias grátis.
### Plano aprovado: Landing `/landing` + Stripe (B2C trial 7 dias)

**Objetivo**: Implementar landing page pública dentro do app com CTA para trial e preparar integração Stripe (checkout + webhook), mantendo trial como fallback.

1) Criar rota e página de landing
- Adicionar rota pública `/landing` no router principal.
- Criar `src/pages/Landing.jsx` com seções: hero, provas sociais, benefícios, planos (Mensal/Anual), FAQ, footer.
- Criar `src/pages/Landing.css` (mobile-first, CTA verde gradiente, fundo escuro, reuse design system).
- CTA principal “Começar teste grátis” → fluxo de cadastro/login já existente.
- Link de acesso à landing no header/login.

2) Conteúdo de conversão
- Destacar diferenciais: IA dieta/treino, PWA, acompanhamento, check-in com foto/mapa.
- Blocos: hero + CTA, depoimentos/logos, benefícios em bullets, planos com comparativo, perguntas frequentes.
- (Opcional) SEO básico em `index.html`: title/description/OG.

3) Preparar integração Stripe (próxima fase)
- Backend: endpoint `POST /api/billing/create-checkout-session` (Stripe SDK) recebendo plano (monthly/yearly) e retornando `session.url`.
- Webhook: `POST /api/billing/stripe-webhook` para ativar/cancelar assinatura e registrar pagamento, atualizando `Subscription`.
- Frontend: botões “Assinar” nos cards chamam o endpoint e redirecionam; páginas de sucesso/erro pós-checkout.
- Segurança: webhook assinado, idempotência, validação de `priceId` no servidor.

4) Feature toggle
- Exibir botões “Assinar” somente se chaves Stripe estiverem configuradas; fallback mantém trial atual.

5) Entregáveis imediatos (landing)
- Rota `/landing` criada e pública.
- Layout responsivo e CTAs funcionando.
- Conteúdo PT-BR focado em B2C SaaS com 7 dias grátis.
Not used
Not used
