import { Router } from 'express'
import { listarCursosDoUsuario } from '../services/cursosUsuario.js'
import { montarDashboard } from '../services/dashboardUsuario.js'
import { listarTrilhasDoUsuario } from '../services/trilhas.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/cursos',
  asyncHandler(async (req, res) => {
    res.json({ courses: await listarCursosDoUsuario(req.user!.sub) })
  }),
)

router.get(
  '/trilhas',
  asyncHandler(async (req, res) => {
    res.json({ trails: await listarTrilhasDoUsuario(req.user!.sub) })
  }),
)

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    res.json({ dashboard: await montarDashboard(req.user!.sub) })
  }),
)

export default router
