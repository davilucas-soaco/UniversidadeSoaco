import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaPragmasOk?: boolean }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

/** WAL + busy_timeout reduzem risco de "database disk image is malformed" em SQLite sob carga. */
export async function ensureSqlitePragmas(client: PrismaClient = prisma): Promise<void> {
  if (globalForPrisma.prismaPragmasOk) return
  try {
    await client.$queryRawUnsafe('PRAGMA journal_mode = WAL')
    await client.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
    await client.$queryRawUnsafe('PRAGMA synchronous = NORMAL')
    // Sem isso o SQLite ignora onDelete: Cascade e sobram filhos órfãos.
    await client.$queryRawUnsafe('PRAGMA foreign_keys = ON')
    globalForPrisma.prismaPragmasOk = true
  } catch (error) {
    console.warn('[prisma] Falha ao aplicar PRAGMAs SQLite:', error instanceof Error ? error.message : error)
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
