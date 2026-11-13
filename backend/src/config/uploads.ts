import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Arquivos enviados (documentos dos cursos). Na produção, copie esta pasta junto com o dev.db. */
export const uploadsRoot = path.join(backendRoot, 'var', 'uploads')

export function pastaDocumentosCurso(cursoId: string) {
  const pasta = path.join(uploadsRoot, 'cursos', cursoId)
  fs.mkdirSync(pasta, { recursive: true })
  return pasta
}

/** Resolve um caminho relativo salvo no banco, sem permitir sair de uploadsRoot. */
export function caminhoUpload(relativo: string) {
  const absoluto = path.resolve(uploadsRoot, relativo)
  if (!absoluto.startsWith(uploadsRoot + path.sep)) throw new Error('Caminho de arquivo inválido.')
  return absoluto
}
