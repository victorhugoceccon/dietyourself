-- Script para deletar todos os treinos de um usuário específico
-- Uso: Execute este script no PostgreSQL para limpar os treinos do usuário

-- Substitua 'paciente@Teste.com' pelo email do usuário que você quer limpar
-- Ou substitua o userId diretamente se souber o ID

-- 1. Encontrar o userId pelo email
DO $$
DECLARE
    target_user_id TEXT;
BEGIN
    -- Buscar userId pelo email
    SELECT id INTO target_user_id
    FROM users
    WHERE email = 'paciente@Teste.com';

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email paciente@Teste.com não encontrado';
    END IF;

    RAISE NOTICE 'Usuário encontrado: %', target_user_id;

    -- 2. Deletar treinos executados (deve ser feito antes das prescrições devido às foreign keys)
    DELETE FROM treinos_executados
    WHERE "pacienteId" = target_user_id;

    RAISE NOTICE 'Treinos executados deletados';

    -- 3. Deletar prescrições de treino (isso vai deletar automaticamente as divisões e itens em cascata)
    DELETE FROM prescricoes_treino
    WHERE "pacienteId" = target_user_id;

    RAISE NOTICE 'Prescrições de treino deletadas';

    RAISE NOTICE 'Limpeza concluída para o usuário: %', target_user_id;
END $$;

-- Verificação: Contar quantos treinos restam para o usuário
SELECT 
    u.email,
    COUNT(DISTINCT pt.id) as prescricoes_count,
    COUNT(DISTINCT te.id) as treinos_executados_count
FROM users u
LEFT JOIN prescricoes_treino pt ON pt."pacienteId" = u.id
LEFT JOIN treinos_executados te ON te."pacienteId" = u.id
WHERE u.email = 'paciente@Teste.com'
GROUP BY u.email;
