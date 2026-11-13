-- CreateTable
CREATE TABLE "trilha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "sequencia_obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "gera_certificado" BOOLEAN NOT NULL DEFAULT true,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "prazo" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "trilha_curso" (
    "trilha_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    PRIMARY KEY ("trilha_id", "curso_id"),
    CONSTRAINT "trilha_curso_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trilha_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trilha_alvo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trilha_id" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "setor_id" INTEGER,
    "classe_id" INTEGER,
    CONSTRAINT "trilha_alvo_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trilha_alvo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trilha_alvo_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trilha_alvo_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificado_trilha" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "trilha_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "emitido_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificado_trilha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "certificado_trilha_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilha" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_atribuicao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "setor_id" INTEGER,
    "classe_id" INTEGER,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "prazo" TEXT,
    "atribuido_por_id" TEXT,
    "trilha_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "atribuicao_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_trilha_id_fkey" FOREIGN KEY ("trilha_id") REFERENCES "trilha" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_atribuido_por_id_fkey" FOREIGN KEY ("atribuido_por_id") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_atribuicao" ("alvo", "atribuido_por_id", "classe_id", "criado_em", "curso_id", "id", "obrigatorio", "prazo", "setor_id", "usuario_id") SELECT "alvo", "atribuido_por_id", "classe_id", "criado_em", "curso_id", "id", "obrigatorio", "prazo", "setor_id", "usuario_id" FROM "atribuicao";
DROP TABLE "atribuicao";
ALTER TABLE "new_atribuicao" RENAME TO "atribuicao";
CREATE INDEX "atribuicao_curso_id_idx" ON "atribuicao"("curso_id");
CREATE INDEX "atribuicao_usuario_id_idx" ON "atribuicao"("usuario_id");
CREATE INDEX "atribuicao_setor_id_idx" ON "atribuicao"("setor_id");
CREATE INDEX "atribuicao_classe_id_idx" ON "atribuicao"("classe_id");
CREATE INDEX "atribuicao_trilha_id_idx" ON "atribuicao"("trilha_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "trilha_curso_curso_id_idx" ON "trilha_curso"("curso_id");

-- CreateIndex
CREATE INDEX "trilha_alvo_trilha_id_idx" ON "trilha_alvo"("trilha_id");

-- CreateIndex
CREATE INDEX "trilha_alvo_usuario_id_idx" ON "trilha_alvo"("usuario_id");

-- CreateIndex
CREATE INDEX "trilha_alvo_setor_id_idx" ON "trilha_alvo"("setor_id");

-- CreateIndex
CREATE INDEX "trilha_alvo_classe_id_idx" ON "trilha_alvo"("classe_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_trilha_codigo_key" ON "certificado_trilha"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_trilha_usuario_id_trilha_id_key" ON "certificado_trilha"("usuario_id", "trilha_id");
