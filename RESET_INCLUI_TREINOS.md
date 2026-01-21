# ✅ Reset Agora Inclui Treinos

## 🔄 Mudanças Realizadas

A função de reset (`POST /api/user/reset`) foi atualizada para também deletar os treinos do usuário, não apenas a dieta e o questionário.

### O que é deletado no reset:

1. ✅ **Dieta** - Todas as dietas do usuário
2. ✅ **Questionário** - Dados do questionário de saúde
3. ✅ **Check-ins** - Check-ins diários
4. ✅ **Refeições consumidas** - Histórico de refeições
5. ✅ **Prescrições de treino** - Treinos gerados por IA ou prescritos por personal (NOVO)
6. ✅ **Treinos executados** - Histórico de treinos executados (NOVO)

## 📝 Código Atualizado

A função de reset em `server/routes/user.js` agora inclui:

```javascript
// Deletar prescrições de treino (treinos gerados por IA ou prescritos por personal)
try {
  await prisma.prescricaoTreino.deleteMany({
    where: { pacienteId: userId }
  })
  console.log('✅ Prescrições de treino deletadas')
} catch (error) {
  console.error('Erro ao deletar prescrições de treino:', error)
}

// Deletar treinos executados (já deve ser deletado em cascata, mas garantindo)
try {
  await prisma.treinoExecutado.deleteMany({
    where: { pacienteId: userId }
  })
  console.log('✅ Treinos executados deletados')
} catch (error) {
  console.error('Erro ao deletar treinos executados:', error)
}
```

## 🧹 Limpar Treinos Manualmente

Se você precisar limpar os treinos de um usuário específico manualmente, use um dos scripts abaixo:

### Opção 1: Script Node.js (Recomendado)

```bash
node scripts/delete-user-workouts.js <email>
```

Exemplo:
```bash
node scripts/delete-user-workouts.js paciente@Teste.com
```

### Opção 2: Script SQL

Execute no PostgreSQL:

```sql
-- Substitua 'paciente@Teste.com' pelo email do usuário
DO $$
DECLARE
    target_user_id TEXT;
BEGIN
    SELECT id INTO target_user_id
    FROM users
    WHERE email = 'paciente@Teste.com';

    DELETE FROM treinos_executados WHERE "pacienteId" = target_user_id;
    DELETE FROM prescricoes_treino WHERE "pacienteId" = target_user_id;
END $$;
```

## ✅ Verificação

Após o reset, o sistema agora:
- ✅ Deleta todos os treinos (prescrições e treinos executados)
- ✅ Deleta a dieta
- ✅ Deleta o questionário
- ✅ Deleta check-ins e refeições consumidas
- ✅ Registra o reset no controle de geração

## 📋 Nota sobre Cascata

O Prisma está configurado com `onDelete: Cascade`, então quando uma `PrescricaoTreino` é deletada, todas as divisões (`PrescricaoTreinoDivisao`) e itens (`PrescricaoTreinoItem`) relacionados são automaticamente deletados. O script também deleta explicitamente os `TreinoExecutado` para garantir que tudo seja limpo.
