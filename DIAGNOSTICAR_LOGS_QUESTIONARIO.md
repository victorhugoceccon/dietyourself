# 🔍 Diagnóstico Completo - Logs do Questionário

## ✅ Situação Atual

- ✅ Diretório de logs existe: `/opt/dietyourself/dietyourself/logs/`
- ❌ Diretório está vazio (sem arquivos de log)
- ❌ Nenhum erro do questionário encontrado nos logs do PM2

## 🔍 Possíveis Causas

1. **Logs não estão sendo salvos em arquivo** (apenas em memória)
2. **Erro ocorreu há mais tempo** e logs foram rotacionados/apagados
3. **Erro está em logs de output geral** (não só erros)
4. **PM2 não está configurado para salvar logs em arquivo**

## 🚀 Comandos de Diagnóstico

### 1. Verificar se PM2 está gerando logs

```bash
# Ver últimas 50 linhas de TODOS os logs (erro + output)
pm2 logs gibaapp-api --lines 50 --nostream

# Ver se há qualquer menção ao questionário
pm2 logs gibaapp-api --lines 500 --nostream | grep -i "questionário\|questionnaire"

# Ver logs de output (não só erros)
pm2 logs gibaapp-api --out --lines 500 --nostream | grep -i "questionário\|questionnaire"
```

### 2. Verificar configuração do PM2

```bash
# Ver informações completas do processo
pm2 describe gibaapp-api

# Verificar se logs estão configurados
pm2 describe gibaapp-api | grep -i "log\|error\|out"
```

### 3. Verificar logs do sistema (journald)

```bash
# Se estiver usando systemd
journalctl -u pm2-root -n 200 --no-pager | grep -i "questionário\|questionnaire"

# Ou buscar por processo Node
journalctl | grep -i "questionário\|questionnaire" | tail -20
```

### 4. Verificar se há logs rotacionados

```bash
cd /opt/dietyourself/dietyourself/logs
ls -lah

# Verificar se há logs em outros locais
find /opt -name "*.log" -type f 2>/dev/null | grep -i pm2
```

### 5. Forçar criação de logs

```bash
cd /opt/dietyourself/dietyourself

# Criar arquivos de log vazios
touch logs/pm2-error.log logs/pm2-out.log
chmod 644 logs/pm2-error.log logs/pm2-out.log

# Reiniciar PM2 para começar a salvar logs
pm2 restart gibaapp-api
pm2 save

# Aguardar alguns segundos e verificar
sleep 5
ls -lah logs/
```

### 6. Ver logs em tempo real (enquanto testa)

```bash
# Em um terminal, monitorar logs
pm2 logs gibaapp-api --lines 0

# Em outro terminal, fazer uma requisição de teste
# (ou pedir para o usuário tentar responder o questionário novamente)
```

## 📊 Buscar Erro por Outros Métodos

### 1. Verificar no Banco de Dados

```bash
# Conectar ao banco
psql -U postgres -d dietyourself

# Ver últimos questionários salvos
SELECT id, "userId", "createdAt", "updatedAt" 
FROM "QuestionnaireData" 
ORDER BY "updatedAt" DESC 
LIMIT 10;

# Ver se há algum questionário com erro (campos nulos obrigatórios)
SELECT id, "userId", idade, altura, "pesoAtual", objetivo
FROM "QuestionnaireData"
WHERE idade IS NULL OR altura IS NULL OR "pesoAtual" IS NULL OR objetivo IS NULL;
```

### 2. Verificar Logs do Nginx

```bash
# Ver erros do Nginx (pode ter logs de requisições falhadas)
sudo tail -100 /var/log/nginx/error.log | grep -i "questionário\|questionnaire\|/api/questionnaire"

# Ver access logs
sudo tail -100 /var/log/nginx/access.log | grep "/api/questionnaire"
```

### 3. Verificar Logs de Aplicação (se houver)

```bash
# Verificar se há outros arquivos de log
find /opt/dietyourself -name "*.log" -type f 2>/dev/null

# Verificar logs do sistema
dmesg | tail -50
```

## 🎯 Próximos Passos Recomendados

### Opção 1: Habilitar Logs em Arquivo

```bash
cd /opt/dietyourself/dietyourself

# Verificar ecosystem.config.js
cat ecosystem.config.js | grep -A 5 -B 5 "error_file\|out_file"

# Se não estiver configurado, editar:
nano ecosystem.config.js

# Garantir que tem:
# error_file: './logs/pm2-error.log',
# out_file: './logs/pm2-out.log',

# Reiniciar
pm2 delete gibaapp-api
pm2 start ecosystem.config.js
pm2 save
```

### Opção 2: Reproduzir o Erro

1. Pedir para o usuário tentar responder o questionário novamente
2. Monitorar logs em tempo real:
   ```bash
   pm2 logs gibaapp-api --lines 0
   ```
3. Capturar o erro quando ocorrer

### Opção 3: Verificar Código do Questionário

Verificar se há tratamento de erro que não está logando:

```bash
cd /opt/dietyourself/dietyourself
grep -r "console.error\|console.log" server/routes/questionnaire.js | head -20
```

## 💡 Informações Úteis

Se você souber:
- **Email do usuário**: Podemos buscar o userId e verificar no banco
- **Horário aproximado**: Podemos buscar logs de uma data/hora específica
- **Tipo de erro**: Podemos buscar por mensagens específicas

## ✅ Checklist de Diagnóstico

- [ ] Verificar logs do PM2 (output geral, não só erros)
- [ ] Verificar se há logs rotacionados
- [ ] Verificar logs do Nginx
- [ ] Verificar no banco de dados
- [ ] Habilitar logs em arquivo se necessário
- [ ] Reproduzir o erro monitorando logs em tempo real
