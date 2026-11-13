import { randomBytes } from 'node:crypto'

/** Código de verificação impresso no certificado (curso ou trilha). */
export function codigoCertificado() {
  return `USA-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`
}
