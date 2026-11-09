import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { cookieSecure, jwtSecret } from '../config/env.js'

export const SESSION_COOKIE = 'usoaco_token'
const SESSION_HOURS = 12

export interface JwtPayload {
  sub: string
  papel: string
  iat?: number
  exp?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function createToken(payload: { sub: string; papel: string }): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: `${SESSION_HOURS}h` })
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: cookieSecure, path: '/' })
}

/** Exige JWT válido no cookie de sessão (ou header Authorization: Bearer). */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = req.cookies?.[SESSION_COOKIE] ?? (header?.startsWith('Bearer ') ? header.slice(7) : null)

  if (!token) {
    res.status(401).json({ error: 'Não autorizado. Faça login.' })
    return
  }

  try {
    req.user = jwt.verify(token, jwtSecret) as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
  }
}
