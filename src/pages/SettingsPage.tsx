import { useCallback, useEffect, useState } from 'react'
import { Building2, RefreshCw, UsersRound } from 'lucide-react'
import { NamedListCard } from '@/components/admin/NamedListCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { adminApi } from '@/lib/adminApi'
import type { ClassGroup, Sector } from '@/types'

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, 'pt-BR')

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export function SettingsPage() {
  const [sectors, setSectors] = useState<Sector[] | null>(null)
  const [classes, setClasses] = useState<ClassGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [loadedSectors, loadedClasses] = await Promise.all([adminApi.listSectors(), adminApi.listClasses()])
      setSectors(loadedSectors)
      setClasses(loadedClasses)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as configurações.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col pb-12">
      <div className="mb-8">
        <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Governança</p>
        <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">Configurações</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          Cadastre os setores e as classes da Universidade. Eles são usados no cadastro dos colaboradores e na atribuição
          de cursos: um curso destinado a um setor ou a uma classe aparece para todos que fazem parte dele.
        </p>
      </div>

      {error ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Tentar novamente
          </Button>
        </Card>
      ) : !sectors || !classes ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

          <NamedListCard
            icon={<UsersRound size={20} />}
            title="Classes"
            subtitle="Grupos de colaboradores de qualquer setor (ex.: Brigada, Lideranças, Novos colaboradores)."
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
        </div>
      )}
    </div>
  )
}
