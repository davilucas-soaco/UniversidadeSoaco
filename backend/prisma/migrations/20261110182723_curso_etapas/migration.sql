-- CreateTable
CREATE TABLE "curso_etapa" (
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
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_etapa_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curso_etapa_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "curso_etapa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "etapa_progresso" (
    "usuario_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "concluida_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("usuario_id", "etapa_id"),
    CONSTRAINT "etapa_progresso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "etapa_progresso_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "curso_etapa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_curso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "carga_horaria" REAL NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "capa_cor" TEXT NOT NULL DEFAULT 'navy',
    "capa_icone" TEXT NOT NULL DEFAULT 'book',
    "capa_imagem" TEXT,
    "instrutor_id" TEXT,
    "objetivos" TEXT NOT NULL DEFAULT '[]',
    "tipo_conteudo" TEXT,
    "video_url" TEXT,
    "video_provedor" TEXT,
    "embed_url" TEXT,
    "sequencia_obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "instrutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_curso" ("atualizado_em", "capa_cor", "capa_icone", "capa_imagem", "carga_horaria", "categoria", "criado_em", "descricao", "embed_url", "id", "instrutor_id", "objetivos", "pontos", "publicado", "tipo_conteudo", "titulo", "video_provedor", "video_url") SELECT "atualizado_em", "capa_cor", "capa_icone", "capa_imagem", "carga_horaria", "categoria", "criado_em", "descricao", "embed_url", "id", "instrutor_id", "objetivos", "pontos", "publicado", "tipo_conteudo", "titulo", "video_provedor", "video_url" FROM "curso";
DROP TABLE "curso";
ALTER TABLE "new_curso" RENAME TO "curso";
CREATE INDEX "curso_instrutor_id_idx" ON "curso"("instrutor_id");
CREATE TABLE "new_curso_documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "etapa_id" TEXT,
    "nome" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "arquivo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "curso_documento_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curso_documento_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "curso_etapa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_curso_documento" ("arquivo", "criado_em", "curso_id", "id", "mime", "nome", "ordem", "tamanho") SELECT "arquivo", "criado_em", "curso_id", "id", "mime", "nome", "ordem", "tamanho" FROM "curso_documento";
DROP TABLE "curso_documento";
ALTER TABLE "new_curso_documento" RENAME TO "curso_documento";
CREATE INDEX "curso_documento_curso_id_idx" ON "curso_documento"("curso_id");
CREATE INDEX "curso_documento_etapa_id_idx" ON "curso_documento"("etapa_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "curso_etapa_curso_id_idx" ON "curso_etapa"("curso_id");

-- CreateIndex
CREATE INDEX "curso_etapa_pai_id_idx" ON "curso_etapa"("pai_id");

-- CreateIndex
CREATE INDEX "etapa_progresso_etapa_id_idx" ON "etapa_progresso"("etapa_id");
