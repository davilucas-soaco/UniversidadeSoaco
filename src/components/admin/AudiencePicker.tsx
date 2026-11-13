import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Building2, Check, Plus, Search, UserRound, UsersRound, X } from 'lucide-react'
import { coveredByGroup, type AudienceSelection } from '@/lib/audience'
import { cn } from '@/lib/cn'
import type { CourseAudienceOptions } from '@/types'

type GroupKind = 'sector' | 'class'

const MAX_SUGGESTIONS = 8

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''}`.toUpperCase()
}

function normalize(text: string) {
  return text
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Para quem o curso vai: setores ou classes, mais colaboradores avulsos que ainda não estão no curso. */
export function AudiencePicker({
  options,
  value,
  onChange,
}: {
  options: CourseAudienceOptions
  value: AudienceSelection
  onChange: (value: AudienceSelection) => void
}) {
  const [query, setQuery] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [groupQuery, setGroupQuery] = useState('')
  const [kind, setKind] = useState<GroupKind | null>(
    value.classIds.length > 0 ? 'class' : value.sectorIds.length > 0 ? 'sector' : null,
  )

  const groups =
    kind === 'sector'
      ? options.sectors.map((item) => ({
          id: item.id,
          name: item.name,
          description: null,
          countLabel: `${item.usersCount} colaborador${item.usersCount === 1 ? '' : 'es'}`,
        }))
      : kind === 'class'
        ? options.classes.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            countLabel: `${item.membersCount} membro${item.membersCount === 1 ? '' : 's'}`,
          }))
        : []
  const groupTerm = normalize(groupQuery.trim())
  const visibleGroups = groupTerm
    ? groups.filter((group) => normalize(`${group.name} ${group.description ?? ''}`).includes(groupTerm))
    : groups
  const selectedGroupIds = kind === 'sector' ? value.sectorIds : kind === 'class' ? value.classIds : []
  const selectedGroups = groups.filter((group) => selectedGroupIds.includes(group.id))
  const otherKindSelected = kind === 'sector' ? value.classIds.length > 0 : kind === 'class' && value.sectorIds.length > 0

  const setGroups = (ids: number[]) => {
    // Setores e classes não se misturam: marcar um tipo limpa o outro.
    const next: AudienceSelection = {
      sectorIds: kind === 'sector' ? ids : [],
      classIds: kind === 'class' ? ids : [],
      userIds: value.userIds,
    }
    // Quem passou a receber pelo grupo sai da lista de avulsos.
    next.userIds = value.userIds.filter((userId) => {
      const user = options.users.find((item) => item.id === userId)
      return !user || !coveredByGroup(user, next)
    })
    onChange(next)
  }

  const toggleGroup = (groupId: number) =>
    setGroups(
      selectedGroupIds.includes(groupId)
        ? selectedGroupIds.filter((id) => id !== groupId)
        : [...selectedGroupIds, groupId],
    )

  // Sugestões: quem ainda não está no curso (nem pelo grupo, nem como avulso) e combina com o que foi digitado.
  const suggestions = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return []
    return options.users
      .filter(
        (user) =>
          !coveredByGroup(user, value) &&
          !value.userIds.includes(user.id) &&
          (normalize(user.name).includes(term) || normalize(user.email).includes(term)),
      )
      .slice(0, MAX_SUGGESTIONS)
  }, [options.users, query, value])

  const coveredCount = options.users.filter((user) => coveredByGroup(user, value)).length
  const selectedUsers = options.users.filter((user) => value.userIds.includes(user.id))
  const open = suggestionsOpen && query.trim().length > 0
  const activeIndex = Math.min(highlight, Math.max(0, suggestions.length - 1))

  const addUser = (userId: string) => {
    onChange({ ...value, userIds: [...value.userIds, userId] })
    setQuery('')
    setHighlight(0)
  }
  const removeUser = (userId: string) => onChange({ ...value, userIds: value.userIds.filter((id) => id !== userId) })

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setSuggestionsOpen(true)
      setHighlight((activeIndex + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setHighlight((activeIndex - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter') {
      // Enter escolhe a sugestão em vez de enviar o formulário do curso.
      event.preventDefault()
      const user = suggestions[activeIndex]
      if (open && user) addUser(user.id)
    } else if (event.key === 'Escape') {
      setSuggestionsOpen(false)
    } else if (event.key === 'Backspace' && !query && selectedUsers.length > 0) {
      removeUser(selectedUsers[selectedUsers.length - 1].id)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <span className="font-display text-xs font-semibold tracking-wide text-ink">Grupo</span>
        <div role="radiogroup" aria-label="Tipo de grupo" className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { value: 'sector', label: 'Setores', hint: 'Todos os colaboradores dos setores escolhidos', icon: <Building2 size={18} /> },
              { value: 'class', label: 'Classes', hint: 'Todos os membros das classes escolhidas', icon: <UsersRound size={18} /> },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={kind === item.value}
              onClick={() => {
                setKind(item.value)
                setGroupQuery('')
              }}
              className={cn(
                'soaco-press flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                kind === item.value
                  ? 'border-accent bg-accent/10 ring-2 ring-accent/20'
                  : 'border-line bg-surface hover:border-accent/40',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  kind === item.value ? 'bg-accent text-accent-ink' : 'bg-fill text-muted',
                )}
              >
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold text-ink">{item.label}</span>
                <span className="block text-[11px] text-muted">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {kind === null ? (
          <p className="text-[11px] text-muted">Escolha primeiro se o curso vai para setores ou para classes (opcional).</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-muted">
            {kind === 'sector' ? 'Nenhum setor cadastrado' : 'Nenhuma classe cadastrada'}. Cadastre em Configurações.
          </p>
        ) : (
          <>
            {selectedGroups.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedGroups.map((group) => (
                  <span
                    key={group.id}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-0.5 pr-1 pl-2.5 text-xs font-medium text-accent"
                  >
                    {group.name}
                    <button
                      type="button"
                      aria-label={`Remover ${group.name}`}
                      onClick={() => toggleGroup(group.id)}
                      className="rounded-full p-0.5 hover:bg-accent/20"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selectedGroups.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setGroups([])}
                    className="px-1 text-[11px] font-medium text-muted hover:text-ink"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-line">
              <label className="flex items-center gap-2 border-b border-line bg-fill px-4 py-2">
                <Search size={15} className="shrink-0 text-muted" />
                <input
                  value={groupQuery}
                  onChange={(event) => setGroupQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault()
                  }}
                  placeholder={kind === 'sector' ? 'Pesquisar setor…' : 'Pesquisar classe…'}
                  aria-label={kind === 'sector' ? 'Pesquisar setor' : 'Pesquisar classe'}
                  className="w-full bg-transparent py-0.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
                  autoComplete="off"
                />
                {groupQuery ? (
                  <button
                    type="button"
                    aria-label="Limpar pesquisa"
                    onClick={() => setGroupQuery('')}
                    className="rounded-full p-0.5 text-muted hover:bg-surface hover:text-ink"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </label>
              <div role="group" aria-label={kind === 'sector' ? 'Setores' : 'Classes'} className="max-h-64 overflow-y-auto">
                {visibleGroups.length === 0 ? (
                  <p className="px-4 py-4 text-center text-xs text-muted">
                    {kind === 'sector' ? 'Nenhum setor encontrado.' : 'Nenhuma classe encontrada.'}
                  </p>
                ) : null}
                {visibleGroups.map((group) => {
                  const selected = selectedGroupIds.includes(group.id)
                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-line/60 px-4 py-2.5 text-left transition last:border-0',
                        selected ? 'bg-accent/10' : 'hover:bg-fill',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          selected ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface',
                        )}
                      >
                        {selected ? <Check size={11} strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-sm text-ink', selected && 'font-semibold')}>
                          {group.name}
                        </span>
                        {group.description ? (
                          <span className="block truncate text-[11px] text-muted">{group.description}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{group.countLabel}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-[11px] text-muted">
              {otherKindSelected
                ? `O curso já está destinado a ${kind === 'sector' ? 'classes' : 'setores'}. Marcar aqui substitui essa seleção.`
                : `Marque ${kind === 'sector' ? 'um ou mais setores' : 'uma ou mais classes'}. Clique de novo para desmarcar.`}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-wide text-ink">
          <UserRound size={15} className="text-muted" /> Colaboradores avulsos
          {selectedUsers.length > 0 ? (
            <span className="ml-1 rounded-full bg-accent/15 px-1.5 text-[10px] font-bold text-accent">
              {selectedUsers.length}
            </span>
          ) : null}
        </span>
        <div className="relative">
          <div
            className={cn(
              'flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border bg-fill px-3 py-1.5 transition',
              open ? 'border-accent/60 ring-4 ring-accent/10' : 'border-line',
            )}
            onClick={() => inputRef.current?.focus()}
          >
            <Search size={15} className="shrink-0 text-muted" />
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-0.5 pr-1 pl-2.5 text-xs font-medium text-accent"
              >
                {user.name}
                <button
                  type="button"
                  aria-label={`Remover ${user.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    removeUser(user.id)
                  }}
                  className="rounded-full p-0.5 hover:bg-accent/20"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlight(0)
                setSuggestionsOpen(true)
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setSuggestionsOpen(false)}
              onKeyDown={onSearchKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && suggestions[activeIndex] ? `${listId}-${suggestions[activeIndex].id}` : undefined}
              placeholder={selectedUsers.length > 0 ? 'Adicionar mais…' : 'Digite o nome ou e-mail do colaborador…'}
              className="min-w-[180px] flex-1 bg-transparent py-1 text-sm text-ink placeholder:text-muted/60 focus:outline-none"
              autoComplete="off"
            />
          </div>

          {open ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-line bg-elevated py-1 shadow-2xl"
            >
              {suggestions.length === 0 ? (
                <li className="px-3 py-3 text-center text-xs text-muted">Nenhum colaborador disponível com esse nome.</li>
              ) : (
                suggestions.map((user, index) => (
                  <li
                    key={user.id}
                    id={`${listId}-${user.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    // mousedown evita o blur do campo antes do clique.
                    onMouseDown={(event) => {
                      event.preventDefault()
                      addUser(user.id)
                    }}
                    onMouseEnter={() => setHighlight(index)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-2',
                      index === activeIndex ? 'bg-accent/10' : 'hover:bg-fill',
                    )}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill text-[11px] font-semibold text-accent">
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{user.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {user.email}
                        {user.sectorName ? ` · ${user.sectorName}` : ''}
                      </span>
                    </span>
                    {index === activeIndex ? <Plus size={15} className="shrink-0 text-accent" /> : null}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        <p className="text-[11px] text-muted">
          {coveredCount > 0
            ? `Sugere só quem ainda não está no curso: ${coveredCount} ${coveredCount === 1 ? 'colaborador já recebe' : 'colaboradores já recebem'} pelo grupo.`
            : 'Digite para ver sugestões. Enter adiciona a sugestão destacada.'}
        </p>
      </div>
    </div>
  )
}
