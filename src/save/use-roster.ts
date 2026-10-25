// Loads one roster, applies changes to its primary character, and saves every
// change at once (Q13). Shared by every screen that edits a character.
//
// The latest record lives in a ref as well as in state: an edit builds on the
// ref, so two edits in one tick never overwrite each other, and the save runs
// from the event handler, never inside a state updater, which React may call
// twice in development.

import { useCallback, useEffect, useRef, useState } from 'react'
import { navigate } from '../routes.ts'
import { changes, store } from './app-store.ts'
import type { CharacterEntity, RosterRecord } from './record.ts'

export type RosterStatus =
  | { kind: 'loading' }
  | { kind: 'ready'; roster: RosterRecord; savedAt: string }
  // Not saved here: deleted, or a stale link. The hook sends the reader to
  // the list, so a screen shows it as still loading.
  | { kind: 'missing' }
  | { kind: 'failed'; message: string }

export function useRoster(id: string) {
  const [status, setStatus] = useState<RosterStatus>({ kind: 'loading' })
  const latest = useRef<RosterRecord | null>(null)

  useEffect(() => {
    let current = true
    const load = () =>
      store
        .load(id)
        .then(
          (loaded): RosterStatus =>
            loaded.ok
              ? { kind: 'ready', roster: loaded.record, savedAt: loaded.record.updatedAt }
              : loaded.reason === 'not-found'
                ? { kind: 'missing' }
                : { kind: 'failed', message: loaded.message },
          (err: unknown): RosterStatus => ({ kind: 'failed', message: `The browser's storage could not be read: ${String(err)}` }),
        )
        .then((next) => {
          if (!current) return
          latest.current = next.kind === 'ready' ? next.roster : null
          setStatus(next)
          // To the list, in place of this entry (user, 2026-09-28): Back after a
          // delete from Settings reaches the gone character's page, and a page
          // saying so is a dead end. A character that cannot be read stays, with
          // its reason: that one exists, and the reader needs to know why.
          if (next.kind === 'missing') navigate({ screen: 'roster' }, { replace: true, redirect: true })
        })
    load()
    // Another open copy of the app wrote this character (a second tab put the
    // examples back, or edited it): reload, so this copy's next edit builds on
    // what is stored, not on what it showed before (changes.ts). A phone can
    // freeze a hidden tab and miss the message, so coming back into view
    // re-reads too.
    const stop = changes.listen((changed) => {
      if (changed === id) load()
    })
    const shown = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', shown)
    return () => {
      current = false
      stop()
      document.removeEventListener('visibilitychange', shown)
    }
  }, [id])

  // Applies a change to the primary character and saves. Returns the record as
  // changed, for a caller that navigates next.
  const update = useCallback((change: (entity: CharacterEntity) => CharacterEntity): RosterRecord | null => {
    const roster = latest.current
    if (!roster) return null
    const next = applyChange(roster, change)
    latest.current = next
    setStatus((s) => ({ kind: 'ready', roster: next, savedAt: s.kind === 'ready' ? s.savedAt : next.updatedAt }))
    store.save(next).then(
      (saved) => {
        // Only the timestamp is taken from the save: a newer edit may already
        // be on screen.
        if (latest.current) latest.current = { ...latest.current, updatedAt: saved.updatedAt }
        setStatus((s) =>
          s.kind === 'ready' ? { ...s, savedAt: saved.updatedAt, roster: { ...s.roster, updatedAt: saved.updatedAt } } : s,
        )
      },
      (err: unknown) => setStatus({ kind: 'failed', message: `This change could not be saved: ${String(err)}` }),
    )
    return next
  }, [])

  return { status, update }
}

// The record after a change to its primary character. Pure, so what every edit
// does to a record is tested without React.
export function applyChange(roster: RosterRecord, change: (entity: CharacterEntity) => CharacterEntity): RosterRecord {
  const entities = roster.entities.map((e) => (e.id === roster.primaryEntityId ? change(e) : e)) as RosterRecord['entities']
  const primary = entities.find((e) => e.id === roster.primaryEntityId) ?? entities[0]
  return { ...roster, name: primary.name, entities }
}

export function primaryEntity(roster: RosterRecord): CharacterEntity {
  return roster.entities.find((e) => e.id === roster.primaryEntityId) ?? roster.entities[0]
}
