import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Power, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react'
import { UserFormModal } from '@/components/admin/UserFormModal'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useSessionUser } from '@/context/AuthContext'
import { useFeedback } from '@/context/FeedbackContext'
import { adminApi, type UserInput } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import { formatDate, initialsFrom } from '@/lib/format'
import type { AdminUser, ClassGroup, Sector } from '@/types'

type Data = { users: AdminUser[]; sectors: Sector[]; classes: ClassGroup[] }

const roleLabel: Record<AdminUser['role'], string> = {
  administrador: 'Administrador',
  gestor_conteudo: 'Gestor de conteúdo',
  colaborador: 'Colaborador',
}

const NO_SECTOR = '(Sem setor)'
const NO_CLASS = '(Sem classe)'
const NEVER = 'Nunca'

function statusLabel(user: AdminUser) {
  if (!user.active) return 'Inativo'
  return user.mustChangePassword ? 'Aguardando 1º acesso' : 'Ativo'
}

function StatusBadge({ user }: { user: AdminUser }) {
  const tone = !user.active
    ? 'border-line bg-fill text-muted'
    : user.mustChangePassword
      ? 'border-accent/30 bg-accent/10 text-accent'
      : 'border-success/30 bg-success/15 text-success'
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap', tone)}>
      {statusLabel(user)}
    </span>
  )
}

export function CollaboratorsPage() {
  const me = useSessionUser()
  const { showToast } = useFeedback()
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null })
  const [confirm, setConfirm] = useState<{ action: 'delete' | 'deactivate'; user: AdminUser } | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [users, sectors, classes] = await Promise.all([
        adminApi.listUsers(),
        adminApi.listSectors(),
        adminApi.listClasses(),
      ])
      setData({ users, sectors, classes })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os colaboradores.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const replaceUser = useCallback(
    (user: AdminUser) =>
      setData((current) =>
        current
          ? {
              ...current,
              users: current.users.some((item) => item.id === user.id)
                ? current.users.map((item) => (item.id === user.id ? user : item))
                : [...current.users, user],
            }
          : current,
      ),
    [],
  )

  const closeModal = useCallback(() => setModal((current) => ({ ...current, open: false })), [])

  const saveUser = async (input: UserInput) => {
    if (modal.user) {
      replaceUser(await adminApi.updateUser(modal.user.id, input))
      showToast(input.password ? 'Colaborador atualizado e senha redefinida.' : 'Colaborador atualizado.')
    } else {
      replaceUser(await adminApi.createUser({ ...input, password: input.password ?? '' }))
      showToast('Colaborador cadastrado. Ele troca a senha no primeiro acesso.')
    }
    closeModal()
  }

  const setActive = useCallback(
    async (user: AdminUser, active: boolean) => {
      try {
        replaceUser(await adminApi.updateUser(user.id, { active }))
        showToast(active ? `${user.name} foi reativado.` : `${user.name} foi desativado.`)
        setConfirm(null)
      } catch (caught) {
        showToast(caught instanceof Error ? caught.message : 'Não foi possível alterar o status.')
      }
    },
    [replaceUser, showToast],
  )

  const removeUser = async (user: AdminUser) => {
    try {
      await adminApi.deleteUser(user.id)
      setData((current) => (current ? { ...current, users: current.users.filter((item) => item.id !== user.id) } : current))
      showToast(`${user.name} foi excluído.`)
      setConfirm(null)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Não foi possível excluir o colaborador.')
    }
  }

  const columns = useMemo<DataTableColumn<AdminUser>[]>(
    () => [
      {
        key: 'name',
        header: 'Colaborador',
        filterValues: (user) => [user.name],
        render: (user) => (
          <div className="flex items-center gap-3">
            <Avatar name={user.name} initials={initialsFrom(user.name)} size="sm" className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                {user.name}
                {user.id === me.id ? <span className="ml-1.5 text-[11px] font-semibold text-accent">(você)</span> : null}
              </p>
              <p className="truncate text-xs text-muted">
                {user.email}
                {user.role !== 'colaborador' ? ` · ${roleLabel[user.role]}` : ''}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'sector',
        header: 'Setor',
        filterValues: (user) => [user.sectorName ?? NO_SECTOR],
        emptyValues: [NO_SECTOR],
        className: 'text-muted',
        render: (user) => user.sectorName ?? '—',
      },
      {
        key: 'classes',
        header: 'Classes',
        filterValues: (user) => (user.classNames.length > 0 ? user.classNames : [NO_CLASS]),
        emptyValues: [NO_CLASS],
        render: (user) =>
          user.classNames.length === 0 ? (
            <span className="text-muted">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {user.classNames.map((name) => (
                <span key={name} className="rounded-full bg-fill px-2 py-0.5 text-[11px] font-medium text-ink">
                  {name}
                </span>
              ))}
            </div>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        filterValues: (user) => [statusLabel(user)],
        render: (user) => <StatusBadge user={user} />,
      },
      {
        key: 'lastLogin',
        header: 'Último acesso',
        filterValues: (user) => [user.lastLoginAt ? formatDate(user.lastLoginAt) : NEVER],
        sortValue: (user) => (user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0),
        sortLabels: { asc: 'Mais antigo primeiro', desc: 'Mais recente primeiro' },
        optionOrder: 'sort-desc',
        emptyValues: [NEVER],
        className: 'whitespace-nowrap text-muted',
        render: (user) => (user.lastLoginAt ? formatDate(user.lastLoginAt) : NEVER),
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        render: (user) => (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              title="Editar"
              aria-label={`Editar ${user.name}`}
              onClick={() => setModal({ open: true, user })}
              className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-ink"
            >
              <Pencil size={16} />
            </button>
            {user.id !== me.id ? (
              <>
                <button
                  type="button"
                  title={user.active ? 'Desativar acesso' : 'Reativar acesso'}
                  aria-label={user.active ? `Desativar ${user.name}` : `Reativar ${user.name}`}
                  onClick={() => (user.active ? setConfirm({ action: 'deactivate', user }) : void setActive(user, true))}
                  className={cn(
                    'rounded-lg p-2 transition hover:bg-fill',
                    user.active ? 'text-muted hover:text-ink' : 'text-success',
                  )}
                >
                  <Power size={16} />
                </button>
                <button
                  type="button"
                  title="Excluir"
                  aria-label={`Excluir ${user.name}`}
                  onClick={() => setConfirm({ action: 'delete', user })}
                  className="rounded-lg p-2 text-muted transition hover:bg-fill hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [me.id, setActive],
  )

  const total = data?.users.length ?? 0
  const activeCount = data?.users.filter((user) => user.active).length ?? 0
  const pendingCount = data?.users.filter((user) => user.active && user.mustChangePassword).length ?? 0

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col pb-12">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-[11px] font-semibold tracking-widest text-accent uppercase">Governança</p>
          <h1 className="mt-1 font-display text-[32px] leading-10 font-bold tracking-tight text-ink">Colaboradores</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Cadastre os alunos da Universidade e defina o setor e as classes de cada um. Os cursos chegam a eles por essas
            informações.
          </p>
        </div>
        <Button icon={<UserPlus size={16} />} onClick={() => setModal({ open: true, user: null })} disabled={!data}>
          Novo colaborador
        </Button>
      </div>

      {error ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()}>
            Tentar novamente
          </Button>
        </Card>
      ) : !data ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Cadastrados', value: total },
              { label: 'Ativos', value: activeCount },
              { label: 'Aguardando 1º acesso', value: pendingCount },
            ].map((item) => (
              <Card key={item.label} className="p-4">
                <p className="font-display text-[11px] font-semibold tracking-wider text-muted uppercase">{item.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink">{item.value}</p>
              </Card>
            ))}
          </div>

          {total === 0 ? (
            <Card>
              <EmptyState
                icon={<Users size={26} />}
                title="Nenhum colaborador cadastrado"
                description="Cadastre o primeiro aluno informando nome, e-mail de login, senha inicial, setor e classes."
                action={
                  <Button icon={<UserPlus size={16} />} onClick={() => setModal({ open: true, user: null })}>
                    Cadastrar colaborador
                  </Button>
                }
              />
            </Card>
          ) : (
            <DataTable
              rows={data.users}
              columns={columns}
              rowKey={(user) => user.id}
              search={{ placeholder: 'Buscar por nome ou e-mail...', text: (user) => `${user.name} ${user.email}` }}
              initialSort={{ key: 'name', direction: 'asc' }}
              rowClassName={(user) => (user.active ? undefined : 'opacity-60')}
              emptyMessage="Nenhum colaborador corresponde à busca e aos filtros."
              itemLabel={{ singular: 'colaborador', plural: 'colaboradores' }}
              minWidth="860px"
            />
          )}

          <UserFormModal
            open={modal.open}
            user={modal.user}
            sectors={data.sectors}
            classes={data.classes}
            onClose={closeModal}
            onSubmit={saveUser}
          />

          <ConfirmDialog
            open={Boolean(confirm)}
            title={confirm?.action === 'delete' ? 'Excluir colaborador' : 'Desativar colaborador'}
            confirmLabel={confirm?.action === 'delete' ? 'Excluir' : 'Desativar'}
            confirmIcon={confirm?.action === 'delete' ? <Trash2 size={16} /> : <Power size={16} />}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (!confirm) return
              return confirm.action === 'delete' ? removeUser(confirm.user) : setActive(confirm.user, false)
            }}
          >
            {confirm?.action === 'delete' ? (
              <p>
                Tem certeza que deseja excluir <strong className="text-ink">{confirm.user.name}</strong>? O acesso será
                removido junto com todo o histórico de cursos, progresso, certificados e pontos.{' '}
                <strong className="text-ink">Esta ação não pode ser desfeita.</strong> Se quiser apenas bloquear o login,
                use “Desativar”.
              </p>
            ) : confirm ? (
              <p>
                Tem certeza que deseja desativar <strong className="text-ink">{confirm.user.name}</strong>? Ele não
                conseguirá mais entrar na plataforma, mas o histórico fica guardado e você pode reativá-lo quando quiser.
              </p>
            ) : null}
          </ConfirmDialog>
        </>
      )}
    </div>
  )
}
