-- Migration: Adicionar novas funcionalidades
-- Data: 2024-12-19
-- Tabelas: notifications, diet_templates, body_measurements, recipes, recipe_favorites

-- ================================================
-- NOTIFICATIONS
-- ================================================
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'default',
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");

-- ================================================
-- DIET TEMPLATES
-- ================================================
CREATE TABLE IF NOT EXISTS "diet_templates" (
    "id" TEXT NOT NULL,
    "nutricionistaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objetivo" TEXT,
    "kcalRange" TEXT,
    "templateData" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "diet_templates_nutricionistaId_idx" ON "diet_templates"("nutricionistaId");
CREATE INDEX IF NOT EXISTS "diet_templates_objetivo_idx" ON "diet_templates"("objetivo");

-- ================================================
-- BODY MEASUREMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS "body_measurements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "peso" DOUBLE PRECISION,
    "percentualGordura" DOUBLE PRECISION,
    "massaMagra" DOUBLE PRECISION,
    "cintura" DOUBLE PRECISION,
    "quadril" DOUBLE PRECISION,
    "bracoEsquerdo" DOUBLE PRECISION,
    "bracoDireito" DOUBLE PRECISION,
    "coxaEsquerda" DOUBLE PRECISION,
    "coxaDireita" DOUBLE PRECISION,
    "panturrilhaEsq" DOUBLE PRECISION,
    "panturrilhaDir" DOUBLE PRECISION,
    "peitoral" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "rcq" DOUBLE PRECISION,
    "notas" TEXT,
    "fotoFrente" TEXT,
    "fotoLateral" TEXT,
    "fotoCostas" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "body_measurements_userId_idx" ON "body_measurements"("userId");
CREATE INDEX IF NOT EXISTS "body_measurements_dataRegistro_idx" ON "body_measurements"("dataRegistro");

-- ================================================
-- RECIPES
-- ================================================
CREATE TABLE IF NOT EXISTS "recipes" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Fácil',
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "kcal" INTEGER,
    "proteina_g" DOUBLE PRECISION,
    "carbo_g" DOUBLE PRECISION,
    "gordura_g" DOUBLE PRECISION,
    "fibra_g" DOUBLE PRECISION,
    "ingredients" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "tips" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recipes_category_idx" ON "recipes"("category");
CREATE INDEX IF NOT EXISTS "recipes_authorId_idx" ON "recipes"("authorId");
CREATE INDEX IF NOT EXISTS "recipes_tags_idx" ON "recipes"("tags");

-- ================================================
-- RECIPE FAVORITES
-- ================================================
CREATE TABLE IF NOT EXISTS "recipe_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recipe_favorites_userId_recipeId_key" ON "recipe_favorites"("userId", "recipeId");
CREATE INDEX IF NOT EXISTS "recipe_favorites_userId_idx" ON "recipe_favorites"("userId");


