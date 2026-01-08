-- ================================================
-- Script SIMPLIFICADO para corrigir permissões
-- Execute como usuário postgres
-- ================================================

-- Conceder permissões na tabela users (essencial)
GRANT ALL PRIVILEGES ON TABLE "users" TO dietyourself_user;

-- Conceder permissões em todas as tabelas existentes (método genérico)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;

-- Conceder permissões em todas as sequências existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dietyourself_user;

-- Conceder permissões em tabelas futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dietyourself_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dietyourself_user;

-- Verificar permissões na tabela users
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'users' 
  AND grantee = 'dietyourself_user'
ORDER BY privilege_type;

-- ✅ Script concluído!
