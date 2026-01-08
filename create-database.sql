-- Script para criar o banco de dados DietYourself
-- Execute este script no PostgreSQL usando: psql -U postgres -f create-database.sql
-- Ou copie e cole no pgAdmin

-- Criar banco de dados (se não existir)
CREATE DATABASE dietyourself
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Portuguese_Brazil.1252'
    LC_CTYPE = 'Portuguese_Brazil.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Conectar ao banco criado
\c dietyourself

-- Mensagem de sucesso
SELECT 'Banco de dados dietyourself criado com sucesso!' AS mensagem;


