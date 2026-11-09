import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** Express 4 não captura rejeições de handlers async; repassa o erro para o error handler. */
export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
