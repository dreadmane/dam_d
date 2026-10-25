import { useEffect } from 'react'
import { APP_NAME } from './app-name.ts'
import { characterName } from './components/character-name.ts'
import { primaryEntity, type RosterStatus } from './save/use-roster.ts'

// The page's title, which a phone's app switcher and the browser's history
// show (A3): the screen, then the product. A character's screens lead with
// the character's name: "Lia · Print sheet · dam’d".

export { APP_NAME }

export function titleOf(...parts: (string | null | undefined)[]): string {
  return [...parts.filter((p): p is string => !!p && p.trim() !== ''), APP_NAME].join(' · ')
}

export function useTitle(...parts: (string | null | undefined)[]) {
  const title = titleOf(...parts)
  useEffect(() => {
    document.title = title
  }, [title])
}

// A character's screen: its name once it has loaded, then the screen's.
export function useCharacterTitle(status: RosterStatus, screen?: string) {
  useTitle(status.kind === 'ready' ? characterName(primaryEntity(status.roster).name) : null, screen)
}
