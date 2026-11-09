import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'

/** Exige um papel no cadastro atual (não confia só no JWT, que pode estar desatualizado). Use após requireAuth. */
export function requireRole(...papeis: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user!.sub },
        select: { papel: true, ativo: true },
      })
      if (!usuario?.ativo || !papeis.includes(usuario.papel)) {
        res.status(403).json({ error: 'Você não tem permissão para acessar esta área.' })
        return
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}
