-- ================================================
-- Script para corrigir permissões para o usuário POSTGRE
-- Execute como usuário postgres
-- ================================================

-- IMPORTANTE: Conceder permissão no schema primeiro!
GRANT USAGE ON SCHEMA public TO postgre;
GRANT CREATE ON SCHEMA public TO postgre;

-- Conceder permissões na tabela users
GRANT ALL PRIVILEGES ON TABLE "users" TO postgre;

-- Conceder permissões em todas as tabelas existentes (método genérico)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgre;

-- Conceder permissões em todas as sequências existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgre;

-- Conceder permissões em tabelas futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgre;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgre;

-- Verificar permissões na tabela users
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'users' 
  AND grantee = 'postgre'
ORDER BY privilege_type;

-- ✅ Script concluído!
