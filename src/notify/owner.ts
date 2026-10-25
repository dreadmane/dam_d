import { createContext, useContext } from 'react'
import { notifyCharacter } from './app-notices.ts'
import type { NoticeInput } from './store.ts'

// Whose folder a screen's notifications land in, and whose log its rolls go
// in: the character's roster id, given by the band around a character's
// sheet (Hud.tsx). Null anywhere else, where nothing is notified or logged.
export const NoticeOwner = createContext<string | null>(null)

// Files a notification in the character's folder.
export function useCharacterNotify() {
  const owner = useContext(NoticeOwner)
  return (input: NoticeInput) => {
    if (owner) notifyCharacter(owner, input)
  }
}
