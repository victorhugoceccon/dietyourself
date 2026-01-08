# Segurança da API do Google Maps

Este documento fornece instruções sobre como configurar e proteger as chaves da API do Google Maps para o projeto LifeFit.

## Configuração Inicial

### 1. Criar Chaves de API Separadas

É **altamente recomendado** criar chaves de API separadas para o frontend e backend:

- **Frontend (VITE_GOOGLE_MAPS_API_KEY)**: Para uso direto no cliente (Google Maps Embed, Places Autocomplete via Web Components)
- **Backend (GOOGLE_MAPS_API_KEY)**: Para uso no servidor (Places API, Static Maps, Geocoding)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Frontend - Google Maps API Key (para uso direto no cliente)
VITE_GOOGLE_MAPS_API_KEY=sua_chave_frontend_aqui

# Backend - Google Maps API Key (para uso no servidor)
GOOGLE_MAPS_API_KEY=sua_chave_backend_aqui
```

## Restrições de Segurança

### Para a Chave do Frontend (VITE_GOOGLE_MAPS_API_KEY)

1. **Restrições de HTTP Referrer**:
   - Acesse o [Google Cloud Console](https://console.cloud.google.com/)
   - Vá em "APIs & Services" > "Credentials"
   - Clique na chave do frontend
   - Em "Application restrictions", selecione "HTTP referrers (web sites)"
   - Adicione os seguintes referrers:
     ```
     http://localhost:5173/*
     https://seudominio.com/*
     https://*.seudominio.com/*
     ```

2. **Restrições de API**:
   - Em "API restrictions", selecione "Restrict key"
   - Selecione apenas:
     - Maps JavaScript API
     - Places API (New)

### Para a Chave do Backend (GOOGLE_MAPS_API_KEY)

1. **Restrições de IP** (se possível):
   - Em "Application restrictions", selecione "IP addresses (web servers, cron jobs, etc.)"
   - Adicione o IP do seu servidor/VPS

2. **Restrições de API**:
   - Em "API restrictions", selecione "Restrict key"
   - Selecione apenas:
     - Places API (New)
     - Maps Static API
     - Geocoding API (se necessário)

## Proteção Adicional

### 1. Limites de Cota

Configure limites de cota no Google Cloud Console para evitar uso excessivo:

1. Vá em "APIs & Services" > "Quotas"
2. Configure limites diários/mensais para cada API
3. Configure alertas de uso

### 2. Monitoramento

Ative o monitoramento de uso:

1. Vá em "APIs & Services" > "Dashboard"
2. Configure alertas para uso anormal
3. Revise regularmente os logs de uso

### 3. Rotação de Chaves

Rotacione as chaves periodicamente:

1. Crie novas chaves
2. Atualize as variáveis de ambiente
3. Teste a aplicação
4. Revogue as chaves antigas após confirmação

## FAQ

### Por que usar chaves separadas?

- **Segurança**: Se uma chave for comprometida, a outra permanece segura
- **Controle**: Você pode aplicar restrições diferentes para frontend e backend
- **Monitoramento**: Facilita identificar de onde vem o uso excessivo

### A chave do frontend está exposta no código?

Sim, mas isso é **esperado e seguro** quando:
- As restrições de HTTP referrer estão configuradas corretamente
- As restrições de API limitam quais APIs podem ser usadas
- Você monitora o uso regularmente

### E se minha chave for exposta?

1. Revogue a chave imediatamente no Google Cloud Console
2. Crie uma nova chave
3. Atualize as variáveis de ambiente
4. Revise os logs para identificar uso não autorizado

### Posso usar a mesma chave para frontend e backend?

Não é recomendado, mas se necessário:
- Use apenas restrições de API (não de referrer/IP)
- Monitore o uso mais de perto
- Considere rotacionar a chave com mais frequência

## Recursos Adicionais

- [Documentação do Google Maps Platform](https://developers.google.com/maps/documentation)
- [Melhores Práticas de Segurança](https://developers.google.com/maps/api-security-best-practices)
- [Gerenciamento de Chaves](https://cloud.google.com/docs/authentication/api-keys)

## Suporte

Em caso de dúvidas ou problemas, consulte:
- [Google Maps Platform Support](https://developers.google.com/maps/support)
- [Stack Overflow - google-maps-api-3](https://stackoverflow.com/questions/tagged/google-maps-api-3)
