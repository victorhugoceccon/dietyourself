-- ================================================
-- Script COMPLETO para corrigir permissões do usuário POSTGRE
-- Execute como usuário postgres
-- ================================================

-- IMPORTANTE: Conceder permissão no schema primeiro!
GRANT USAGE ON SCHEMA public TO postgre;
GRANT CREATE ON SCHEMA public TO postgre;

-- Conceder permissões em TODAS as tabelas existentes (método genérico - mais seguro)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgre;

-- Conceder permissões em TODAS as sequências existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgre;

-- Conceder permissões em tabelas futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgre;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgre;

-- Verificar permissões nas tabelas principais
SELECT 
  grantee,
  table_schema,
  table_name,
  COUNT(*) as total_permissoes
FROM information_schema.table_privileges
WHERE grantee = 'postgre'
  AND table_name IN ('users', 'questionnaire_data', 'diet', 'alimentos', 'exercicios')
GROUP BY grantee, table_schema, table_name
ORDER BY table_name;

-- ✅ Script concluído!
