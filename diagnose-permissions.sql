-- ================================================
-- Script de diagnóstico de permissões
-- Execute como usuário postgres
-- ================================================

-- 1. Verificar qual usuário está tentando acessar
SELECT current_user as usuario_atual;

-- 2. Verificar se o usuário dietyourself_user existe
SELECT 
  usename as usuario,
  usecreatedb as pode_criar_db,
  usesuper as superusuario
FROM pg_user
WHERE usename = 'dietyourself_user';

-- 3. Verificar permissões na tabela users
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'users' 
  AND grantee = 'dietyourself_user'
ORDER BY privilege_type;

-- 4. Verificar em qual schema está a tabela users
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'users';

-- 5. Verificar se há problemas com o schema
SELECT 
  schema_name,
  schema_owner
FROM information_schema.schemata
WHERE schema_name IN ('public', 'dietyourself_user');

-- 6. Tentar conceder permissões novamente (forçar)
GRANT ALL PRIVILEGES ON TABLE "users" TO dietyourself_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;
GRANT USAGE ON SCHEMA public TO dietyourself_user;

-- 7. Verificar permissões finais
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'users' 
  AND grantee = 'dietyourself_user'
ORDER BY privilege_type;

-- ✅ Script concluído!
