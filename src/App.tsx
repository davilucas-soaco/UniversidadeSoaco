import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AdminContentsPage } from '@/pages/AdminContentsPage'
import { CourseCreatePage } from '@/pages/CourseCreatePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { LessonPage } from '@/pages/LessonPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="conteudos" element={<CoursesPage />} />
        <Route path="aula/:courseId" element={<LessonPage />} />
        <Route path="trilhas" element={<PlaceholderPage />} />
        <Route path="desempenho" element={<PlaceholderPage />} />
        <Route path="ranking" element={<PlaceholderPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="ajuda" element={<PlaceholderPage />} />
        <Route path="configuracoes" element={<PlaceholderPage />} />
        <Route path="admin/conteudos" element={<AdminContentsPage />} />
        <Route path="admin/conteudos/novo" element={<CourseCreatePage />} />
        <Route path="admin/colaboradores" element={<PlaceholderPage />} />
        <Route path="admin/indicadores" element={<PlaceholderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
