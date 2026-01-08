-- ================================================
-- Script para corrigir permissões do banco de dados
-- Execute como usuário postgres
-- ================================================

-- Conceder permissões na tabela users
GRANT ALL PRIVILEGES ON TABLE "users" TO dietyourself_user;

-- Conceder permissões em sequências (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users_id_seq') THEN
    GRANT USAGE, SELECT ON SEQUENCE "users_id_seq" TO dietyourself_user;
  END IF;
END $$;

-- Conceder permissões em todas as outras tabelas principais (apenas se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questionnaire_data') THEN
    GRANT ALL PRIVILEGES ON TABLE "questionnaire_data" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet') THEN
    GRANT ALL PRIVILEGES ON TABLE "diet" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alimentos') THEN
    GRANT ALL PRIVILEGES ON TABLE "alimentos" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercicios') THEN
    GRANT ALL PRIVILEGES ON TABLE "exercicios" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'divisao_treino') THEN
    GRANT ALL PRIVILEGES ON TABLE "divisao_treino" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescricao_treino') THEN
    GRANT ALL PRIVILEGES ON TABLE "prescricao_treino" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treino_executado') THEN
    GRANT ALL PRIVILEGES ON TABLE "treino_executado" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback_treino') THEN
    GRANT ALL PRIVILEGES ON TABLE "feedback_treino" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes_mudanca') THEN
    GRANT ALL PRIVILEGES ON TABLE "solicitacoes_mudanca" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'body_measurements') THEN
    GRANT ALL PRIVILEGES ON TABLE "body_measurements" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branding_settings') THEN
    GRANT ALL PRIVILEGES ON TABLE "branding_settings" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_token') THEN
    GRANT ALL PRIVILEGES ON TABLE "password_reset_token" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    GRANT ALL PRIVILEGES ON TABLE "notifications" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diet_templates') THEN
    GRANT ALL PRIVILEGES ON TABLE "diet_templates" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipes') THEN
    GRANT ALL PRIVILEGES ON TABLE "recipes" TO dietyourself_user;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checkin') THEN
    GRANT ALL PRIVILEGES ON TABLE "daily_checkin" TO dietyourself_user;
  END IF;
END $$;

-- Conceder permissões em todas as sequências existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dietyourself_user;

-- Conceder permissões em todas as tabelas existentes (método genérico - mais seguro)
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
