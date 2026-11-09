/** Apple-style motion helpers (WWDC Designing Fluid Interfaces). */

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  if (overshoot === 0 || dimension === 0) return 0
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

export function project(initialVelocity: number, decelerationRate = 0.998) {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

function springParams(response: number, dampingRatio: number) {
  const stiffness = (2 * Math.PI / response) ** 2
  const damping = (4 * Math.PI * dampingRatio) / response
  return { stiffness, damping }
}

export function animateSpring({
  from,
  to,
  velocity = 0,
  response = 0.35,
  dampingRatio = 1,
  onUpdate,
  onComplete,
}: {
  from: number
  to: number
  velocity?: number
  response?: number
  dampingRatio?: number
  onUpdate: (value: number, velocity: number) => void
  onComplete?: () => void
}) {
  if (prefersReducedMotion()) {
    onUpdate(to, 0)
    onComplete?.()
    return () => {}
  }

  const { stiffness, damping } = springParams(response, dampingRatio)
  let x = from
  let v = velocity
  let last = performance.now()
  let raf = 0
  const restDelta = 0.5
  const restSpeed = 12

  const tick = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000)
    last = now
    const accel = -stiffness * (x - to) - damping * v
    v += accel * dt
    x += v * dt
    onUpdate(x, v)

    if (Math.abs(v) < restSpeed && Math.abs(x - to) < restDelta) {
      onUpdate(to, 0)
      onComplete?.()
      return
    }

    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
