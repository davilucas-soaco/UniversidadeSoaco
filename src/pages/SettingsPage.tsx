import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, ClipboardCheck, FolderOpen, Mail, RefreshCw, UsersRound } from 'lucide-react'
import { EmailSettingsCard } from '@/components/admin/EmailSettingsCard'
import { ExamsCard } from '@/components/admin/ExamsCard'
import { NamedListCard } from '@/components/admin/NamedListCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import type { ClassGroup, CourseCategoryItem, Sector } from '@/types'

type Section = 'setores' | 'classes' | 'categorias' | 'provas' | 'email'

const sections: { value: Section; label: string; Icon: typeof Building2 }[] = [
  { value: 'setores', label: 'Setores', Icon: Building2 },
  { value: 'classes', label: 'Classes', Icon: UsersRound },
  { value: 'categorias', label: 'Categorias', Icon: FolderOpen },
  { value: 'provas', label: 'Provas', Icon: ClipboardCheck },
  { value: 'email', label: 'E-mail', Icon: Mail },
]

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'pt-BR')

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function isSection(value: string | null): value is Section {
  return sections.some((item) => item.value === value)
}

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('secao')
  const section: Section = isSection(requested) ? requested : 'setores'
  const [sectors, setSectors] = useState<Sector[] | null>(null)
  const [classes, setClasses] = useState<ClassGroup[] | null>(null)
  const [categories, setCategories] = useState<CourseCategoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [loadedSectors, loadedClasses, loadedCategories] = await Promise.all([
        adminApi.listSectors(),
        adminApi.listClasses(),
        adminApi.listCategories(),
      ])
      setSectors(loadedSectors)
      setClasses(loadedClasses)
      setCategories(loadedCategories)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as configurações.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selectSection = (value: Section) => setParams(value === 'setores' ? {} : { secao: value }, { replace: true })

  const counts: Partial<Record<Section, number>> = {
    setores: sectors?.length,
    classes: classes?.length,
    categorias: categories?.length,
  }

  const renderLists = () => {
    if (error) {
      return (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Tentar novamente
          </Button>
        </Card>
      )
    }
    if (!sectors || !classes || !categories) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )
    }

    if (section === 'classes') {
      return (
        <NamedListCard
          icon={<UsersRound size={20} />}
          title="Classes"
          subtitle="Grupos de colaboradores de qualquer setor, como Brigada ou Lideranças."
          noun="classe"
          gender="f"
          withDescription
          countLabel={(count) => plural(count, 'membro', 'membros')}
          deleteWarning={(item) =>
            `${item.count > 0 ? `${plural(item.count, 'membro sairá', 'membros sairão')} da classe e ` : ''}os cursos destinados a esta classe deixarão de ser atribuídos por ela.`
          }
          items={classes.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            count: item.membersCount,
          }))}
          onCreate={async (name, description) => {
            const created = await adminApi.createClass(name, description)
            setClasses((current) => [...(current ?? []), created].sort(byName))
          }}
          onUpdate={async (id, name, description) => {
            const updated = await adminApi.updateClass(id, name, description)
            setClasses((current) => (current ?? []).map((item) => (item.id === id ? updated : item)).sort(byName))
          }}
          onDelete={async (id) => {
            await adminApi.deleteClass(id)
            setClasses((current) => (current ?? []).filter((item) => item.id !== id))
          }}
        />
      )
    }

    if (section === 'categorias') {
      return (
        <NamedListCard
          icon={<FolderOpen size={20} />}
          title="Categorias de curso"
          subtitle="Organizam os cursos no cadastro e nos filtros dos colaboradores."
          noun="categoria"
          gender="f"
          countLabel={(count) => plural(count, 'curso', 'cursos')}
          deleteWarning={(item) =>
            item.count > 0
              ? `Ela está em ${plural(item.count, 'curso', 'cursos')} e só pode ser excluída depois que ${item.count === 1 ? 'ele mudar' : 'eles mudarem'} de categoria.`
              : 'Ela deixa de aparecer no cadastro de cursos.'
          }
          items={categories.map((item) => ({ id: item.id, name: item.name, count: item.coursesCount }))}
          onCreate={async (name) => {
            const created = await adminApi.createCategory(name)
            setCategories((current) => [...(current ?? []), created].sort(byName))
          }}
          onUpdate={async (id, name) => {
            const updated = await adminApi.updateCategory(id, name)
            setCategories((current) => (current ?? []).map((item) => (item.id === id ? updated : item)).sort(byName))
          }}
          onDelete={async (id) => {
            await adminApi.deleteCategory(id)
            setCategories((current) => (current ?? []).filter((item) => item.id !== id))
          }}
        />
      )
    }

    return (
      <NamedListCard
        icon={<Building2 size={20} />}
        title="Setores"
        subtitle="Áreas da empresa. Cada colaborador pertence a um setor."
        noun="setor"
        gender="m"
        countLabel={(count) => plural(count, 'colaborador', 'colaboradores')}
        deleteWarning={(item) =>
          `${item.count > 0 ? `${plural(item.count, 'colaborador ficará', 'colaboradores ficarão')} sem setor e ` : ''}os cursos destinados a este setor deixarão de ser atribuídos por ele.`
        }
        items={sectors.map((sector) => ({ id: sector.id, name: sector.name, count: sector.usersCount }))}
        onCreate={async (name) => {
          const sector = await adminApi.createSector(name)
          setSectors((current) => [...(current ?? []), sector].sort(byName))
        }}
        onUpdate={async (id, name) => {
          const sector = await adminApi.updateSector(id, name)
          setSectors((current) => (current ?? []).map((item) => (item.id === id ? sector : item)).sort(byName))
        }}
        onDelete={async (id) => {
          await adminApi.deleteSector(id)
          setSectors((current) => (current ?? []).filter((item) => item.id !== id))
        }}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col pb-12">
      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Governança</p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-muted">Cadastros usados nos cursos, nas provas e no envio de avisos.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          data-tour="settings-nav"
          aria-label="Seções das configurações"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-elevated p-1.5 shadow-card [scrollbar-width:none] lg:sticky lg:top-24 lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {sections.map((item) => {
            const active = item.value === section
            const count = counts[item.value]
            return (
              <button
                key={item.value}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => selectSection(item.value)}
                className={cn(
                  'soaco-press flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-sm whitespace-nowrap transition-colors',
                  active ? 'bg-accent/12 font-semibold text-accent' : 'text-muted hover:bg-fill hover:text-ink',
                )}
              >
                <item.Icon size={17} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {typeof count === 'number' ? (
                  <span className={cn('text-xs tabular-nums', active ? 'text-accent/80' : 'text-muted/70')}>{count}</span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div data-tour="settings-panel" className="min-w-0">
          {section === 'provas' ? <ExamsCard /> : section === 'email' ? <EmailSettingsCard /> : renderLists()}
        </div>
      </div>
    </div>
  )
}
