-- ================================================
-- Script para corrigir permissões do banco de dados
-- Execute como usuário postgres
-- ================================================

-- Conceder permissões na tabela users
GRANT ALL PRIVILEGES ON TABLE "users" TO dietyourself_user;
GRANT USAGE, SELECT ON SEQUENCE "users_id_seq" TO dietyourself_user;

-- Conceder permissões em todas as outras tabelas principais
GRANT ALL PRIVILEGES ON TABLE "questionnaire_data" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "diet" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "alimentos" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "exercicios" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "divisao_treino" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "prescricao_treino" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "treino_executado" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "feedback_treino" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "solicitacoes_mudanca" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "body_measurements" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "branding_settings" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "password_reset_token" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "notifications" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "diet_templates" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "recipes" TO dietyourself_user;
GRANT ALL PRIVILEGES ON TABLE "daily_checkin" TO dietyourself_user;

-- Conceder permissões em todas as sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dietyourself_user;

-- Conceder permissões em todas as tabelas (método genérico)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dietyourself_user;

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
