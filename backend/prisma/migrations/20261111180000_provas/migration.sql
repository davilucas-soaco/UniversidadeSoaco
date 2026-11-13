-- CreateTable
CREATE TABLE "prova" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "nota_minima" INTEGER NOT NULL DEFAULT 70,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prova_pergunta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prova_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    CONSTRAINT "prova_pergunta_prova_id_fkey" FOREIGN KEY ("prova_id") REFERENCES "prova" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prova_opcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pergunta_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "prova_opcao_pergunta_id_fkey" FOREIGN KEY ("pergunta_id") REFERENCES "prova_pergunta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prova_tentativa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "prova_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "aprovado" BOOLEAN NOT NULL,
    "respostas" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prova_tentativa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prova_tentativa_prova_id_fkey" FOREIGN KEY ("prova_id") REFERENCES "prova" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prova_tentativa_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "curso_etapa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_curso_etapa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "pai_id" TEXT,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_conteudo" TEXT,
    "video_url" TEXT,
    "video_provedor" TEXT,
    "embed_url" TEXT,
    "prova_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_etapa_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curso_etapa_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "curso_etapa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curso_etapa_prova_id_fkey" FOREIGN KEY ("prova_id") REFERENCES "prova" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_curso_etapa" ("atualizado_em", "criado_em", "curso_id", "descricao", "embed_url", "id", "ordem", "pai_id", "tipo_conteudo", "titulo", "video_provedor", "video_url") SELECT "atualizado_em", "criado_em", "curso_id", "descricao", "embed_url", "id", "ordem", "pai_id", "tipo_conteudo", "titulo", "video_provedor", "video_url" FROM "curso_etapa";
DROP TABLE "curso_etapa";
ALTER TABLE "new_curso_etapa" RENAME TO "curso_etapa";
CREATE INDEX "curso_etapa_curso_id_idx" ON "curso_etapa"("curso_id");
CREATE INDEX "curso_etapa_pai_id_idx" ON "curso_etapa"("pai_id");
CREATE INDEX "curso_etapa_prova_id_idx" ON "curso_etapa"("prova_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "prova_pergunta_prova_id_idx" ON "prova_pergunta"("prova_id");

-- CreateIndex
CREATE INDEX "prova_opcao_pergunta_id_idx" ON "prova_opcao"("pergunta_id");

-- CreateIndex
CREATE INDEX "prova_tentativa_usuario_id_etapa_id_idx" ON "prova_tentativa"("usuario_id", "etapa_id");

-- CreateIndex
CREATE INDEX "prova_tentativa_prova_id_idx" ON "prova_tentativa"("prova_id");
