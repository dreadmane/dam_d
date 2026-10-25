import type { DescribedRoll } from './describe.ts'
import { landsAfter } from './plan.ts'

// The roll the tray is showing (the dice roll, approved by the user
// 2026-10-14). One at a time: a new roll replaces the last one in place, even
// one already leaving. The roll is timed from the tap: when its last die
// lands, and so when its hold ends and when a tap settles rather than ends
// it. Where it shows is decided at the tap and never moves: the window on
// top, or the band when no window is open. The clock comes in, so tests can
// pass a stand-in. Pure: app-tray.ts holds the app's one store.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// What the tray draws: the dice; with the dice off in Settings, the roll's
// name and words alone, for a roll the tray is the only print of; or nothing,
// for a roll its window or field already prints.
export type Draw = 'dice' | 'line' | 'none'

export interface Shown<H> extends DescribedRoll {
  id: number
  // The tap, on the store's clock.
  at: number
  // When the last die is at rest: the tap itself under reduced motion, or the
  // moment a tap settled the dice.
  landsAt: number
  settled: boolean
  leaving: boolean
  // The control that rolled: the tray grows from it and shrinks back into it.
  origin: Rect | null
  control: unknown
  host: H
  // What the tray's host speaks to a screen reader after the roll's name, or
  // null: the roll's line, for a roll whose site only fills a field and
  // prints no line of its own, or the site's own words, for a roll whose tray
  // has no line. The tray itself is hidden from them.
  say: string | null
  draw: Draw
}

export interface ShowOptions<H> {
  host: H
  origin: Rect | null
  motion: boolean
  control?: unknown
  // true speaks the roll's line; a string speaks those words instead.
  say?: boolean | string
  draw?: Draw
}

export function createTrayStore<H>({ now }: { now: () => number }) {
  let shown: Shown<H> | null = null
  let ids = 0
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    current: () => shown,
    show(roll: DescribedRoll, { host, origin, motion, control = null, say = false, draw = 'dice' }: ShowOptions<H>): Shown<H> {
      const at = now()
      const spoken = say === true ? roll.line : say || null
      // No dice drawn, none in the air: the roll is at rest at the tap.
      const tumbles = motion && draw === 'dice'
      shown = { ...roll, id: ++ids, at, landsAt: tumbles ? at + landsAfter(roll.dice.length) : at, settled: !tumbles, leaving: false, origin, control, host, say: spoken, draw }
      emit()
      return shown
    },
    // Whether the dice are still in the air.
    tumbling: () => shown !== null && !shown.settled && !shown.leaving && now() < shown.landsAt,
    // A tap during the tumble: every die at rest at once.
    settle() {
      if (!shown || shown.settled) return
      shown = { ...shown, settled: true, landsAt: Math.min(shown.landsAt, now()) }
      emit()
    },
    // Its time is up, or the player moved on: the tray shrinks away.
    end() {
      if (!shown || shown.leaving) return
      shown = { ...shown, leaving: true }
      emit()
    },
    // The tray is gone: only the roll that left, never one shown since.
    clear(id: number) {
      if (shown?.id !== id) return
      shown = null
      emit()
    },
    // Its window closed and took it.
    dropHost(host: H) {
      if (!shown || shown.host !== host) return
      shown = null
      emit()
    },
  }
}

export type TrayStore<H> = ReturnType<typeof createTrayStore<H>>
