import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import { requireAuth } from './middleware/auth.js'
import { requireRole } from './middleware/requireRole.js'
import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import cursoRoutes from './routes/cursoRoutes.js'
import meRoutes from './routes/meRoutes.js'

const app = express()
const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const frontendDist = path.resolve(backendRoot, '..', 'dist')

app.disable('x-powered-by')
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRoutes)
app.use('/api/me', requireAuth, meRoutes)
app.use('/api/cursos', requireAuth, cursoRoutes)
app.use('/api/admin', requireAuth, requireRole('administrador'), adminRoutes)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

// Produção: a mesma porta serve o frontend gerado por `npm run build` na raiz.
if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist, { index: false }))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api]', error instanceof Error ? (error.stack ?? error.message) : error)
  if (!res.headersSent) res.status(500).json({ error: 'Erro interno. Tente novamente.' })
})

export default app
