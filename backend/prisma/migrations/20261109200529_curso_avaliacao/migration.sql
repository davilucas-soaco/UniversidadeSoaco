-- CreateTable
CREATE TABLE "curso_avaliacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_avaliacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "curso_avaliacao_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "curso_avaliacao_curso_id_idx" ON "curso_avaliacao"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "curso_avaliacao_usuario_id_curso_id_key" ON "curso_avaliacao"("usuario_id", "curso_id");
