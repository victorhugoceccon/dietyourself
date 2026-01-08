# 📧 Configuração de Email para Recuperação de Senha

Este guia explica como configurar o envio de emails para a funcionalidade de recuperação de senha.

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configuração SMTP para envio de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=noreply@lifefit.com

# URL do frontend (usado no link de recuperação)
FRONTEND_URL=http://localhost:5173
```

## Configuração por Provedor

### Gmail

1. **Ativar autenticação de dois fatores** na sua conta Google
2. **Gerar uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Mail"
   - Selecione "Outro (nome personalizado)" e digite "LifeFit"
   - Copie a senha gerada (16 caracteres)

3. Configure no `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-gerada
SMTP_FROM=seu-email@gmail.com
```

### Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM=seu-email@outlook.com
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid
SMTP_FROM=noreply@seudominio.com
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seudominio.mailgun.org
SMTP_PASS=sua-senha-do-mailgun
SMTP_FROM=noreply@seudominio.com
```

## Modo de Desenvolvimento (Sem Email Real)

Se você não configurar as variáveis SMTP, o sistema usará uma conta de teste do Ethereal Email. Os emails serão gerados mas não enviados de verdade. Você pode visualizar os emails de teste em: https://ethereal.email

## Testando a Funcionalidade

1. Acesse a tela de login
2. Clique em "Esqueceu a senha?"
3. Digite um email cadastrado
4. Verifique sua caixa de entrada (ou Ethereal Email em desenvolvimento)
5. Clique no link do email
6. Redefina sua senha

## Segurança

- Os tokens de recuperação expiram em **1 hora**
- Cada token só pode ser usado **uma vez**
- Tokens anteriores são automaticamente invalidados quando um novo é gerado
- O sistema sempre retorna sucesso para evitar enumeração de emails

## Troubleshooting

### Email não está sendo enviado

1. Verifique se todas as variáveis SMTP estão configuradas
2. Verifique os logs do servidor para erros
3. Teste a conexão SMTP manualmente
4. Em desenvolvimento, verifique o Ethereal Email

### Token inválido ou expirado

- Tokens expiram em 1 hora
- Cada token só pode ser usado uma vez
- Solicite um novo token se necessário



