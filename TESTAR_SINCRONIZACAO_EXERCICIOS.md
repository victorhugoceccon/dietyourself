# 🧪 Guia de Teste - Sincronização de Exercícios da API

## 📋 Status Atual

- ✅ Schema atualizado com campos `source`, `ascendExerciseId`, `ascendData`
- ✅ Banco de dados sincronizado
- ✅ Rotas criadas
- ❌ **Nenhum exercício sincronizado ainda** (0 exercícios)

## 🚀 Como Sincronizar os Exercícios

### Opção 1: Via Interface (Recomendado)

1. **Acesse como ADMIN:**
   - Faça login com uma conta de administrador
   - Vá para a tela de **Exercícios**

2. **Execute a Sincronização:**
   - Clique no botão **"Sincronizar API"** (visível apenas para ADMIN)
   - Confirme a sincronização
   - Aguarde alguns minutos (a API tem ~1500 exercícios)

3. **Verifique o Resultado:**
   - O sistema mostrará quantos exercícios foram importados/atualizados
   - Os exercícios aparecerão automaticamente para todos os personais

### Opção 2: Via API Diretamente

```bash
# Fazer login e obter token
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dietyourself.com","password":"sua_senha"}'

# Copiar o token retornado e usar na sincronização
curl -X POST http://localhost:8081/api/exercicios/sync/ascend \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## ✅ Como Testar Após Sincronização

### 1. Verificar Quantidade de Exercícios

Execute o script de teste:
```bash
node test-exercicios-sync.js
```

Deve mostrar:
- Total de exercícios sincronizados (esperado: ~1500)
- Exemplos de exercícios com dados traduzidos
- Status da query de listagem

### 2. Testar na Interface

1. **Como Personal:**
   - Acesse a tela de Exercícios
   - Clique em **"Buscar Exercícios"**
   - Deve aparecer todos os exercícios sincronizados
   - Filtre por nome, músculo, equipamento
   - Verifique se os vídeos/GIFs aparecem
   - Verifique se as traduções estão corretas

2. **Importar um Exercício:**
   - Clique em **"Ver Detalhes"** em um exercício
   - Verifique se o GIF/vídeo aparece
   - Verifique se as instruções estão traduzidas
   - Clique em **"Importar Exercício"**
   - Verifique se aparece na lista de exercícios do personal

### 3. Verificar Dados Traduzidos

Os exercícios sincronizados devem ter:
- ✅ Nome em português (ou original se não traduzível)
- ✅ Categoria traduzida (Peito, Costas, etc.)
- ✅ Equipamentos traduzidos (Barra, Halter, etc.)
- ✅ Músculos alvo traduzidos
- ✅ Instruções em português
- ✅ GIF/vídeo funcionando

## 🔍 Verificações Técnicas

### Verificar no Banco de Dados

```sql
-- Contar exercícios sincronizados
SELECT COUNT(*) FROM exercicios WHERE source = 'ASCEND_API';

-- Ver exemplos
SELECT 
  nome, 
  categoria, 
  "ascendExerciseId",
  CASE WHEN "videoUrl" IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_video,
  CASE WHEN "ascendData" IS NOT NULL THEN 'Sim' ELSE 'Não' END as tem_dados
FROM exercicios 
WHERE source = 'ASCEND_API' 
LIMIT 10;

-- Verificar dados traduzidos
SELECT 
  nome,
  "ascendData"::json->>'bodyParts_translated' as grupos_musculares,
  "ascendData"::json->>'equipments_translated' as equipamentos,
  "ascendData"::json->>'targetMuscles_translated' as musculos_alvo
FROM exercicios 
WHERE source = 'ASCEND_API' 
LIMIT 5;
```

### Verificar Logs do Servidor

Durante a sincronização, você verá logs como:
```
🔄 Iniciando sincronização de exercícios da Ascend API...
📥 Buscando exercícios (offset: 0, limit: 50)...
✅ Recebidos 50 exercícios
📊 Progresso: 100 exercícios processados (50 novos, 50 atualizados, 0 ignorados)
...
✅ Sincronização concluída!
```

## ⚠️ Problemas Comuns

### 1. Erro: "Unknown argument `source`"

**Solução:**
```bash
# Parar o servidor
# Regenerar Prisma Client
npx prisma generate
# Reiniciar servidor
```

### 2. Sincronização muito lenta

- Normal: a API tem ~1500 exercícios
- Pode levar 5-15 minutos dependendo da conexão
- O processo é assíncrono e mostra progresso

### 3. Exercícios sem vídeo

- Alguns exercícios da API não têm GIF
- Isso é normal
- O sistema usa `gifUrl` quando disponível

### 4. Traduções incompletas

- Alguns termos podem não estar no dicionário de tradução
- Podem aparecer em inglês
- Pode ser expandido adicionando mais traduções em `server/services/ascendAPI.js`

## 📊 Resultado Esperado

Após sincronização bem-sucedida:
- ✅ ~1500 exercícios no banco com `source = 'ASCEND_API'`
- ✅ Todos com `ascendExerciseId` único
- ✅ Todos com `ascendData` preenchido (JSON com dados traduzidos)
- ✅ Personais veem todos os exercícios automaticamente
- ✅ Busca e filtros funcionando
- ✅ Vídeos/GIFs carregando corretamente

## 🎯 Próximos Passos

1. Execute a sincronização como ADMIN
2. Aguarde a conclusão
3. Teste como Personal
4. Verifique se tudo está funcionando
5. Se necessário, ajuste traduções ou sincronize novamente
