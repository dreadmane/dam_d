import { motionAllowed } from '../motion.ts'

// Finding a section of the play view (A16): every section on the sheet
// carries its id, its own name (`data-menu`) and any count (`data-menu-count`),
// so the menu lists what the page holds, in its order, without a
// second list to keep in step. Going to one scrolls it clear of the band and
// moves focus to its heading, so a keyboard or screen-reader user lands where
// the eye does. A menu (user, 2026-10-13) is not on the sheet: the Character
// Menu opens it as a window over the page instead.

export interface PageSection {
  id: string
  name: string
  count?: string
}

// What the sheet holds now: a section that is not drawn (no Spells, nothing
// to track) is not listed.
export function pageSections(root: ParentNode = document): PageSection[] {
  return [...root.querySelectorAll<HTMLElement>('[data-menu]')].flatMap((el) => (el.id && el.dataset.menu ? [{ id: el.id, name: el.dataset.menu, count: el.dataset.menuCount }] : []))
}

// Where to scroll so the section's top sits just under the band. Past the
// band's own height the band is collapsed to one line; above it the band is
// open, so a section near the top sits under the open band instead.
export function scrollTargetFor(sectionTop: number, band: { open: number; collapsed: number }, gap: number): number {
  const underCollapsed = sectionTop - band.collapsed - gap
  return underCollapsed >= band.open ? underCollapsed : Math.max(0, sectionTop - band.open - gap)
}

export function goToSection(id: string) {
  // A frame later, once whatever opened it (a pin, a closing window) has
  // settled the page.
  requestAnimationFrame(() => {
    const el = document.getElementById(id)
    if (!el) return
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const open = document.querySelector<HTMLElement>('.hud-spacer')?.offsetHeight ?? 0
    // The collapsed band: a touch target, its padding and its rule (index.css,
    // .hud[data-collapsed] .hud-inner).
    const collapsed = rem * 3.25 + 1
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: scrollTargetFor(top, { open, collapsed }, rem * 0.75), behavior: motionAllowed() ? 'smooth' : 'auto' })
    el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  })
}

// Opening a menu's window: the play view holds which one is open, and the
// menu, in the band, asks for one by its id.
export const OPEN_MENU = 'd-amp-d:open-menu'

export function openMenu(id: string) {
  window.dispatchEvent(new CustomEvent<string>(OPEN_MENU, { detail: id }))
}

// A menu's window adds a history entry, so the phone's Back closes it
// (MenuWindow.tsx). The entry carries this mark on the state the page
// already has.
export const MENU_STATE = 'characterMenu'

export const menuIn = (state: unknown): unknown => (state && typeof state === 'object' ? (state as Record<string, unknown>)[MENU_STATE] : undefined)

// A reload keeps the history entry a menu added, but not its window, so the
// play view clears the mark as it opens.
export function clearMenuEntry() {
  if (menuIn(history.state) !== undefined) history.replaceState({ ...(history.state as object), [MENU_STATE]: undefined }, '')
}
