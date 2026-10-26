// The day a screen shows things by: a roll's or a notification's stamp (a
// time today, a date before), the Rolls log's today, an export's dated name.
// Read from a store that turns over at local midnight, never from the clock
// during a render (Oxlint's react(purity), #41), so a screen left open past
// midnight moves to the new day.

import { useMemo, useSyncExternalStore } from 'react'

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

// Local midnight today, in milliseconds: the same all day, so a stable
// snapshot, and new once the day turns.
export const today = () => startOfDay(Date.now())

const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined

// Tells every listener a second after the next local midnight, then waits
// for the one after. setDate keeps it local midnight across a clock change.
function schedule() {
  const next = new Date(today())
  next.setDate(next.getDate() + 1)
  timer = setTimeout(
    () => {
      for (const listener of listeners) listener()
      schedule()
    },
    next.getTime() - Date.now() + 1000,
  )
}

export function subscribeToday(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) schedule()
  return () => {
    listeners.delete(listener)
    if (!listeners.size) clearTimeout(timer)
  }
}

// The day, as a Date at its local midnight.
export function useToday(): Date {
  const day = useSyncExternalStore(subscribeToday, today)
  return useMemo(() => new Date(day), [day])
}
