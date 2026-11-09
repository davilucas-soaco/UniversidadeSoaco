import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { animateSpring, project, rubberband } from '@/lib/physics'

const HISTORY = 5
const AXIS_LOCK = 10

type Point = { t: number; x: number }

export function useDrawerGesture({
  open,
  onOpenChange,
  width,
  enabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  width: number
  enabled: boolean
}) {
  const closedX = -width
  const xRef = useRef(open ? 0 : closedX)
  const velocityRef = useRef(0)
  const decidedRef = useRef(open)
  const stopSpring = useRef<(() => void) | null>(null)
  const history = useRef<Point[]>([])
  const origin = useRef({ pointer: 0, x: 0, y: 0 })
  const axis = useRef<'x' | 'y' | null>(null)
  const draggingRef = useRef(false)
  const armedRef = useRef(false)

  const [x, setX] = useState(open ? 0 : closedX)
  const [dragging, setDragging] = useState(false)

  const setTranslate = useCallback((value: number, velocity = 0) => {
    xRef.current = value
    velocityRef.current = velocity
    setX(value)
  }, [])

  const clampDrag = useCallback(
    (raw: number) => {
      if (raw > 0) return rubberband(raw, width)
      if (raw < closedX) return closedX + rubberband(raw - closedX, width)
      return raw
    },
    [closedX, width],
  )

  const settle = useCallback(
    (nextOpen: boolean, velocity: number) => {
      decidedRef.current = nextOpen
      stopSpring.current?.()
      const bounced = Math.abs(velocity) > 420
      stopSpring.current = animateSpring({
        from: xRef.current,
        to: nextOpen ? 0 : closedX,
        velocity,
        response: 0.3,
        dampingRatio: bounced ? 0.8 : 1,
        onUpdate: setTranslate,
        onComplete: () => {
          stopSpring.current = null
        },
      })
      if (nextOpen !== open) onOpenChange(nextOpen)
    },
    [closedX, onOpenChange, open, setTranslate],
  )

  useEffect(() => {
    if (!enabled) {
      stopSpring.current?.()
      setTranslate(open ? 0 : closedX)
      decidedRef.current = open
      return
    }
    if (draggingRef.current) return
    if (open === decidedRef.current && Math.abs(xRef.current - (open ? 0 : closedX)) < 0.6) return

    decidedRef.current = open
    stopSpring.current?.()
    stopSpring.current = animateSpring({
      from: xRef.current,
      to: open ? 0 : closedX,
      velocity: velocityRef.current,
      response: 0.3,
      dampingRatio: 1,
      onUpdate: setTranslate,
      onComplete: () => {
        stopSpring.current = null
      },
    })
  }, [closedX, enabled, open, setTranslate])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || !open) return
      if (event.pointerType === 'mouse' && event.button !== 0) return

      stopSpring.current?.()
      stopSpring.current = null
      armedRef.current = true
      axis.current = null
      origin.current = { pointer: event.clientX, x: xRef.current, y: event.clientY }
      history.current = [{ t: performance.now(), x: event.clientX }]
    },
    [enabled, open],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || !armedRef.current) return

      const dx = event.clientX - origin.current.pointer
      const dy = event.clientY - origin.current.y

      if (!axis.current) {
        if (Math.hypot(dx, dy) < AXIS_LOCK) return
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (axis.current === 'y') {
          armedRef.current = false
          history.current = []
          return
        }
        draggingRef.current = true
        setDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      if (axis.current !== 'x') return

      event.preventDefault()
      const now = performance.now()
      history.current.push({ t: now, x: event.clientX })
      if (history.current.length > HISTORY) history.current.shift()
      setTranslate(clampDrag(origin.current.x + dx))
    },
    [clampDrag, enabled, setTranslate],
  )

  const endGesture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!armedRef.current && !draggingRef.current) return

      const wasDragging = draggingRef.current
      armedRef.current = false
      draggingRef.current = false
      setDragging(false)
      origin.current = { pointer: 0, x: 0, y: 0 }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      if (!wasDragging || axis.current !== 'x') {
        axis.current = null
        history.current = []
        return
      }

      axis.current = null
      const samples = history.current
      history.current = []
      const first = samples[0]
      const last = samples[samples.length - 1]
      const dt = Math.max(last.t - first.t, 16)
      const velocity = ((last.x - first.x) / dt) * 1000
      const projected = xRef.current + project(velocity)

      let nextOpen: boolean
      if (Math.abs(velocity) > 180) {
        nextOpen = velocity > 0
      } else {
        nextOpen = projected > closedX * 0.5
      }

      settle(nextOpen, velocity)
    },
    [closedX, settle],
  )

  const progress = enabled ? Math.min(1, Math.max(0, 1 + x / Math.max(width, 1))) : open ? 1 : 0

  return {
    x,
    dragging,
    progress,
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
  }
}
