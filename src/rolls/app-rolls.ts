import { useContext, useMemo, useSyncExternalStore } from 'react'
import { characterName } from '../components/character-name.ts'
import type { DescribedRoll } from '../dice/describe.ts'
import { NoticeOwner } from '../notify/owner.ts'
import { forwardRoll } from '../roll20/app-roll20.ts'
import type { CharacterEntity } from '../save/record.ts'
import { logged, ofOwner, todays, type RollInput } from './rolls.ts'
import { createRollStore, ROLLS_KEY } from './store.ts'
import { useToday } from '../today.ts'

// The app's one roll log, on this device's localStorage beside the
// notifications, and the hooks the windows record into it and the Rolls menu
// reads it with.

function localStorageOrNull(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const rollStore = createRollStore({
  storage: localStorageOrNull(),
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
})

// Another open copy of the app rolled.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ROLLS_KEY) rollStore.reload()
  })
}

// Records a roll made in play, in the same handler as the roll, for the
// character the band is around (NoticeOwner); a roll made anywhere else is
// not play, and is not logged (the dice roll's call 20). A roll as the tray
// describes it is logged in its words, typed if it came from the table.
// Every roll logged goes on to Roll20 too, where Beyond20 or the clipboard is
// on (app-roll20.ts), still in the roll's handler, as the clipboard needs.
export function useRecordRoll() {
  const owner = useContext(NoticeOwner)
  return (entity: CharacterEntity, roll: DescribedRoll | RollInput, { typed = false }: { typed?: boolean } = {}) => {
    if (!owner) return
    const input = 'line' in roll ? logged(roll, typed) : roll
    rollStore.record(owner, input)
    // Typed from the table, it says so, as the log does.
    const typedAll = input.dice.length > 0 && input.dice.every((d) => d.typed)
    forwardRoll(characterName(entity.name), typedAll ? { ...input, name: `${input.name} · TYPED` } : input)
  }
}

// One character's rolls, newest first, and today's, which turn over at
// midnight.
export function useRolls(owner: string) {
  const all = useSyncExternalStore(rollStore.subscribe, rollStore.all)
  const day = useToday()
  return useMemo(() => ({ list: ofOwner(all, owner), today: todays(all, owner, day) }), [all, owner, day])
}

// A deleted character's rolls, once its Undo has lapsed.
export const forgetRolls = (owner: string) => rollStore.forget(owner)
