-- CreateTable
CREATE TABLE "categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- Categorias que eram fixas no formulário de cursos, mais as que já estiverem em uso.
INSERT INTO "categoria" ("nome") VALUES
    ('Institucional'),
    ('Recursos Humanos'),
    ('Segurança do Trabalho'),
    ('Compras'),
    ('Desenvolvimento Profissional'),
    ('Produção'),
    ('Logística'),
    ('Financeiro'),
    ('Tecnologia');

INSERT OR IGNORE INTO "categoria" ("nome")
SELECT DISTINCT "categoria" FROM "curso" WHERE TRIM("categoria") <> '';
