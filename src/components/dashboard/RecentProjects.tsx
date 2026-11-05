import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

const projects = [
  {
    id: 'p1',
    name: 'Gestão de Processos',
    category: 'Treinamento Obrigatório',
    progress: 75,
    status: 'em_andamento' as const,
    dueDate: '12 nov',
    team: ['DL', 'MF', 'AS'],
  },
  {
    id: 'p2',
    name: 'Excel e Análise de Dados',
    category: 'Capacitação Técnica',
    progress: 45,
    status: 'em_andamento' as const,
    dueDate: '18 nov',
    team: ['DL', 'CR'],
  },
  {
    id: 'p3',
    name: 'Privacidade e Proteção',
    category: 'Compliance',
    progress: 100,
    status: 'concluido' as const,
    dueDate: '01 nov',
    team: ['DL', 'MF', 'AS', 'JR'],
  },
  {
    id: 'p4',
    name: 'Segurança do Trabalho',
    category: 'NR-12',
    progress: 20,
    status: 'pendente' as const,
    dueDate: '30 nov',
    team: ['DL'],
  },
]

const statusConfig = {
  em_andamento: { label: 'Em andamento', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', barColor: ['#4f7ef7', '#7c5cfc'] },
  concluido: { label: 'Concluído', bg: 'rgba(52,211,153,0.15)', color: '#34d399', barColor: ['#34d399', '#059669'] },
  pendente: { label: 'Pendente', bg: 'rgba(248,113,113,0.15)', color: '#f87171', barColor: ['#ef4444', '#b91c1c'] },
}

export function RecentProjects() {
  const navigate = useNavigate()

  return (
    <div
      className="rounded-[24px]"
      style={{
        background: 'var(--soaco-elevated)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--soaco-ink)' }}>Cursos Recentes</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--soaco-muted)' }}>Acompanhe seu progresso</p>
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowRight size={15} />} onClick={() => navigate('/conteudos')}>
          Ver todos
        </Button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        {/* Cabeçalho */}
        <div
          className="grid grid-cols-[2fr_1fr_1.4fr_1fr] gap-3 px-6 py-2 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--soaco-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Curso</span>
          <span>Status</span>
          <span>Progresso</span>
          <span>Prazo</span>
        </div>

        {/* Linhas */}
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {projects.map((project) => {
            const cfg = statusConfig[project.status]
            return (
              <div
                key={project.id}
                className="group grid grid-cols-[2fr_1fr_1.4fr_1fr] items-center gap-3 px-6 py-3.5 transition-all duration-150 cursor-pointer hover:bg-white/[0.03]"
              >
                {/* Curso */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--soaco-ink)' }}>{project.name}</p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--soaco-muted)' }}>{project.category}</p>
                </div>

                {/* Status pill */}
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                    {cfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          background: `linear-gradient(90deg, ${cfg.barColor[0]}, ${cfg.barColor[1]})`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--soaco-muted)', minWidth: '2.5rem' }}>
                      {project.progress}%
                    </span>
                  </div>
                </div>

                {/* Prazo */}
                <div className="text-xs font-medium" style={{ color: 'var(--soaco-muted)' }}>
                  {project.dueDate}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
