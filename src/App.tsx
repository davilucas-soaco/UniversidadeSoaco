import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="conteudos" element={<PlaceholderPage />} />
        <Route path="desempenho" element={<PlaceholderPage />} />
        <Route path="ranking" element={<PlaceholderPage />} />
        <Route path="perfil" element={<PlaceholderPage />} />
        <Route path="ajuda" element={<PlaceholderPage />} />
        <Route path="configuracoes" element={<PlaceholderPage />} />
        <Route path="admin/conteudos" element={<PlaceholderPage />} />
        <Route path="admin/colaboradores" element={<PlaceholderPage />} />
        <Route path="admin/indicadores" element={<PlaceholderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
