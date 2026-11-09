import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { CourseCard } from '@/components/content/CourseCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCatalog } from '@/context/CatalogContext'
import type { Course } from '@/types'

export function AdminContentsPage() {
  const navigate = useNavigate()
  const { authored, getCourse } = useCatalog()

  const courses = useMemo(
    () => authored.map((item) => getCourse(item.id)).filter((course): course is Course => Boolean(course)),
    [authored, getCourse],
  )

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col pb-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Governança</p>
          <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">
            Gestão de conteúdos
          </h1>
          <p className="mt-1 text-sm text-muted">Cadastre e publique os cursos da Universidade.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/admin/conteudos/novo')}>
          Novo curso
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Plus size={26} />}
            title="Nenhum curso cadastrado ainda"
            description="Adicione um vídeo (YouTube, Vimeo ou Loom) ou documentos PDF, Word e Excel."
            action={<Button onClick={() => navigate('/admin/conteudos/novo')}>Cadastrar curso</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-visible px-1 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onOpen={() => navigate(`/aula/${course.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
