/**
 * Floating Dock (Aceternity) — barra horizontal no desktop e FAB no mobile.
 * `FloatingDockVertical` adapta a mesma física de magnificação para o menu
 * recolhido à esquerda, com rótulos à direita e navegação via React Router.
 */

import { NavLink } from 'react-router-dom'
import { IconLayoutNavbarCollapse } from '@tabler/icons-react'
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type FloatingDockItem = {
  title: string
  icon?: ReactNode
  href: string
  id?: string
  end?: boolean
  onSelect?: () => void
  separator?: boolean
}

const SPRING = { mass: 0.1, stiffness: 150, damping: 12 } as const
const REST = 40
const PEEK = 80
const ICON_REST = 20
const ICON_PEEK = 40
const RANGE = 150

export function FloatingDock({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[]
  desktopClassName?: string
  mobileClassName?: string
}) {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  )
}

export function FloatingDockVertical({
  items,
  className,
}: {
  items: FloatingDockItem[]
  className?: string
}) {
  const mouseY = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(event) => mouseY.set(event.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={cn('soaco-dock mx-auto flex flex-col items-center gap-3 rounded-2xl px-3 py-4', className)}
    >
      {items.map((item) =>
        item.separator ? (
          <span key={item.title} className="soaco-dock-separator" aria-hidden />
        ) : (
          <IconContainer key={item.title} mouse={mouseY} axis="y" {...item} />
        ),
      )}
    </motion.div>
  )
}

function FloatingDockMobile({
  items,
  className,
}: {
  items: FloatingDockItem[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const links = items.filter((item) => !item.separator)

  return (
    <div className={cn('relative block md:hidden', className)}>
      <AnimatePresence>
        {open && (
          <motion.div layoutId="nav" className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2">
            {links.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                transition={{ delay: (links.length - 1 - idx) * 0.05 }}
              >
                <DockLink item={item} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900">
                  <div className="h-4 w-4">{item.icon}</div>
                </DockLink>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  )
}

function FloatingDockDesktop({
  items,
  className,
}: {
  items: FloatingDockItem[]
  className?: string
}) {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'mx-auto hidden h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 md:flex dark:bg-neutral-900',
        className,
      )}
    >
      {items.map((item) =>
        item.separator ? (
          <span key={item.title} className="mb-2 h-8 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden />
        ) : (
          <IconContainer key={item.title} mouse={mouseX} axis="x" {...item} />
        ),
      )}
    </motion.div>
  )
}

function IconContainer({
  mouse,
  axis,
  title,
  icon,
  href,
  id,
  end,
  onSelect,
}: FloatingDockItem & {
  mouse: MotionValue<number>
  axis: 'x' | 'y'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)

  const distance = useTransform(mouse, (value) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 }
    return axis === 'y' ? value - bounds.y - bounds.height / 2 : value - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(distance, [-RANGE, 0, RANGE], [REST, PEEK, REST])
  const heightTransform = useTransform(distance, [-RANGE, 0, RANGE], [REST, PEEK, REST])
  const widthTransformIcon = useTransform(distance, [-RANGE, 0, RANGE], [ICON_REST, ICON_PEEK, ICON_REST])
  const heightTransformIcon = useTransform(distance, [-RANGE, 0, RANGE], [ICON_REST, ICON_PEEK, ICON_REST])

  const width = useSpring(widthTransform, SPRING)
  const height = useSpring(heightTransform, SPRING)
  const widthIcon = useSpring(widthTransformIcon, SPRING)
  const heightIcon = useSpring(heightTransformIcon, SPRING)

  const sizeStyle = reduceMotion ? { width: REST, height: REST } : { width, height }
  const iconStyle = reduceMotion ? { width: ICON_REST, height: ICON_REST } : { width: widthIcon, height: heightIcon }

  return (
    <DockLink
      item={{ title, icon, href, id, end, onSelect }}
      className={({ isActive }) => cn('relative block', isActive && 'is-active')}
    >
      <motion.div
        ref={ref}
        style={sizeStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'soaco-dock-icon relative flex aspect-square items-center justify-center rounded-full',
          axis === 'x' && 'bg-gray-200 dark:bg-neutral-800',
        )}
      >
        <AnimatePresence>
          {hovered ? (
            <motion.div
              initial={
                axis === 'y'
                  ? { opacity: 0, x: -6, y: '-50%' }
                  : { opacity: 0, y: 10, x: '-50%' }
              }
              animate={
                axis === 'y'
                  ? { opacity: 1, x: 0, y: '-50%' }
                  : { opacity: 1, y: 0, x: '-50%' }
              }
              exit={
                axis === 'y'
                  ? { opacity: 0, x: -4, y: '-50%' }
                  : { opacity: 0, y: 2, x: '-50%' }
              }
              className={cn(
                'pointer-events-none absolute w-fit rounded-md border px-2 py-0.5 text-xs whitespace-nowrap',
                axis === 'y'
                  ? 'soaco-dock-label top-1/2 left-full ml-3'
                  : '-top-8 left-1/2 border-gray-200 bg-gray-100 text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white',
              )}
            >
              {title}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.div style={iconStyle} className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-full">
          {icon}
        </motion.div>
      </motion.div>
    </DockLink>
  )
}

function DockLink({
  item,
  className,
  children,
}: {
  item: FloatingDockItem
  className?: string | ((props: { isActive: boolean }) => string)
  children: ReactNode
}) {
  const { href, id, end, onSelect } = item

  if (/^https?:\/\//.test(href)) {
    const resolved = typeof className === 'function' ? className({ isActive: false }) : className
    return (
      <a href={href} id={id} onClick={onSelect} className={resolved} aria-label={item.title}>
        {children}
      </a>
    )
  }

  return (
    <NavLink id={id} to={href} end={end} onClick={onSelect} className={className} aria-label={item.title}>
      {children}
    </NavLink>
  )
}
