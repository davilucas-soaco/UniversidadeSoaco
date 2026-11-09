import 'dotenv/config'
import { appPort } from './config/env.js'
import { ensureSqlitePragmas, prisma } from './config/prisma.js'
import app from './app.js'

await ensureSqlitePragmas()

const server = app.listen(appPort, () => {
  console.log(`[api] Universidade Só Aço ouvindo em http://localhost:${appPort}`)
})

async function shutdown(signal: string) {
  console.log(`[api] ${signal} recebido, encerrando...`)
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
