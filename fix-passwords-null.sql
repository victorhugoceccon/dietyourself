-- ================================================
-- Script para corrigir senhas NULL ou vazias
-- Execute como usuário postgres
-- ================================================

-- Hash da senha "123456" gerado com bcrypt (10 rounds)
-- Hash: $2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO

-- Verificar status atual das senhas
SELECT 
  email,
  name,
  role,
  CASE 
    WHEN password IS NULL THEN '❌ NULL'
    WHEN password = '' THEN '❌ VAZIO'
    WHEN LENGTH(password) < 50 THEN '⚠️ INVÁLIDO'
    ELSE '✅ OK'
  END as senha_status,
  LENGTH(password) as tamanho_hash
FROM "users"
WHERE email IN (
  'admin@lifefit.com',
  'nutricionista@lifefit.com',
  'personal@lifefit.com',
  'paciente@teste.com',
  'maria@teste.com',
  'teste@teste.com'
)
ORDER BY email;

-- Corrigir senhas NULL ou vazias
UPDATE "users"
SET 
  "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
  "updatedAt" = now()
WHERE 
  email IN (
    'admin@lifefit.com',
    'nutricionista@lifefit.com',
    'personal@lifefit.com',
    'paciente@teste.com',
    'maria@teste.com',
    'teste@teste.com'
  )
  AND (
    password IS NULL 
    OR password = ''
    OR LENGTH(password) < 50
  );

-- Verificar resultado
SELECT 
  email,
  CASE 
    WHEN password IS NULL THEN '❌ NULL'
    WHEN password = '' THEN '❌ VAZIO'
    WHEN LENGTH(password) < 50 THEN '⚠️ INVÁLIDO'
    ELSE '✅ OK'
  END as senha_status,
  LENGTH(password) as tamanho_hash
FROM "users"
WHERE email IN (
  'admin@lifefit.com',
  'nutricionista@lifefit.com',
  'personal@lifefit.com',
  'paciente@teste.com',
  'maria@teste.com',
  'teste@teste.com'
)
ORDER BY email;

-- ✅ Script concluído!
