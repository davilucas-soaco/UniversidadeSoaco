import { ArrowRight, BadgeCheck, GraduationCap, PartyPopper, Route } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { NextStep } from '@/lib/nextCourse'

type ActionsProps = {
  next: NextStep
  hasCertificate: boolean
  onNext: (courseId: string) => void
  onTrail: (trailId: string) => void
  onCertificate: () => void
  onCourses: () => void
}

/** Próximos passos depois de concluir um curso (usado no painel lateral e na janela de conclusão). */
export function CourseCompletedActions({ next, hasCertificate, onNext, onTrail, onCertificate, onCourses }: ActionsProps) {
  const fromTrail = Boolean(next.trail && next.course && next.trail.courses.some((course) => course.id === next.course?.id))
  return (
    <div className="flex flex-col gap-2">
      {next.course ? (
        <button
          type="button"
          onClick={() => onNext(next.course!.id)}
          className="soaco-press flex items-center gap-3 rounded-xl bg-accent px-4 py-3 text-left text-accent-ink shadow-lg shadow-accent/20 transition hover:bg-accent-strong"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-semibold">
              {fromTrail ? 'Continuar para o próximo curso' : 'Ir para o próximo curso'}
            </span>
            <span className="block truncate text-xs opacity-85">{next.course.title}</span>
          </span>
          <ArrowRight size={18} className="shrink-0" />
        </button>
      ) : null}
      {hasCertificate ? (
        <button
          type="button"
          onClick={onCertificate}
          className="soaco-press flex items-center justify-center gap-2 rounded-xl border border-accent-2/40 bg-accent-2/15 px-4 py-2.5 font-display text-sm font-semibold text-accent-2 transition hover:bg-accent-2/25"
        >
          <BadgeCheck size={17} /> Ver certificado
        </button>
      ) : null}
      {next.trail ? (
        <button
          type="button"
          onClick={() => onTrail(next.trail!.id)}
          className="soaco-press flex items-center justify-center gap-2 rounded-xl border border-line bg-elevated px-4 py-2.5 font-display text-sm font-semibold text-ink transition hover:bg-fill"
        >
          <Route size={17} className="text-accent" /> Ver a trilha
        </button>
      ) : null}
      <button
        type="button"
        onClick={onCourses}
        className="soaco-press flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-display text-xs font-semibold text-muted transition hover:bg-fill hover:text-ink"
      >
        <GraduationCap size={16} /> Voltar aos meus cursos
      </button>
    </div>
  )
}

/** Janela exibida no momento em que o colaborador conclui o curso. */
export function CourseCompletedModal({
  open,
  courseTitle,
  onClose,
  ...actions
}: ActionsProps & { open: boolean; courseTitle: string; onClose: () => void }) {
  const trailDone = actions.next.trail && !actions.next.course ? actions.next.trail : null
  return (
    <Modal open={open} title="Curso concluído!" onClose={onClose} width="max-w-md">
      <div className="flex flex-col items-center gap-2 pb-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <PartyPopper size={28} />
        </span>
        <p className="font-display text-base font-semibold text-ink">{courseTitle}</p>
        <p className="text-sm text-muted">
          {trailDone
            ? `Você concluiu todos os cursos da trilha "${trailDone.title}".`
            : actions.next.course && actions.next.trail
              ? `Mais um passo na trilha "${actions.next.trail.title}". Bora para o próximo?`
              : 'Parabéns! Os pontos já entraram no seu ranking.'}
        </p>
      </div>
      <CourseCompletedActions {...actions} />
    </Modal>
  )
}
