import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CertificateModal } from '@/components/certificates/CertificateModal'
import { CourseOpenChoiceModal } from '@/components/certificates/CourseOpenChoiceModal'
import { useSessionUser } from '@/context/AuthContext'
import { certificateFor, type CertificateData } from '@/lib/certificate'
import type { Course } from '@/types'

/**
 * Abre um curso a partir dos cards. Concluído e com certificado emitido, pergunta se o
 * colaborador quer ver o certificado ou ir para o conteúdo; senão, vai direto para a aula.
 */
export function useCourseOpener() {
  const navigate = useNavigate()
  const user = useSessionUser()
  const [choosing, setChoosing] = useState<{ course: Course; certificate: CertificateData } | null>(null)
  const [viewing, setViewing] = useState<CertificateData | null>(null)

  const openCourse = (course: Course) => {
    const certificate = course.status === 'concluido' ? certificateFor(course, user.name) : null
    if (certificate) setChoosing({ course, certificate })
    else navigate(`/aula/${course.id}`)
  }

  const element = (
    <>
      <CourseOpenChoiceModal
        open={choosing !== null}
        courseTitle={choosing?.course.title ?? ''}
        issuedAt={choosing?.certificate.issuedAt ?? null}
        onClose={() => setChoosing(null)}
        onCertificate={() => {
          if (!choosing) return
          setViewing(choosing.certificate)
          setChoosing(null)
        }}
        onContent={() => {
          if (!choosing) return
          navigate(`/aula/${choosing.course.id}`)
          setChoosing(null)
        }}
      />
      <CertificateModal data={viewing} onClose={() => setViewing(null)} />
    </>
  )

  return { openCourse, element }
}
