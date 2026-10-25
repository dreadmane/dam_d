import { ofOwner, parseRolls, withRoll, type Roll, type RollInput } from './rolls.ts'

// The rolls the app holds, a twin of the notifications' store: the stored
// list, read once, written on every roll, and read again when another open
// copy of the app writes it. Storage, the clock and the ids come in, so tests
// can pass stand-ins.

interface KeyValue {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const ROLLS_KEY = 'd-amp-d:rolls'

export function createRollStore({ storage, now, newId }: { storage: KeyValue | null; now: () => Date; newId: () => string }) {
  // Storage can refuse (private browsing, blocked site data): every read and
  // write is guarded, and the log still works for this visit.
  const read = () => {
    try {
      return storage?.getItem(ROLLS_KEY) ?? null
    } catch {
      return null
    }
  }
  const save = () => {
    try {
      storage?.setItem(ROLLS_KEY, JSON.stringify(rolls))
    } catch {
      // Kept for this visit.
    }
  }

  let rolls: Roll[] = parseRolls(read())
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    all: () => rolls,
    // A roll, stamped with the time.
    record(owner: string, input: RollInput): Roll {
      const roll: Roll = { id: newId(), characterId: owner, at: now().toISOString(), ...input }
      rolls = withRoll(rolls, roll)
      save()
      emit()
      return roll
    },
    // A deleted character's rolls, once its Undo has lapsed.
    forget(owner: string) {
      if (ofOwner(rolls, owner).length === 0) return
      rolls = rolls.filter((r) => r.characterId !== owner)
      save()
      emit()
    },
    // Another open copy of the app rolled.
    reload() {
      rolls = parseRolls(read())
      emit()
    },
  }
}

export type RollStore = ReturnType<typeof createRollStore>
