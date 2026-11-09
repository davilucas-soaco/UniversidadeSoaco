-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'colaborador',
    "cargo" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "setor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "classe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "classe_membro" (
    "classe_id" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("classe_id", "usuario_id"),
    CONSTRAINT "classe_membro_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "classe_membro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "instrutor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "iniciais" TEXT NOT NULL,
    "bio" TEXT,
    "resumo" TEXT
);

-- CreateTable
CREATE TABLE "curso" (
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
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "curso_instrutor_id_fkey" FOREIGN KEY ("instrutor_id") REFERENCES "instrutor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modulo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    CONSTRAINT "modulo_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modulo_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "duracao_min" INTEGER,
    "paginas" INTEGER,
    "questoes" INTEGER,
    "pontos" INTEGER,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "aula_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "atribuicao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "curso_id" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "setor_id" INTEGER,
    "classe_id" INTEGER,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "prazo" TEXT,
    "atribuido_por_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "atribuicao_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "atribuicao_atribuido_por_id_fkey" FOREIGN KEY ("atribuido_por_id") REFERENCES "usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matricula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "iniciado_em" DATETIME,
    "concluido_em" DATETIME,
    "ultimo_acesso_em" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matricula_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matricula_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aula_progresso" (
    "usuario_id" TEXT NOT NULL,
    "aula_id" TEXT NOT NULL,
    "concluida_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("usuario_id", "aula_id"),
    CONSTRAINT "aula_progresso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aula_progresso_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacao_resultado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "aula_id" TEXT NOT NULL,
    "nota" REAL NOT NULL,
    "respondido_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacao_resultado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacao_resultado_aula_id_fkey" FOREIGN KEY ("aula_id") REFERENCES "aula" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "emitido_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "certificado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "certificado_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pontuacao_evento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT,
    "pontos" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pontuacao_evento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pontuacao_evento_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessao_estudo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT,
    "minutos" INTEGER NOT NULL,
    "iniciado_em" DATETIME NOT NULL,
    CONSTRAINT "sessao_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sessao_estudo_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "atividade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "atividade_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_setor_id_idx" ON "usuario"("setor_id");

-- CreateIndex
CREATE UNIQUE INDEX "setor_nome_key" ON "setor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "classe_nome_key" ON "classe"("nome");

-- CreateIndex
CREATE INDEX "classe_membro_usuario_id_idx" ON "classe_membro"("usuario_id");

-- CreateIndex
CREATE INDEX "curso_instrutor_id_idx" ON "curso"("instrutor_id");

-- CreateIndex
CREATE UNIQUE INDEX "modulo_curso_id_ordem_key" ON "modulo"("curso_id", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "aula_modulo_id_ordem_key" ON "aula"("modulo_id", "ordem");

-- CreateIndex
CREATE INDEX "atribuicao_curso_id_idx" ON "atribuicao"("curso_id");

-- CreateIndex
CREATE INDEX "atribuicao_usuario_id_idx" ON "atribuicao"("usuario_id");

-- CreateIndex
CREATE INDEX "atribuicao_setor_id_idx" ON "atribuicao"("setor_id");

-- CreateIndex
CREATE INDEX "atribuicao_classe_id_idx" ON "atribuicao"("classe_id");

-- CreateIndex
CREATE INDEX "matricula_curso_id_idx" ON "matricula"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "matricula_usuario_id_curso_id_key" ON "matricula"("usuario_id", "curso_id");

-- CreateIndex
CREATE INDEX "aula_progresso_aula_id_idx" ON "aula_progresso"("aula_id");

-- CreateIndex
CREATE INDEX "avaliacao_resultado_usuario_id_idx" ON "avaliacao_resultado"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_codigo_key" ON "certificado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "certificado_usuario_id_curso_id_key" ON "certificado"("usuario_id", "curso_id");

-- CreateIndex
CREATE INDEX "pontuacao_evento_usuario_id_criado_em_idx" ON "pontuacao_evento"("usuario_id", "criado_em");

-- CreateIndex
CREATE INDEX "pontuacao_evento_criado_em_idx" ON "pontuacao_evento"("criado_em");

-- CreateIndex
CREATE INDEX "sessao_estudo_usuario_id_iniciado_em_idx" ON "sessao_estudo"("usuario_id", "iniciado_em");

-- CreateIndex
CREATE INDEX "atividade_usuario_id_criado_em_idx" ON "atividade"("usuario_id", "criado_em");
