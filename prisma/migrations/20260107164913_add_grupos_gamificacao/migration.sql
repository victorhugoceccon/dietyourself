-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "codigoConvite" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "inicio" TIMESTAMP(3),
    "fim" TIMESTAMP(3),
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_membros" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'MEMBRO',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_pontos_eventos" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "referenciaTipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pontos_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupos_codigoConvite_key" ON "grupos"("codigoConvite");

-- CreateIndex
CREATE INDEX "grupos_criadoPorId_idx" ON "grupos"("criadoPorId");

-- CreateIndex
CREATE INDEX "grupos_codigoConvite_idx" ON "grupos"("codigoConvite");

-- CreateIndex
CREATE INDEX "grupos_membros_grupoId_idx" ON "grupos_membros"("grupoId");

-- CreateIndex
CREATE INDEX "grupos_membros_userId_idx" ON "grupos_membros"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_membros_grupoId_userId_key" ON "grupos_membros"("grupoId", "userId");

-- CreateIndex
CREATE INDEX "grupos_pontos_eventos_grupoId_idx" ON "grupos_pontos_eventos"("grupoId");

-- CreateIndex
CREATE INDEX "grupos_pontos_eventos_userId_idx" ON "grupos_pontos_eventos"("userId");

-- CreateIndex
CREATE INDEX "grupos_pontos_eventos_createdAt_idx" ON "grupos_pontos_eventos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_pontos_eventos_grupoId_referenciaTipo_referenciaId_key" ON "grupos_pontos_eventos"("grupoId", "referenciaTipo", "referenciaId");

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_membros" ADD CONSTRAINT "grupos_membros_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_membros" ADD CONSTRAINT "grupos_membros_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_pontos_eventos" ADD CONSTRAINT "grupos_pontos_eventos_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_pontos_eventos" ADD CONSTRAINT "grupos_pontos_eventos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
