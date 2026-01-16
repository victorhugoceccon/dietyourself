-- Script para corrigir problemas na VPS
-- Execute este script no PostgreSQL da VPS

-- ==========================================================
-- 1. Verificar e corrigir tabela notifications
-- ==========================================================

-- Verificar se a tabela existe
DO $$
BEGIN
    -- Adicionar foreign key se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_userId_fkey'
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE "notifications" 
        ADD CONSTRAINT "notifications_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key notifications_userId_fkey adicionada';
    ELSE
        RAISE NOTICE 'Foreign key notifications_userId_fkey já existe';
    END IF;
END $$;

-- ==========================================================
-- 2. Verificar e corrigir tabela grupos (adicionar bannerUrl se faltar)
-- ==========================================================

DO $$
BEGIN
    -- Adicionar coluna bannerUrl se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grupos' AND column_name = 'bannerUrl'
    ) THEN
        ALTER TABLE "grupos" ADD COLUMN "bannerUrl" TEXT;
        RAISE NOTICE 'Coluna bannerUrl adicionada à tabela grupos';
    ELSE
        RAISE NOTICE 'Coluna bannerUrl já existe na tabela grupos';
    END IF;
END $$;

-- ==========================================================
-- 3. Verificar se todas as foreign keys estão corretas
-- ==========================================================

-- Verificar foreign key de grupos -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grupos_criadoPorId_fkey'
        AND table_name = 'grupos'
    ) THEN
        ALTER TABLE "grupos" 
        ADD CONSTRAINT "grupos_criadoPorId_fkey" 
        FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key grupos_criadoPorId_fkey adicionada';
    END IF;
END $$;

-- Verificar foreign keys de grupos_membros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grupos_membros_grupoId_fkey'
        AND table_name = 'grupos_membros'
    ) THEN
        ALTER TABLE "grupos_membros" 
        ADD CONSTRAINT "grupos_membros_grupoId_fkey" 
        FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key grupos_membros_grupoId_fkey adicionada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'grupos_membros_userId_fkey'
        AND table_name = 'grupos_membros'
    ) THEN
        ALTER TABLE "grupos_membros" 
        ADD CONSTRAINT "grupos_membros_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key grupos_membros_userId_fkey adicionada';
    END IF;
END $$;

-- ==========================================================
-- 4. Verificar índices importantes
-- ==========================================================

-- Índices para notifications
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- Índices para grupos (se não existirem)
CREATE INDEX IF NOT EXISTS "grupos_criadoPorId_idx" ON "grupos"("criadoPorId");
CREATE INDEX IF NOT EXISTS "grupos_codigoConvite_idx" ON "grupos"("codigoConvite");
CREATE UNIQUE INDEX IF NOT EXISTS "grupos_codigoConvite_key" ON "grupos"("codigoConvite");

-- Índices para grupos_membros (se não existirem)
CREATE INDEX IF NOT EXISTS "grupos_membros_grupoId_idx" ON "grupos_membros"("grupoId");
CREATE INDEX IF NOT EXISTS "grupos_membros_userId_idx" ON "grupos_membros"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "grupos_membros_grupoId_userId_key" ON "grupos_membros"("grupoId", "userId");

-- ==========================================================
-- 5. Verificar se a tabela subscriptions tem todos os campos
-- ==========================================================

DO $$
BEGIN
    -- Verificar campos críticos da tabela subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'trialStartDate'
    ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "trialStartDate" TIMESTAMP(3);
        RAISE NOTICE 'Coluna trialStartDate adicionada à tabela subscriptions';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'trialEndDate'
    ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "trialEndDate" TIMESTAMP(3);
        RAISE NOTICE 'Coluna trialEndDate adicionada à tabela subscriptions';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE "subscriptions" ADD COLUMN "metadata" TEXT;
        RAISE NOTICE 'Coluna metadata adicionada à tabela subscriptions';
    END IF;
END $$;

-- Mostrar resumo
SELECT 
    'Tabela: ' || table_name || ' | Colunas: ' || COUNT(*)::text as resumo
FROM information_schema.columns
WHERE table_name IN ('notifications', 'grupos', 'grupos_membros', 'subscriptions')
GROUP BY table_name
ORDER BY table_name;
