import { Link } from './Link.tsx'
import { ScreenHeading } from './ScreenHeading.tsx'
import { TopBar } from './TopBar.tsx'

// A character's screen when its character cannot be read: the reason, and
// the way back to the list. An app installed on a phone has no Back button of
// its own (A3), so no screen may leave the player without one.
export function CharacterUnreadable({ title, message }: { title: string; message: string }) {
  return (
    <main>
      <TopBar>
        <Link to={{ screen: 'roster' }}>All characters</Link>
      </TopBar>
      <ScreenHeading>{title}</ScreenHeading>
      <p role="alert">{message}</p>
    </main>
  )
}
