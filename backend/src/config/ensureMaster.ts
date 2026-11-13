import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import { prisma as defaultClient } from './prisma.js'

/** E-mail do usuário master (vem do .env). */
export function masterEmail() {
  return (process.env.MASTER_EMAIL || 'master@soacoindustrial.com').trim().toLowerCase()
}

/**
 * Garante o usuário master: administrador, ativo e com a senha do .env.
 * Rodado ao subir a API (e pelo seed); o .env é sempre a fonte da senha.
 */
export async function ensureMaster(client: PrismaClient = defaultClient) {
  const email = masterEmail()
  const senha = process.env.MASTER_SENHA?.trim()
  if (!senha) {
    console.warn('[master] Defina MASTER_SENHA no backend/.env para criar o usuário master.')
    return
  }

  const existente = await client.usuario.findUnique({ where: { email } })
  if (!existente) {
    await client.usuario.create({
      data: {
        nome: 'Master',
        email,
        senhaHash: await bcrypt.hash(senha, 10),
        papel: 'administrador',
        cargo: 'Administrador master',
      },
    })
  } else {
    const senhaConfere = await bcrypt.compare(senha, existente.senhaHash)
    await client.usuario.update({
      where: { id: existente.id },
      data: {
        papel: 'administrador',
        ativo: true,
        trocarSenha: false,
        ...(senhaConfere ? {} : { senhaHash: await bcrypt.hash(senha, 10) }),
      },
    })
  }

  if (process.env.NODE_ENV === 'production') {
    console.log(`[master] Usuário master disponível: ${email}`)
  } else {
    console.log(`[master] Acesso master → e-mail: ${email} | senha: ${senha}`)
  }
}
