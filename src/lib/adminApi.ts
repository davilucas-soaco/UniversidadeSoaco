import { api } from '@/lib/api'
import type { AdminUser, ClassGroup, Sector } from '@/types'

export type UserInput = {
  name: string
  email: string
  password?: string
  sectorId: number | null
  classIds: number[]
}

export const adminApi = {
  listUsers: () => api<{ users: AdminUser[] }>('/admin/usuarios').then((data) => data.users),
  createUser: (input: UserInput & { password: string }) =>
    api<{ user: AdminUser }>('/admin/usuarios', { method: 'POST', body: input }).then((data) => data.user),
  updateUser: (id: string, input: Partial<UserInput> & { active?: boolean }) =>
    api<{ user: AdminUser }>(`/admin/usuarios/${id}`, { method: 'PATCH', body: input }).then((data) => data.user),
  deleteUser: (id: string) => api(`/admin/usuarios/${id}`, { method: 'DELETE' }),

  listSectors: () => api<{ sectors: Sector[] }>('/admin/setores').then((data) => data.sectors),
  createSector: (name: string) =>
    api<{ sector: Sector }>('/admin/setores', { method: 'POST', body: { name } }).then((data) => data.sector),
  updateSector: (id: number, name: string) =>
    api<{ sector: Sector }>(`/admin/setores/${id}`, { method: 'PATCH', body: { name } }).then((data) => data.sector),
  deleteSector: (id: number) => api(`/admin/setores/${id}`, { method: 'DELETE' }),

  listClasses: () => api<{ classes: ClassGroup[] }>('/admin/classes').then((data) => data.classes),
  createClass: (name: string, description: string | null) =>
    api<{ class: ClassGroup }>('/admin/classes', { method: 'POST', body: { name, description } }).then((data) => data.class),
  updateClass: (id: number, name: string, description: string | null) =>
    api<{ class: ClassGroup }>(`/admin/classes/${id}`, { method: 'PATCH', body: { name, description } }).then(
      (data) => data.class,
    ),
  deleteClass: (id: number) => api(`/admin/classes/${id}`, { method: 'DELETE' }),
}
