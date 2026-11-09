-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'colaborador',
    "cargo" TEXT NOT NULL DEFAULT '',
    "trocar_senha" BOOLEAN NOT NULL DEFAULT false,
    "setor_id" INTEGER,
    "telefone" TEXT,
    "localizacao" TEXT,
    "foto_url" TEXT,
    "meta_horas_ano" INTEGER NOT NULL DEFAULT 80,
    "meta_minutos_semana" INTEGER NOT NULL DEFAULT 330,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login_em" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "usuario_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usuario" ("ativo", "atualizado_em", "cargo", "criado_em", "email", "foto_url", "id", "localizacao", "meta_horas_ano", "meta_minutos_semana", "nome", "papel", "senha_hash", "setor_id", "telefone", "ultimo_login_em") SELECT "ativo", "atualizado_em", "cargo", "criado_em", "email", "foto_url", "id", "localizacao", "meta_horas_ano", "meta_minutos_semana", "nome", "papel", "senha_hash", "setor_id", "telefone", "ultimo_login_em" FROM "usuario";
DROP TABLE "usuario";
ALTER TABLE "new_usuario" RENAME TO "usuario";
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");
CREATE INDEX "usuario_setor_id_idx" ON "usuario"("setor_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
