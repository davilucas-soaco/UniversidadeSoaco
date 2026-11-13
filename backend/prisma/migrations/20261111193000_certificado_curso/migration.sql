-- AlterTable
ALTER TABLE "matricula" ADD COLUMN "primeira_conclusao_em" DATETIME;

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
    "gera_certificado" BOOLEAN NOT NULL DEFAULT true,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "instrutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_curso" ("atualizado_em", "capa_cor", "capa_icone", "capa_imagem", "carga_horaria", "categoria", "criado_em", "descricao", "embed_url", "id", "instrutor_id", "objetivos", "pontos", "publicado", "sequencia_obrigatoria", "tipo_conteudo", "titulo", "video_provedor", "video_url") SELECT "atualizado_em", "capa_cor", "capa_icone", "capa_imagem", "carga_horaria", "categoria", "criado_em", "descricao", "embed_url", "id", "instrutor_id", "objetivos", "pontos", "publicado", "sequencia_obrigatoria", "tipo_conteudo", "titulo", "video_provedor", "video_url" FROM "curso";
DROP TABLE "curso";
ALTER TABLE "new_curso" RENAME TO "curso";
CREATE INDEX "curso_instrutor_id_idx" ON "curso"("instrutor_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Quem já tem certificado já concluiu o curso ao menos uma vez.
UPDATE "matricula" SET "primeira_conclusao_em" = (SELECT "emitido_em" FROM "certificado" WHERE "certificado"."usuario_id" = "matricula"."usuario_id" AND "certificado"."curso_id" = "matricula"."curso_id") WHERE "primeira_conclusao_em" IS NULL;
