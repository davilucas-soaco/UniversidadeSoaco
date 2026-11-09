const DEV_SECRET = 'dev-universidade-soaco-troque-em-producao'

export const isProduction = process.env.NODE_ENV === 'production'

export const appPort = Number(process.env.APP_PORT || 4000)

export const jwtSecret = (() => {
  const value = process.env.JWT_SECRET?.trim()
  if (value && (!isProduction || value !== DEV_SECRET)) return value
  if (isProduction) {
    throw new Error('Defina JWT_SECRET no backend/.env antes de subir em produção.')
  }
  console.warn('[env] JWT_SECRET não definido; usando chave de desenvolvimento.')
  return DEV_SECRET
})()

export const cookieSecure = process.env.COOKIE_SECURE === 'true'
