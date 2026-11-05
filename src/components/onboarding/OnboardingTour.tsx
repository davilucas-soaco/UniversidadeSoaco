import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import introJs from 'intro.js'
import 'intro.js/introjs.css'
import { onboardingSteps } from '@/data/onboarding'
import { useLayout } from '@/context/LayoutContext'
import { useOnboarding } from '@/context/OnboardingContext'

function isMobileViewport() {
  return window.innerWidth < 1024
}

const BLUR_LAYER_ID = 'soaco-tour-blur'
const BLUR_SIDES = ['top', 'right', 'bottom', 'left'] as const

function mountTourChrome() {
  document.documentElement.classList.add('soaco-touring')
  document.body.classList.add('soaco-touring')
  if (document.getElementById(BLUR_LAYER_ID)) return
  const layer = document.createElement('div')
  layer.id = BLUR_LAYER_ID
  layer.setAttribute('aria-hidden', 'true')
  for (const side of BLUR_SIDES) {
    const panel = document.createElement('div')
    panel.dataset.side = side
    layer.appendChild(panel)
  }
  document.body.appendChild(layer)
}

function unmountTourChrome() {
  document.documentElement.classList.remove('soaco-touring')
  document.body.classList.remove('soaco-touring', 'soaco-tour-aside-focus', 'soaco-tour-header-focus')
  document.getElementById(BLUR_LAYER_ID)?.remove()
}

function syncFocusClass(target: Element | null) {
  document.body.classList.toggle('soaco-tour-aside-focus', Boolean(target?.closest('aside')))
  document.body.classList.toggle('soaco-tour-header-focus', Boolean(target?.closest('header')))
}

function decorateTooltip(current: number, total: number) {
  const tooltip = document.querySelector('.soaco-tour')
  if (!(tooltip instanceof HTMLElement)) return

  let meta = tooltip.querySelector('.soaco-tour-step')
  if (!(meta instanceof HTMLElement)) {
    meta = document.createElement('p')
    meta.className = 'soaco-tour-step'
    const progress = tooltip.querySelector('.introjs-progress')
    if (progress) progress.insertAdjacentElement('afterend', meta)
    else tooltip.querySelector('.introjs-tooltiptext')?.insertAdjacentElement('beforebegin', meta)
  }

  meta.textContent = `Passo ${current} de ${total}`
}

function updateBlurHole() {
  const layer = document.getElementById(BLUR_LAYER_ID)
  if (!(layer instanceof HTMLElement)) return

  const helper = document.querySelector('.introjs-helperLayer')
  const panels = {
    top: layer.querySelector<HTMLElement>('[data-side="top"]'),
    right: layer.querySelector<HTMLElement>('[data-side="right"]'),
    bottom: layer.querySelector<HTMLElement>('[data-side="bottom"]'),
    left: layer.querySelector<HTMLElement>('[data-side="left"]'),
  }

  if (!(helper instanceof HTMLElement) || !panels.top || !panels.right || !panels.bottom || !panels.left) {
    return
  }

  const rect = helper.getBoundingClientRect()
  const top = Math.max(0, rect.top)
  const left = Math.max(0, rect.left)
  const right = Math.max(0, window.innerWidth - rect.right)
  const bottom = Math.max(0, window.innerHeight - rect.bottom)
  const height = Math.max(0, rect.height)

  panels.top.style.inset = `0 0 auto 0`
  panels.top.style.height = `${top}px`

  panels.bottom.style.inset = `auto 0 0 0`
  panels.bottom.style.height = `${bottom}px`

  panels.left.style.inset = `${top}px auto auto 0`
  panels.left.style.width = `${left}px`
  panels.left.style.height = `${height}px`

  panels.right.style.inset = `${top}px 0 auto auto`
  panels.right.style.width = `${right}px`
  panels.right.style.height = `${height}px`
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function scrollingRoot() {
  const panel = document.querySelector('[data-soaco-scroll]')
  if (panel instanceof HTMLElement) return panel
  return (document.scrollingElement ?? document.documentElement) as HTMLElement
}

function headerOffset() {
  const header = document.querySelector('header')
  if (header instanceof HTMLElement) return header.getBoundingClientRect().bottom + 12
  return 88
}

function isFixedTourTarget(target: Element) {
  return Boolean(target.closest('aside') || target.closest('header'))
}

function clampScroll(top: number) {
  const scroller = scrollingRoot()
  const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  return Math.min(max, Math.max(0, top))
}

function applyScrollTop(top: number, smooth: boolean) {
  const y = clampScroll(top)
  const behavior = smooth ? 'smooth' : 'auto'
  scrollingRoot().scrollTo({ top: y, behavior })
}

function waitForScrollEnd(timeout = 700) {
  const scroller = scrollingRoot()
  return new Promise<void>((resolve) => {
    let last = scroller.scrollTop
    let stable = 0
    const started = performance.now()

    const tick = () => {
      const current = scroller.scrollTop
      stable = current === last ? stable + 1 : 0
      last = current
      if (stable >= 4 || performance.now() - started > timeout) {
        resolve()
        return
      }
      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)
  })
}

function desiredScrollForTarget(target: HTMLElement) {
  const scroller = scrollingRoot()
  return clampScroll(scroller.scrollTop + (target.getBoundingClientRect().top - headerOffset()))
}

async function scrollTargetIntoPlace(target: HTMLElement, smooth: boolean) {
  if (isFixedTourTarget(target)) return
  const next = desiredScrollForTarget(target)
  if (Math.abs(scrollingRoot().scrollTop - next) < 3) return
  applyScrollTop(next, smooth)
  await (smooth ? waitForScrollEnd() : wait(32))
}

async function revealTourStep(target: HTMLElement, refresh: () => void) {
  if (isFixedTourTarget(target)) {
    refresh()
    return
  }

  await scrollTargetIntoPlace(target, true)
  refresh()
  await wait(48)

  const tooltip = document.querySelector('.soaco-tour')
  if (!(tooltip instanceof HTMLElement)) return

  const minTop = headerOffset()
  const maxBottom = window.innerHeight - 16
  const targetRect = target.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  const scroller = scrollingRoot()

  if (targetRect.top < minTop) {
    applyScrollTop(scroller.scrollTop + (targetRect.top - minTop), true)
    await waitForScrollEnd()
    refresh()
    return
  }

  const overflowBottom = tooltipRect.bottom - maxBottom
  const roomAboveTarget = targetRect.top - minTop
  if (overflowBottom > 6 && roomAboveTarget > 6) {
    applyScrollTop(scroller.scrollTop + Math.min(overflowBottom, roomAboveTarget), true)
    await waitForScrollEnd()
    refresh()
  }
}

function waitForElement(selector: string, timeout = 2500) {
  return new Promise<Element | null>((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) {
        observer.disconnect()
        window.clearTimeout(timer)
        resolve(found)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    const timer = window.setTimeout(() => {
      observer.disconnect()
      resolve(document.querySelector(selector))
    }, timeout)
  })
}

function isElementVisible(element: Element) {
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

export function OnboardingTour() {
  const { token, complete } = useOnboarding()
  const { openMobile, closeMobile } = useLayout()
  const location = useLocation()
  const navigate = useNavigate()
  const persistOnExit = useRef(true)

  useEffect(() => {
    if (token === 0) return

    if (location.pathname !== '/') {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false
    let tour: ReturnType<typeof introJs.tour> | null = null
    let holeTimer = 0
    persistOnExit.current = true

    const run = async () => {
      if (isMobileViewport()) openMobile()

      await waitForElement('#tour-welcome')
      await new Promise((resolve) => window.setTimeout(resolve, 280))
      if (cancelled) return

      const steps = onboardingSteps
        .filter((step) => {
          const element = document.querySelector(step.element)
          return element ? isElementVisible(element) : false
        })
        .map((step) => ({
          title: step.title,
          intro: step.description,
          element: step.element,
          position: step.position,
          disableInteraction: true,
        }))

      if (steps.length === 0) return

      tour = introJs.tour()
      tour.setOptions({
        steps,
        nextLabel: 'Avançar',
        prevLabel: 'Voltar',
        skipLabel: 'Pular',
        doneLabel: 'Finalizar',
        exitOnOverlayClick: false,
        exitOnEsc: true,
        showProgress: true,
        showBullets: false,
        scrollToElement: false,
        scrollTo: 'off',
        autoPosition: false,
        overlayOpacity: 0.72,
        disableInteraction: true,
        helperElementPadding: 12,
        tooltipClass: 'soaco-tour',
        highlightClass: 'soaco-tour-highlight',
        buttonClass: 'soaco-tour-btn',
      })

      const trackHole = () => {
        window.clearTimeout(holeTimer)
        updateBlurHole()
        const helper = document.querySelector('.introjs-helperLayer')
        const finish = () => {
          updateBlurHole()
          helper?.removeEventListener('transitionend', finish)
        }
        helper?.addEventListener('transitionend', finish)
        holeTimer = window.setTimeout(() => {
          helper?.removeEventListener('transitionend', finish)
          updateBlurHole()
        }, 520)
      }

      const syncTooltip = async (target?: HTMLElement) => {
        decorateTooltip((tour?.getCurrentStep() ?? 0) + 1, steps.length)
        const element = target ?? document.querySelector('.introjs-showElement')
        syncFocusClass(element)
        if (element instanceof HTMLElement) {
          await revealTourStep(element, () => tour?.refresh())
        }
        if (cancelled) return
        trackHole()
      }

      tour.onBeforeChange(async (target) => {
        if (cancelled) return false
        syncFocusClass(target)
        const inSidebar = Boolean(target?.closest('aside'))
        if (isMobileViewport()) {
          if (inSidebar) openMobile()
          else closeMobile()
          await wait(280)
        }
        if (target) await scrollTargetIntoPlace(target, false)
        return true
      })

      tour.onAfterChange((target) => {
        void syncTooltip(target)
      })

      tour.onComplete(() => {
        unmountTourChrome()
        if (persistOnExit.current) complete()
        closeMobile()
      })

      tour.onExit(() => {
        unmountTourChrome()
        if (persistOnExit.current) complete()
        closeMobile()
      })

      mountTourChrome()
      window.addEventListener('resize', updateBlurHole)
      window.addEventListener('scroll', updateBlurHole, true)
      await tour.start()
      await syncTooltip()
    }

    void run()

    return () => {
      cancelled = true
      persistOnExit.current = false
      window.clearTimeout(holeTimer)
      window.removeEventListener('resize', updateBlurHole)
      window.removeEventListener('scroll', updateBlurHole, true)
      unmountTourChrome()
      void tour?.exit(true)
    }
  }, [token, location.pathname, complete, openMobile, closeMobile, navigate])

  return null
}
