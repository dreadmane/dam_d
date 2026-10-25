// The turn tracker (the Journal's layout B, user 2026-10-20): the Action,
// Bonus Action and Reaction pips and the movement spent, which the player
// marks as they go and New turn clears; and whether the sheet shows the turn
// In combat or Exploring. App state, not a rule: it enforces nothing, and a
// row stays usable with its pip spent. Pure, so each step is tested; the
// store that keeps it is components/turn-store.ts.

export type Mode = 'combat' | 'explore'
export type Pip = 'action' | 'bonus' | 'reaction'

export interface TurnState {
  mode: Mode
  action: boolean
  bonus: boolean
  reaction: boolean
  // Feet moved this turn, in 5-foot steps.
  moved: number
}

export const FRESH: TurnState = { mode: 'combat', action: false, bonus: false, reaction: false, moved: 0 }

// Each character's, on this device, by the roster's id.
export type Turns = Readonly<Record<string, TurnState>>

// How many characters' turns are kept: the most recent, so the stored value
// never grows without end.
const KEEP = 50

// Read leniently: anything unreadable is a fresh turn, field by field.
export function parseTurns(raw: string | null): Turns {
  let value: unknown
  try {
    value = JSON.parse(raw ?? '{}')
  } catch {
    return {}
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const out: Record<string, TurnState> = {}
  for (const [id, v] of Object.entries(value).slice(-KEEP)) {
    if (typeof v !== 'object' || v === null) continue
    const t = v as Partial<Record<keyof TurnState, unknown>>
    out[id] = {
      mode: t.mode === 'explore' ? 'explore' : 'combat',
      action: t.action === true,
      bonus: t.bonus === true,
      reaction: t.reaction === true,
      moved: typeof t.moved === 'number' && Number.isFinite(t.moved) && t.moved > 0 ? Math.round(t.moved / 5) * 5 : 0,
    }
  }
  return out
}

export const turnOf = (turns: Turns, id: string): TurnState => turns[id] ?? FRESH

// One character's turn changed; it moves to the end, as the most recent.
export function withTurn(turns: Turns, id: string, next: TurnState): Turns {
  const { [id]: _was, ...rest } = turns
  const entries = Object.entries({ ...rest, [id]: next })
  return Object.fromEntries(entries.slice(-KEEP))
}

// A pip tapped: spent, or back if it was.
export const togglePip = (t: TurnState, pip: Pip): TurnState => ({ ...t, [pip]: !t[pip] })

// A pip spent by using a row (a roll, a cast, a use). Spending it again
// changes nothing.
export const spendPip = (t: TurnState, pip: Pip): TurnState => (t[pip] ? t : { ...t, [pip]: true })

// New turn: every pip back and no movement spent. The mode stays.
export const newTurn = (t: TurnState): TurnState => ({ ...FRESH, mode: t.mode })

export const setMode = (t: TurnState, mode: Mode): TurnState => ({ ...t, mode })

export const STEP_FEET = 5

// The steps a Speed allows, one per 5 feet: 30 feet is six.
export const movementSteps = (speed: number): number => Math.max(0, Math.floor(speed / STEP_FEET))

// The step at `index` tapped: everything up to it is spent; tapping the last
// step spent gives it back.
export function tapStep(t: TurnState, index: number): TurnState {
  const to = (index + 1) * STEP_FEET
  return { ...t, moved: t.moved === to ? index * STEP_FEET : to }
}

export const feetLeft = (t: TurnState, speed: number): number => Math.max(0, speed - t.moved)
