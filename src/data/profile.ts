import { currentUser } from '@/data/collaborators'
import type { ProfileAccount } from '@/types'

export const PROFILE_STORAGE_KEY = 'universidade-soaco.profile'

export const defaultProfile: ProfileAccount = {
  name: currentUser.name,
  email: 'davi.lucas@soaco.com.br',
  phone: '(11) 98800-2144',
  location: 'Guarulhos, SP',
  photoUrl: null,
  notifications: {
    courses: true,
    deadlines: true,
    ranking: false,
    digest: true,
  },
  dndEnabled: false,
  dndFrom: '22:00',
  dndTo: '07:00',
  passwordHash: null,
}

/** Datas de início usadas só na tabela do perfil (mock até integrar com o backend). */
export const courseStartedAt: Record<string, string> = {
  'curso-seguranca': '2026-09-18',
  'curso-excel': '2026-10-02',
  'curso-compras': '2026-10-14',
  'curso-processos': '2026-10-28',
  'curso-integracao': '2026-07-08',
  'curso-cultura': '2026-07-22',
  'curso-etica': '2026-08-04',
  'curso-lgpd': '2026-10-30',
  'curso-atendimento': '2026-11-03',
  'curso-comunicacao': '2026-08-18',
  'curso-primeiros-socorros': '2026-08-26',
  'curso-incendio': '2026-11-01',
  'curso-logistica': '2026-11-04',
}
