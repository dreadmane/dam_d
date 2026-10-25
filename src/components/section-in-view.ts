import { useLayoutEffect, useState } from 'react'

// The section in view, for the Journal's thumb index (ThumbIndex.tsx), whose
// tab for it is marked, and the folded band's running head (Hud.tsx), which
// names it (the sheet concept, direction B's rule, user 2026-10-23).
//
// The open page is the screen between the band and the foot. A section is
// in view once its top has passed a line a third of the way down the open
// page, and of those the one whose top is nearest the line, so a section
// becomes the one in view as its heading reaches the reader's eye, not only
// at the band's edge. At the page's end the last sections may never reach
// the line, so there every section whose top is showing counts, and the
// last one showing is in view. On the open book two pages run side by side:
// where two sections start level, the left-hand one is in view, as a reader
// reads the left page first.

// Where a section is on the screen: its top and its left edge, in px.
export interface SectionBox<T extends string = string> {
  id: T
  top: number
  left: number
}

// The screen round the open page: the band's and the foot's heights, the
// screen's own, and whether the page is scrolled to its end.
export interface OpenPage {
  band: number
  dock: number
  height: number
  atEnd: boolean
}

// Two tops this close (px) start level: the open book's two pages.
const LEVEL = 1

// Which comes first of two sections that have both passed the line: the
// lower top, nearer the line; level, the left-hand one.
const nearer = (a: SectionBox, b: SectionBox) => (Math.abs(a.top - b.top) <= LEVEL ? a.left < b.left : a.top > b.top)

export function sectionInView<T extends string>(sections: readonly SectionBox<T>[], page: OpenPage): T | null {
  if (!sections.length) return null
  const line = page.band + (page.height - page.band - page.dock) / 3
  const foot = page.height - page.dock
  let best: SectionBox<T> | null = null
  for (const s of sections) {
    const passed = s.top <= line || (page.atEnd && s.top < foot)
    if (passed && (!best || nearer(s, best))) best = s
  }
  if (best) return best.id
  // None has reached the line yet (a page shorter than its chrome): the
  // first on the page, the left-hand one where two start level.
  let first = sections[0]
  for (const s of sections) if (Math.abs(s.top - first.top) <= LEVEL ? s.left < first.left : s.top < first.top) first = s
  return first.id
}

// Where a list that scrolls inside its own box (the thumb index on a short
// screen) should scroll to show one of its items with a little room round
// it: null where it is in view already. Positions are within the list's
// scrolled content, as offsetTop gives them.
export function scrollToShow(item: { top: number; height: number }, list: { scrollTop: number; height: number }, room = 4): number | null {
  if (item.top - room < list.scrollTop) return Math.max(0, item.top - room)
  if (item.top + item.height + room > list.scrollTop + list.height) return item.top + item.height + room - list.height
  return null
}

export interface InView<T extends string = string> {
  // The sections the page holds now, of those asked about, in their order: a
  // section that draws nothing (Spells, for a character with none) is not
  // on the page, so it is not here.
  shown: T[]
  // The one in view, or null if there are none.
  current: T | null
}

const same = <T extends string>(a: InView<T>, b: InView<T>) => a.current === b.current && a.shown.length === b.shown.length && a.shown.every((id, i) => id === b.shown[i])

// The section in view as the page scrolls, of the sections given by id, in
// page order. Measured before paint, then again a frame after each scroll
// (passive, at most once a frame), on a resize, and when the band folds or
// the page's own height changes (the rules arriving, a section drawing
// nothing once they have). No ids, no measuring and no listeners.
export function useSectionInView<T extends string>(ids: readonly T[]): InView<T> {
  const key = ids.join(' ')
  const [state, setState] = useState<InView<T>>(() => ({ shown: [...ids], current: ids[0] ?? null }))
  useLayoutEffect(() => {
    const list = (key ? key.split(' ') : []) as T[]
    if (!list.length) return
    let frame = 0
    const measure = () => {
      frame = 0
      const boxes = list.flatMap((id): SectionBox<T>[] => {
        const el = document.getElementById(id)
        if (!el) return []
        const r = el.getBoundingClientRect()
        return [{ id, top: r.top, left: r.left }]
      })
      const height = window.innerHeight
      const page: OpenPage = {
        band: document.querySelector<HTMLElement>('.hud')?.offsetHeight ?? 0,
        dock: document.querySelector<HTMLElement>('.quick-dock')?.offsetHeight ?? 0,
        height,
        atEnd: window.scrollY + height >= document.documentElement.scrollHeight - 2,
      }
      const next = { shown: boxes.map((b) => b.id), current: sectionInView(boxes, page) }
      setState((was) => (same(was, next) ? was : next))
    }
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', soon, { passive: true })
    window.addEventListener('resize', soon)
    const sizes = new ResizeObserver(soon)
    for (const el of document.querySelectorAll('.hud, main.play')) sizes.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', soon)
      window.removeEventListener('resize', soon)
      sizes.disconnect()
    }
  }, [key])
  return key ? state : NONE
}

const NONE: InView<never> = { shown: [], current: null }
