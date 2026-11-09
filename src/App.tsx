import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { FIRST_ACCESS_PATH, RequireAuth, RequireRole } from '@/components/auth/RequireAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AdminContentsPage } from '@/pages/AdminContentsPage'
import { CollaboratorsPage } from '@/pages/CollaboratorsPage'
import { CourseCreatePage } from '@/pages/CourseCreatePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { FirstAccessPage } from '@/pages/FirstAccessPage'
import { LessonPage } from '@/pages/LessonPage'
import { LoginPage } from '@/pages/LoginPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import type { UserRole } from '@/types'

const MANAGERS: UserRole[] = ['administrador', 'gestor_conteudo']
const ADMINS: UserRole[] = ['administrador']

function only(roles: UserRole[], element: ReactNode) {
  return <RequireRole roles={roles}>{element}</RequireRole>
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route
        path={FIRST_ACCESS_PATH.slice(1)}
        element={
          <RequireAuth>
            <FirstAccessPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="conteudos" element={<CoursesPage />} />
        <Route path="aula/:courseId" element={<LessonPage />} />
        <Route path="desempenho" element={<PlaceholderPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="ajuda" element={<PlaceholderPage />} />
        <Route path="admin/conteudos" element={only(MANAGERS, <AdminContentsPage />)} />
        <Route path="admin/conteudos/novo" element={only(MANAGERS, <CourseCreatePage />)} />
        <Route path="admin/colaboradores" element={only(ADMINS, <CollaboratorsPage />)} />
        <Route path="admin/indicadores" element={only(MANAGERS, <PlaceholderPage />)} />
        <Route path="admin/configuracoes" element={only(ADMINS, <SettingsPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
