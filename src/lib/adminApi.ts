import { api } from '@/lib/api'
import type {
  AdminCourse,
  AdminCourseInput,
  AdminUser,
  ClassGroup,
  CourseAudienceOptions,
  CourseCategoryItem,
  EmailSettings,
  EmailSettingsInput,
  ExamDetail,
  ExamInput,
  ExamSummary,
  Sector,
} from '@/types'

/** Gestão de cursos (administrador e gestor de conteúdo). */
export const courseAdminApi = {
  list: () => api<{ courses: AdminCourse[] }>('/admin/cursos').then((data) => data.courses),
  get: (id: string) => api<{ course: AdminCourse }>(`/admin/cursos/${id}`).then((data) => data.course),
  options: () => api<CourseAudienceOptions>('/admin/cursos/opcoes'),
  /** Retorna o curso salvo e o id gravado de cada etapa, pela `key` enviada. */
  create: (input: AdminCourseInput) =>
    api<{ course: AdminCourse; stageIds: Record<string, string> }>('/admin/cursos', { method: 'POST', body: input }),
  update: (id: string, input: AdminCourseInput) =>
    api<{ course: AdminCourse; stageIds: Record<string, string> }>(`/admin/cursos/${id}`, { method: 'PUT', body: input }),
  remove: (id: string) => api(`/admin/cursos/${id}`, { method: 'DELETE' }),
  uploadStageDocuments: (id: string, stageId: string, files: File[]) => {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    return api<{ course: AdminCourse }>(`/admin/cursos/${id}/etapas/${stageId}/documentos`, {
      method: 'POST',
      body: form,
    }).then((data) => data.course)
  },
  removeDocument: (id: string, documentId: string) =>
    api<{ course: AdminCourse }>(`/admin/cursos/${id}/documentos/${documentId}`, { method: 'DELETE' }).then(
      (data) => data.course,
    ),
}

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

  listCategories: () =>
    api<{ categories: CourseCategoryItem[] }>('/admin/categorias').then((data) => data.categories),
  createCategory: (name: string) =>
    api<{ category: CourseCategoryItem }>('/admin/categorias', { method: 'POST', body: { name } }).then(
      (data) => data.category,
    ),
  updateCategory: (id: number, name: string) =>
    api<{ category: CourseCategoryItem }>(`/admin/categorias/${id}`, { method: 'PATCH', body: { name } }).then(
      (data) => data.category,
    ),
  deleteCategory: (id: number) => api(`/admin/categorias/${id}`, { method: 'DELETE' }),

  listExams: () => api<{ exams: ExamSummary[] }>('/admin/provas').then((data) => data.exams),
  getExam: (id: string) => api<{ exam: ExamDetail }>(`/admin/provas/${id}`).then((data) => data.exam),
  createExam: (input: ExamInput) =>
    api<{ exam: ExamDetail }>('/admin/provas', { method: 'POST', body: input }).then((data) => data.exam),
  updateExam: (id: string, input: ExamInput) =>
    api<{ exam: ExamDetail }>(`/admin/provas/${id}`, { method: 'PUT', body: input }).then((data) => data.exam),
  deleteExam: (id: string) => api(`/admin/provas/${id}`, { method: 'DELETE' }),

  getEmailSettings: () => api<{ settings: EmailSettings; publicUrl: string }>('/admin/email'),
  saveEmailSettings: (input: EmailSettingsInput) =>
    api<{ settings: EmailSettings }>('/admin/email', { method: 'PUT', body: input }).then((data) => data.settings),
  sendTestEmail: (to?: string) =>
    api<{ sentTo: string; settings: EmailSettings }>('/admin/email/teste', { method: 'POST', body: to ? { to } : {} }),
  /** Abre num navegador comum; a sessão vai pelo cookie. */
  emailPreviewUrl: '/api/admin/email/previa',

  listClasses: () => api<{ classes: ClassGroup[] }>('/admin/classes').then((data) => data.classes),
  createClass: (name: string, description: string | null) =>
    api<{ class: ClassGroup }>('/admin/classes', { method: 'POST', body: { name, description } }).then((data) => data.class),
  updateClass: (id: number, name: string, description: string | null) =>
    api<{ class: ClassGroup }>(`/admin/classes/${id}`, { method: 'PATCH', body: { name, description } }).then(
      (data) => data.class,
    ),
  deleteClass: (id: number) => api(`/admin/classes/${id}`, { method: 'DELETE' }),
}
