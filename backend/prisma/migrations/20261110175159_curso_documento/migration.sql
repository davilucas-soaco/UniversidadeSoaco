-- CreateTable
CREATE TABLE "curso_documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "arquivo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "curso_documento_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "curso_documento_curso_id_idx" ON "curso_documento"("curso_id");
