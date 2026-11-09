import { useRef, useState, type FormEvent } from 'react'
import { BadgeCheck, Camera, Mail, MapPin, Pencil } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useFeedback } from '@/context/FeedbackContext'
import { useProfile } from '@/context/ProfileContext'
import { annualGoal, dashboardStats } from '@/data/dashboard'
import { readProfilePhoto } from '@/lib/photo'
import { profileFieldClass } from './fields'

const rating = (dashboardStats.assessmentAverage / 20).toFixed(1).replace('.', ',')

export function ProfileHero() {
  const { profile, initials, jobTitle, sector, updateProfile, setPhoto } = useProfile()
  const { showToast } = useFeedback()
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
  })

  const openEdit = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
    })
    setEditing(true)
  }

  const saveEdit = (event: FormEvent) => {
    event.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    if (name.length < 3) {
      showToast('Informe o nome completo.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Informe um e-mail válido.')
      return
    }
    updateProfile({
      name,
      email,
      phone: form.phone.trim(),
      location: form.location.trim(),
    })
    setEditing(false)
    showToast('Dados do perfil atualizados.')
  }

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      const photoUrl = await readProfilePhoto(file)
      setPhoto(photoUrl)
      showToast('Foto de perfil atualizada.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível atualizar a foto.')
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-card">
      <div className="soaco-profile-banner relative h-40 overflow-hidden sm:h-48">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <svg className="absolute -top-10 right-8 h-[280px] w-[280px] text-accent-strong" fill="none" viewBox="0 0 400 400" aria-hidden>
            <polygon points="200,30 350,115 350,285 200,370 50,285 50,115" stroke="currentColor" strokeWidth="2.5" />
            <polygon
              points="200,70 310,135 310,265 200,330 90,265 90,135"
              stroke="currentColor"
              strokeDasharray="6 6"
              strokeWidth="1.5"
            />
          </svg>
          <div className="absolute top-6 left-1/4 h-40 w-56 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute right-10 bottom-0 h-32 w-40 rounded-full bg-accent-strong/20 blur-3xl" />
        </div>
      </div>

      <div className="relative px-5 pb-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
            <div className="relative w-max">
              <Avatar
                name={profile.name}
                initials={initials}
                src={profile.photoUrl}
                size="xl"
                className="ring-4 ring-elevated shadow-float"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute right-1 bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink shadow-md transition hover:bg-accent-strong"
                aria-label="Alterar foto de perfil"
              >
                <Camera size={14} />
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  void onPickPhoto(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{profile.name}</h1>
                <BadgeCheck size={18} className="text-accent" />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {jobTitle} · {sector}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} />
                  {profile.location || 'Local não informado'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} />
                  {profile.email}
                </span>
              </div>
            </div>
          </div>

          <Button variant="secondary" icon={<Pencil size={15} />} onClick={openEdit} className="self-start sm:self-auto">
            Editar perfil
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            { value: `${annualGoal.doneHours}h`, label: 'Horas de estudo' },
            { value: String(dashboardStats.completedCourses), label: 'Cursos concluídos' },
            { value: String(dashboardStats.inProgressCourses), label: 'Em andamento' },
            { value: `${rating} / 5,0`, label: 'Aproveitamento' },
          ].map((item) => (
            <div key={item.label} className="bg-elevated px-4 py-4 text-center sm:py-5">
              <p className="font-display text-2xl font-bold tracking-tight text-ink">{item.value}</p>
              <p className="mt-1 text-[11px] font-medium tracking-wide text-muted uppercase">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar perfil" width="max-w-xl">
        <form onSubmit={saveEdit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Nome</span>
            <input
              className={profileFieldClass}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">E-mail</span>
            <input
              type="email"
              className={profileFieldClass}
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Telefone</span>
              <input
                className={profileFieldClass}
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Localidade</span>
              <input
                className={profileFieldClass}
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-muted">Cargo e setor são definidos pelo RH e não podem ser alterados aqui.</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
