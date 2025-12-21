-- ================================================
-- Script para criar usuários de teste
-- Execute como usuário postgres
-- ================================================

-- IMPORTANTE: Este script cria usuários com senhas já hasheadas
-- As senhas são: "123456" (hash bcrypt)

-- Hash da senha "123456" gerado com bcrypt (10 rounds)
-- Hash: $2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO

-- ================================================
-- ADMINISTRADOR
-- ================================================
INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "motivationalMessage", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@lifefit.com',
  '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
  'Administrador',
  'ADMIN',
  '["ADMIN","NUTRICIONISTA","PERSONAL"]',
  'Bem-vindo ao LifeFit!',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  "role" = 'ADMIN',
  "roles" = '["ADMIN","NUTRICIONISTA","PERSONAL"]',
  "updatedAt" = now();

-- ================================================
-- NUTRICIONISTA
-- ================================================
INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "motivationalMessage", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'nutricionista@lifefit.com',
  '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
  'Dr. Ana Silva',
  'NUTRICIONISTA',
  '["NUTRICIONISTA"]',
  'Sua saúde é nossa prioridade!',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
  "role" = 'NUTRICIONISTA',
  "roles" = '["NUTRICIONISTA"]',
  "updatedAt" = now();

-- ================================================
-- PERSONAL TRAINER
-- ================================================
INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "motivationalMessage", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'personal@lifefit.com',
  '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
  'Carlos Personal',
  'PERSONAL',
  '["PERSONAL"]',
  'Vamos alcançar seus objetivos juntos!',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
  "role" = 'PERSONAL',
  "roles" = '["PERSONAL"]',
  "updatedAt" = now();

-- ================================================
-- PACIENTE 1 (vinculado ao nutricionista e personal)
-- ================================================
DO $$
DECLARE
  nutricionista_id TEXT;
  personal_id TEXT;
  paciente1_id TEXT;
BEGIN
  -- Buscar IDs do nutricionista e personal
  SELECT id INTO nutricionista_id FROM "users" WHERE email = 'nutricionista@lifefit.com' LIMIT 1;
  SELECT id INTO personal_id FROM "users" WHERE email = 'personal@lifefit.com' LIMIT 1;
  
  -- Criar ou atualizar paciente 1
  INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "nutricionistaId", "personalId", "motivationalMessage", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'paciente@teste.com',
    '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
    'João Silva',
    'PACIENTE',
    '["PACIENTE"]',
    nutricionista_id,
    personal_id,
    'Você está no caminho certo!',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
    "nutricionistaId" = nutricionista_id,
    "personalId" = personal_id,
    "updatedAt" = now();
  
  -- Buscar ID do paciente (criado ou atualizado)
  SELECT id INTO paciente1_id FROM "users" WHERE email = 'paciente@teste.com' LIMIT 1;
  
  -- Criar questionário para paciente 1
  INSERT INTO "questionnaire_data" (
    "id", "userId", "idade", "sexo", "altura", "pesoAtual", "objetivo",
    "frequenciaAtividade", "tipoAtividade", "horarioTreino", "rotinaDiaria",
    "quantidadeRefeicoes", "preferenciaRefeicoes",
    "confortoPesar", "tempoPreparacao", "preferenciaVariacao",
    "alimentosDoDiaADia", "restricaoAlimentar", "alimentosEvita",
    "opcoesSubstituicao", "refeicoesLivres", "createdAt", "updatedAt"
  )
  VALUES (
    gen_random_uuid()::text,
    paciente1_id,
    30,
    'Masculino',
    175.0,
    80.0,
    'Emagrecer',
    'Sim, 3–4x por semana',
    'Musculação',
    'Tarde',
    'Moderada (anda bastante, se movimenta no dia)',
    '4 refeições',
    'Um equilíbrio entre simples e variadas',
    'Sim, sem problemas',
    'Médio (10–30 min)',
    'Prefiro variedade',
    '{"carboidratos":["Arroz","Feijão"],"proteinas":["Frango","Ovos"],"gorduras":[],"frutas":["Banana","Aveia"]}',
    'Nenhuma',
    '',
    'Sim, gosto de ter opções',
    'Talvez',
    now(),
    now()
  )
  ON CONFLICT ("userId") DO UPDATE SET
    "updatedAt" = now();
END $$;

-- ================================================
-- PACIENTE 2 (vinculado ao nutricionista e personal)
-- ================================================
DO $$
DECLARE
  nutricionista_id TEXT;
  personal_id TEXT;
BEGIN
  SELECT id INTO nutricionista_id FROM "users" WHERE email = 'nutricionista@lifefit.com' LIMIT 1;
  SELECT id INTO personal_id FROM "users" WHERE email = 'personal@lifefit.com' LIMIT 1;
  
  INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "nutricionistaId", "personalId", "motivationalMessage", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'maria@teste.com',
    '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
    'Maria Santos',
    'PACIENTE',
    '["PACIENTE"]',
    nutricionista_id,
    personal_id,
    'Continue firme na sua jornada!',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
    "nutricionistaId" = nutricionista_id,
    "personalId" = personal_id,
    "updatedAt" = now();
END $$;

-- ================================================
-- PACIENTE 3 (vinculado apenas ao nutricionista)
-- ================================================
DO $$
DECLARE
  nutricionista_id TEXT;
BEGIN
  SELECT id INTO nutricionista_id FROM "users" WHERE email = 'nutricionista@lifefit.com' LIMIT 1;
  
  INSERT INTO "users" ("id", "email", "password", "name", "role", "roles", "nutricionistaId", "motivationalMessage", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    'teste@teste.com',
    '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO', -- hash de "123456"
    'Usuário Teste',
    'PACIENTE',
    '["PACIENTE"]',
    nutricionista_id,
    'Bem-vindo ao LifeFit!',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    "password" = '$2a$10$QC5NFiMb00BHymwj6Vacc./j3exlfHyMzaLx5oy.SEz5DvdvHW4MO',
    "nutricionistaId" = nutricionista_id,
    "updatedAt" = now();
END $$;

-- ================================================
-- RESUMO
-- ================================================
SELECT 
  '✅ Usuários de teste criados!' as status,
  COUNT(*) FILTER (WHERE role = 'ADMIN') as admins,
  COUNT(*) FILTER (WHERE role = 'NUTRICIONISTA') as nutricionistas,
  COUNT(*) FILTER (WHERE role = 'PERSONAL') as personais,
  COUNT(*) FILTER (WHERE role = 'PACIENTE') as pacientes
FROM "users"
WHERE email IN (
  'admin@lifefit.com',
  'nutricionista@lifefit.com',
  'personal@lifefit.com',
  'paciente@teste.com',
  'maria@teste.com',
  'teste@teste.com'
);

-- Mostrar credenciais
SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as separator;

SELECT 
  '👤 Admin' as tipo,
  'admin@lifefit.com' as email,
  '123456' as senha;

SELECT 
  '🥗 Nutricionista' as tipo,
  'nutricionista@lifefit.com' as email,
  '123456' as senha;

SELECT 
  '💪 Personal' as tipo,
  'personal@lifefit.com' as email,
  '123456' as senha;

SELECT 
  '👤 Paciente 1' as tipo,
  'paciente@teste.com' as email,
  '123456' as senha;

SELECT 
  '👤 Paciente 2' as tipo,
  'maria@teste.com' as email,
  '123456' as senha;

SELECT 
  '👤 Paciente 3' as tipo,
  'teste@teste.com' as email,
  '123456' as senha;

-- ✅ Script concluído!
