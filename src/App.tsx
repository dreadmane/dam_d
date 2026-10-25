import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { characterName } from './components/character-name.ts'
import { Link } from './components/Link.tsx'
import { ScreenHeading } from './components/ScreenHeading.tsx'
import { TopBar } from './components/TopBar.tsx'
import { noticeStore, notifySystem } from './notify/app-notices.ts'
import { KICKER } from './notify/lines.ts'
import { forgetRolls } from './rolls/app-rolls.ts'
import { navigate, useRoute, type Route } from './routes.ts'
import { store } from './save/app-store.ts'
import type { RosterRecord } from './save/record.ts'
import { PlayView } from './screens/PlayView.tsx'
import { PrintSheet } from './screens/PrintSheet.tsx'
import { ROSTERS_CHANGED, RosterList } from './screens/RosterList.tsx'
import { SettingsPage } from './screens/SettingsPage.tsx'
import { useTitle } from './title.ts'

// The level ladder and the build open now and then, not on every start, so
// each loads when first opened, as the Dice menu does.
const LevelsScreen = lazy(() => import('./screens/LevelsScreen.tsx').then((m) => ({ default: m.LevelsScreen })))
const BuildScreen = lazy(() => import('./screens/BuildScreen.tsx').then((m) => ({ default: m.BuildScreen })))

// The shell: picks the screen from the URL and holds the one piece of state
// that outlives a screen, the last destructive action while it can still be
// undone (a deleted character, or one an import replaced).

function App() {
  const route = useRoute()
  // The record to put back, and the system flash that carries its Undo.
  const [undoable, setUndoable] = useState<{ previous: RosterRecord; deleted: boolean; noticeId: string } | null>(null)

  // The undo window lasts until the next action rather than a countdown,
  // because a timed control fails people who need longer to read it (WCAG
  // 2.2.1). Leaving the list is an action, so it closes the window. Adjusted
  // during render when the route changes, React's pattern for state that
  // follows an input, rather than in an effect that would render twice.
  // Back to the deleted character's own screens is not leaving: they send the
  // reader straight back to the list (useRoster), where Undo should still be.
  const [lastRoute, setLastRoute] = useState(route)
  if (route !== lastRoute) {
    setLastRoute(route)
    const toDeleted = undoable?.deleted && 'id' in route && route.id === undoable.previous.id
    if (route.screen !== 'roster' && !toDeleted) setUndoable(null)
  }

  // The flash leaves when its undo window closes, filed unread into the list's
  // folder (A1). Compared with the last one shown rather than cleaned up, so
  // the development build's second run of an effect does not file it early.
  const shown = useRef<string | null>(null)
  useEffect(() => {
    const id = undoable?.noticeId ?? null
    if (shown.current && shown.current !== id) noticeStore.file(shown.current)
    shown.current = id
  }, [undoable])

  // A deleted character's rolls go when its undo window closes without Undo
  // (the dice roll's log): they are this device's, never in its file, and a
  // character put back by Undo keeps them. Compared with the last delete, as
  // the flash is, so the development build's second run changes nothing.
  const deletedNow = useRef<{ id: string; restored: boolean } | null>(null)
  useEffect(() => {
    const last = deletedNow.current
    const id = undoable?.deleted ? undoable.previous.id : null
    if (last && last.id !== id && !last.restored) forgetRolls(last.id)
    deletedNow.current = id === null ? null : last?.id === id ? last : { id, restored: false }
  }, [undoable])

  // A system message carrying Undo, which never files itself while the undo
  // is live. Focus goes to Undo when it stands in for a control just lost.
  const offerUndo = (message: string, previous: RosterRecord, deleted = false, focus = deleted) => {
    const noticeId = notifySystem(
      { kicker: deleted ? KICKER.deleted : KICKER.imported, lines: [message] },
      {
        action: {
          label: 'Undo',
          // Puts the earlier record back exactly: over the imported one if an
          // import replaced it, or into the list again if it was deleted.
          run: () =>
            void store.restore(previous).then(() => {
              if (deletedNow.current?.id === previous.id) deletedNow.current.restored = true
              setUndoable(null)
              window.dispatchEvent(new Event(ROSTERS_CHANGED))
            }),
          // Dismissed: the change is kept.
          decline: () => setUndoable(null),
        },
        focus,
      },
    )
    setUndoable({ previous, deleted, noticeId })
  }
  // A character deleted from its section in Settings: to the list, with Undo.
  // Replaced, so Back does not return to Settings for a character that is gone.
  // The list's heading takes focus, as on any new screen; the flash is heard.
  const deleted = (record: RosterRecord) => {
    offerUndo(`Deleted ${characterName(record.name)}.`, record, true, false)
    navigate({ screen: 'roster' }, { replace: true })
  }

  switch (route.screen) {
    case 'home':
      return <Home />
    case 'roster':
      return <RosterList offerUndo={offerUndo} endUndo={() => setUndoable(null)} />
    case 'settings':
      // Keyed by character, so its section starts fresh for another one.
      return <SettingsPage key={route.id ?? ''} characterId={route.id} onDeleted={deleted} />
    case 'character':
      // A new id is a new screen: fresh state and fresh form fields.
      return <PlayView key={route.id} id={route.id} />
    case 'levels':
      return (
        <Suspense fallback={<main className="ladder-screen" aria-busy="true" />}>
          <LevelsScreen key={`${route.id}:${route.up ? 'up' : ''}`} id={route.id} up={route.up ?? false} />
        </Suspense>
      )
    case 'build':
      return (
        <Suspense fallback={<main className="ladder-screen" aria-busy="true" />}>
          <BuildScreen key={route.id} id={route.id} step={route.step} />
        </Suspense>
      )
    case 'print':
      return <PrintSheet key={route.id} id={route.id} />
    case 'not-found':
      return <NotFound path={route.path} />
  }
}

function NotFound({ path }: { path: string }) {
  useTitle('Not found')
  return (
    <main>
      <TopBar />
      <ScreenHeading>Not found</ScreenHeading>
      <p>There is no page at {path}.</p>
      <p>
        <Link to={{ screen: 'roster' }}>All characters</Link>
      </p>
    </main>
  )
}

// The bare site opens the character last saved (Crawler Interface's §3.2,
// recover from a closed tab), or the list when there is none.
function Home() {
  useEffect(() => {
    let current = true
    const go = (route: Route) => current && navigate(route, { replace: true, redirect: true })
    ;(async () => {
      const [latest] = await store.list()
      go(latest ? { screen: 'character', id: latest.id } : { screen: 'roster' })
    })().catch(() => go({ screen: 'roster' }))
    return () => {
      current = false
    }
  }, [])
  return <main aria-busy="true" />
}

export default App
