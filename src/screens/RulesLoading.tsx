import type { ReactNode } from 'react'
import { ScreenHeading } from '../components/ScreenHeading.tsx'

// Levels' and Build's page while the character or the rules load, or when
// either fails to: the same page as when they're ready (main.ladder-screen),
// so the Journal draws the shelf's page in its cover from the first frame.
export function RulesLoading({ top, title, message }: { top: ReactNode; title: string; message: string | null }) {
  return (
    <main className="ladder-screen" aria-busy={!message}>
      {top}
      <ScreenHeading>{title}</ScreenHeading>
      {message ? <p role="alert">{message}</p> : <p className="meta">Loading the rules…</p>}
    </main>
  )
}
