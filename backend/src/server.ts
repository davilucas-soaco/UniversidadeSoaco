import 'dotenv/config'
import { appPort } from './config/env.js'
import { ensureMaster } from './config/ensureMaster.js'
import { logStatusEnvioNotificacoes } from './config/envioNotificacoes.js'
import { ensureSqlitePragmas, prisma } from './config/prisma.js'
import { corrigirCapasVimeoAntigas } from './services/capaCurso.js'
import app from './app.js'

await ensureSqlitePragmas()
await ensureMaster()
logStatusEnvioNotificacoes()
corrigirCapasVimeoAntigas().catch((error) => console.warn('[capas] Não foi possível revisar as capas:', error))

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
