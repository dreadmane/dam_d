import { loadSettings } from '../settings.ts'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { characterName } from '../components/character-name.ts'
import { DeleteConfirm } from '../components/DeleteConfirm.tsx'
import { useHudDialog } from '../components/dialog.ts'
import { FlashStack } from '../components/Flash.tsx'
import { FolderButton } from '../components/Folder.tsx'
import { Window, WindowHeader } from '../components/Window.tsx'
import { ImportReview, type ImportChoice } from '../components/ImportReview.tsx'
import { Link } from '../components/Link.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { notifySystem } from '../notify/app-notices.ts'
import { KICKER } from '../notify/lines.ts'
import { navigate } from '../routes.ts'
import { store } from '../save/app-store.ts'
import { copyOf } from '../save/copy.ts'
import { seedExamples } from '../save/examples.ts'
import { download, exportFiles } from '../save/export.ts'
import { acceptImport, asCopy, readImport, type ImportOutcome } from '../save/import.ts'
import { newRoster } from '../save/new-roster.ts'
import { requestPersistence } from '../save/persist.ts'
import type { RosterRecord } from '../save/record.ts'
import type { RosterSummary } from '../save/store.ts'
import { useTitle } from '../title.ts'
import { importedLine, ROSTER_EMPTY } from '../voice.ts'
import type { SheetRead } from '../import/sheet-import.ts'
import type { CharacterEntity } from '../save/types.ts'

// The D&D Beyond sheet's report card, with the PDF reader and the rules
// behind it, loads only when a sheet is chosen (spec §7.2).
const SheetReview = lazy(() => import('../import/SheetReview.tsx'))

// Every character saved in this browser, most recently saved first (Crawler
// Interface's §7.1 item 8; the spec §3.3, Roster list), and the way in for a
// character file (§4.2: import is one interaction away, not in a debug menu).
// The one primary action is New character (law 7), which saves a blank
// character at once and opens its level ladder (the spec §3.1 A). Each
// row's ⋯ menu exports, copies, or deletes that character (user, 2026-09-28),
// as its section in Settings does: Delete is inside the menu and last in it,
// never beside the row's link, the frequent action of opening a character
// (law 2).

// Far above any real character, low enough that a wrong file is refused
// before it is read into memory.
const MAX_IMPORT_BYTES = 10 * 1024 * 1024

const nameOf = (r: { name: string }) => characterName(r.name)

const savedAt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// The row's details under the name: the spec §3.3's "Level 7 · Fighter 5 /
// Rogue 2 · Elf" (save/store.ts classLine), or that it has no class yet, and
// when it was saved. Two spans, so the Journal can set the level line on the
// cover's label plate and the saved time under it (index.css, the shelf);
// Classic draws the " · " between them, as one line (index.css .roster-saved).
export function RosterMeta({ line, updatedAt }: { line?: string; updatedAt: string }) {
  return (
    <span className="roster-meta">
      <span className="roster-level">{line ?? 'No class yet'}</span>{' '}
      <span className="roster-saved">Saved {savedAt.format(new Date(updatedAt))}</span>
    </span>
  )
}

// Sent when the saved characters change from outside the list, as an Undo in its
// flash puts one back: the list reads them again.
export const ROSTERS_CHANGED = 'd-amp-d:rosters-changed'

export function RosterList({
  offerUndo,
  endUndo,
}: {
  // Records a destructive action taken here (a delete, or replacing a character
  // on import): a system message carrying Undo (Q13). After a delete from the
  // menu the row, and the ⋯ that had focus, are gone, so focus goes to Undo.
  offerUndo: (message: string, previous: RosterRecord, deleted?: boolean) => void
  // Any other action here ends the chance to undo the last one.
  endUndo: () => void
}) {
  const [rosters, setRosters] = useState<RosterSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [review, setReview] = useState<ImportOutcome | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  // Import's card (the import concept's entry 2): a dam’d file, or a D&D
  // Beyond sheet, both through the one file input.
  const [importing, setImporting] = useState(false)
  const [sheet, setSheet] = useState<Extract<SheetRead, { ok: true }> | null>(null)
  // Bumped to re-read the list after something changes it.
  const [version, setVersion] = useState(0)
  // The row whose ⋯ menu is open.
  const [menuFor, setMenuFor] = useState<RosterSummary | null>(null)
  const [choosing, setChoosing] = useState(false)
  // The list is the product's home, so its title is the product's name.
  useTitle()

  useEffect(() => {
    const reread = () => setVersion((v) => v + 1)
    window.addEventListener(ROSTERS_CHANGED, reread)
    return () => window.removeEventListener(ROSTERS_CHANGED, reread)
  }, [])

  useEffect(() => {
    let current = true
    // The example characters are added first, once per device (examples.ts). A
    // failure to add them never hides the list.
    seedExamples(store)
      .catch(() => 0)
      .then(() => store.list())
      .then(
        (list) => current && setRosters(list),
        (err: unknown) => current && setError(`The browser's storage could not be read: ${String(err)}`),
      )
    return () => {
      current = false
    }
  }, [version])

  // A menu action, run once the menu has closed. The list holds only
  // summaries, so each loads the whole character first.
  async function act(row: RosterSummary, action: (record: RosterRecord) => Promise<void>) {
    setError(null)
    endUndo()
    try {
      const loaded = await store.load(row.id)
      if (!loaded.ok) {
        setError(`${nameOf(row)} could not be read: ${loaded.message}`)
        return
      }
      await action(loaded.record)
    } catch (err) {
      setError(`That did not work for ${nameOf(row)}: ${String(err)}`)
    }
  }

  const exportRecord = async (record: RosterRecord) => download(await exportFiles(record))

  async function copyRecord(record: RosterRecord) {
    const copy = await store.save(copyOf(record))
    notifySystem({ kicker: KICKER.copied, lines: [`Saved ${nameOf(copy)}.`] })
    setVersion((v) => v + 1)
  }

  async function deleteRecord(record: RosterRecord) {
    await store.delete(record.id)
    offerUndo(`Deleted ${nameOf(record)}.`, record, true)
    setVersion((v) => v + 1)
  }

  // The two ways in (the spec §3.1): built from level 1, step by step, or
  // started at any level, copying a sheet the player has.
  async function create(route: 'level-1' | 'any-level') {
    // First, while this is still plainly the tap's doing: a browser that asks
    // its user shows its prompt now. Never awaited; the answer changes nothing.
    void requestPersistence()
    setBusy(true)
    try {
      // Blank, and unnamed until the player names it in the identity panel.
      const blank = newRoster({ name: '' })
      // Milestone levelling, where the table's optional rule says so (C2).
      const mode = loadSettings().rules.milestone ? 'milestone' : 'xp'
      const roster = { ...blank, entities: blank.entities.map((e) => ({ ...e, creation: { ...e.creation, route }, levelling: { ...e.levelling, mode } })) as RosterRecord['entities'] }
      // Saved at once, so it is in the list even if the tab closes now.
      await store.save(roster)
      endUndo()
      navigate(route === 'level-1' ? { screen: 'build', id: roster.id, step: 'class' } : { screen: 'levels', id: roster.id })
    } catch (err) {
      setError(`The new character could not be saved: ${String(err)}`)
      setBusy(false)
    }
  }

  // A file chosen from Import's card, whichever way it was picked: a PDF
  // (its first bytes say so) is a D&D Beyond sheet; anything else is read as
  // a dam’d file.
  async function readFile(file: File) {
    endUndo()
    if (file.size > MAX_IMPORT_BYTES) {
      setReview({ ok: false, message: 'This file is too large to be a character save.', details: [] })
      return
    }
    const head = new TextDecoder('latin1').decode(await file.slice(0, 1024).arrayBuffer())
    if (head.includes('%PDF-')) return readSheet(file)
    setReview(await readImport(await file.text()))
  }

  // A D&D Beyond sheet: read, mapped and shown on its report card; a file
  // that isn't one says why in the same window a refused save does.
  async function readSheet(file: File) {
    setBusy(true)
    try {
      const { readSheetFile } = await import('../import/sheet-import.ts')
      const read = await readSheetFile(new Uint8Array(await file.arrayBuffer()), file.name)
      if (read.ok) setSheet(read)
      else setReview({ ok: false, message: read.message, details: [] })
    } catch (err) {
      setReview({ ok: false, message: `The sheet could not be read: ${String(err)}`, details: [] })
    } finally {
      setBusy(false)
    }
  }

  // Continue on the report card: saved as a new character, started at any
  // level, and opened on its Levels page, where what is owed is marked.
  async function importSheet(entity: CharacterEntity) {
    void requestPersistence()
    setSheet(null)
    try {
      const blank = newRoster({ name: entity.name })
      const saved = await store.save({ ...blank, primaryEntityId: entity.id, entities: [entity] })
      notifySystem({ kicker: KICKER.imported, lines: [importedLine(saved.name)] })
      navigate({ screen: 'levels', id: saved.id })
    } catch (err) {
      setError(`The character could not be imported: ${String(err)}`)
    }
  }

  const conflict = review?.ok ? (rosters?.find((r) => r.id === review.record.id) ?? null) : null

  async function importReviewed(choice: ImportChoice) {
    if (!review?.ok) return
    void requestPersistence()
    const incoming = acceptImport(review.record)
    setReview(null)
    try {
      const previous = choice === 'replace' ? await store.load(incoming.id) : null
      const saved = await store.save(choice === 'copy' ? asCopy(incoming) : incoming)
      if (previous?.ok) offerUndo(`Replaced ${nameOf(previous.record)} with the imported file.`, previous.record)
      else notifySystem({ kicker: KICKER.imported, lines: [importedLine(saved.name)] })
      setVersion((v) => v + 1)
    } catch (err) {
      setError(`The character could not be imported: ${String(err)}`)
    }
  }

  return (
    <>
      {/* The list's row is a band of the HUD's own (A4, the approved mock):
          the folder of system messages, the mark and the product's name, and
          Settings. It stays at the top, so the flashes hanging under it stay
          in view. */}
      <header className="list-band hud-frame">
        <div className="hud-inner">
          <TopBar brand>
            <FolderButton owner={null} ownerName="This device" />
          </TopBar>
          <FlashStack owner={null} />
        </div>
      </header>
      {/* roster-screen: the Journal draws this page as the shelf (index.css). */}
      <main className="roster-screen">
        {/* The list's name (the spec §3.3, Roster list). */}
        <ScreenHeading>Characters</ScreenHeading>

        <div className="actions">
          <button type="button" className="primary" aria-haspopup="dialog" onClick={() => setChoosing(true)} disabled={busy} aria-busy={busy}>
            New character
          </button>
          <button type="button" className="secondary" aria-haspopup="dialog" onClick={() => setImporting(true)}>
            Import
          </button>
          {/* Hidden, because a file input cannot be styled; Import's card
              opens it, its choice setting accept, which narrows the picker
              without forbidding other files. */}
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Cleared so choosing the same file again still fires a change.
              e.target.value = ''
              if (file) void readFile(file)
            }}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        {rosters?.length === 0 && (
          <p className="empty">{ROSTER_EMPTY}</p>
        )}

        {rosters && rosters.length > 0 && (
          <ul className="roster">
            {rosters.map((r) => (
              <li key={r.id}>
                <Link to={{ screen: 'character', id: r.id }}>
                  {/* Decorative: the name beside it says whose it is. */}
                  <span className="portrait" data-size="sm" aria-hidden="true">
                    {r.thumbnail ? <img className="thumbnail" src={r.thumbnail} alt="" /> : <span>{(r.name.trim()[0] ?? '?').toUpperCase()}</span>}
                  </span>
                  <span className="roster-name">{nameOf(r)}</span>
                  <RosterMeta line={r.line} updatedAt={r.updatedAt} />
                </Link>
                <button
                  type="button"
                  className="row-menu-button"
                  aria-haspopup="dialog"
                  aria-label={`${nameOf(r)}: export, copy, or delete`}
                  onClick={() => setMenuFor(r)}
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                    <circle cx="5" cy="12" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <circle cx="19" cy="12" r="2" fill="currentColor" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {choosing && <NewCharacterWindow onPick={(route) => (setChoosing(false), void create(route))} onClose={() => setChoosing(false)} />}
      {menuFor && (
          <RowMenu
            row={menuFor}
            onClose={() => setMenuFor(null)}
            onExport={() => void act(menuFor, exportRecord)}
            onCopy={() => void act(menuFor, copyRecord)}
            onDelete={() => void act(menuFor, deleteRecord)}
          />
        )}

        {importing && (
          <ImportWindow
            onPick={(input) => {
              // Opened inside the tap, which a browser requires of a file
              // picker, then the card closes.
              const picker = fileInput.current
              if (picker) {
                picker.accept = input === 'sheet' ? '.pdf,application/pdf' : '.json,application/json'
                picker.click()
              }
              setImporting(false)
            }}
            onClose={() => setImporting(false)}
          />
        )}

        {review && (
          <ImportReview outcome={review} existing={conflict} onImport={importReviewed} onClose={() => setReview(null)} />
        )}

        {sheet && (
          <Suspense fallback={null}>
            <SheetReview read={sheet} onContinue={(entity) => void importSheet(entity)} onClose={() => setSheet(null)} />
          </Suspense>
        )}
      </main>
    </>
  )
}

// A row's ⋯ menu: a window titled with the character's name, which returns focus
// to the ⋯ that opened it. Delete sits apart at the foot, and asks in this same
// window before it acts. A menu holds nothing unsaved, so a tap outside
// closes it; the question before a delete does not. Each action runs once the
// menu has closed, so a delete's move of focus to Undo comes last.
function RowMenu({ row, onClose, onExport, onCopy, onDelete }: { row: RosterSummary; onClose: () => void; onExport: () => void; onCopy: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const dialog = useHudDialog({ onClose, dismissOnOutside: !confirming })
  return (
    <Window dialog={dialog} className="row-menu" labelledBy="row-menu-heading">
      {confirming ? (
        <DeleteConfirm name={nameOf(row)} headingId="row-menu-heading" onKeep={dialog.close} onDelete={() => dialog.closeThen(onDelete)} />
      ) : (
        <>
          <WindowHeader id="row-menu-heading" title={nameOf(row)} />
          <div className="menu-actions">
            <button type="button" className="secondary" onClick={() => dialog.closeThen(onExport)}>
              Export
            </button>
            <button type="button" className="secondary" onClick={() => dialog.closeThen(onCopy)}>
              Copy
            </button>
          </div>
          <div className="menu-actions menu-danger">
            <button type="button" className="danger" onClick={() => setConfirming(true)}>
              Delete…
            </button>
          </div>
          <div className="dialog-actions">
            <button type="button" className="quiet" onClick={dialog.close}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Window>
  )
}

// Import's two ways in (spec §7.2; the import concept's entry 2, user
// 2026-10-24): a file dam’d saved, or the PDF D&D Beyond exports. Each opens
// the file picker showing its kind of file.
function ImportWindow({ onPick, onClose }: { onPick: (input: 'file' | 'sheet') => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} labelledBy="import-choice-heading">
      <WindowHeader id="import-choice-heading" title="Import" />
      <div className="menu-actions">
        <button type="button" className="secondary route-button" onClick={() => onPick('file')}>
          <b>A dam’d file</b>
          <span className="meta">A character saved from dam’d, on this device or another. Its file ends .dnd.json.</span>
        </button>
        <button type="button" className="secondary route-button" onClick={() => onPick('sheet')}>
          <b>A D&D Beyond sheet</b>
          <span className="meta">The PDF D&D Beyond exports of your character. dam’d brings in what it can and asks you about the rest.</span>
        </button>
      </div>
    </Window>
  )
}

// New character's two ways in (the spec §3.1): A, start at any level, for a
// character already at the table; B, build from level 1, the PHB's steps.
function NewCharacterWindow({ onPick, onClose }: { onPick: (route: 'level-1' | 'any-level') => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} labelledBy="new-heading">
      <WindowHeader id="new-heading" title="New character" />
      <div className="menu-actions">
        <button type="button" className="secondary route-button" onClick={() => onPick('level-1')}>
          <b>Build from level 1</b>
          <span className="meta">Step by step: class, origin, scores, choices, details, gear.</span>
        </button>
        <button type="button" className="secondary route-button" onClick={() => onPick('any-level')}>
          <b>Start at any level</b>
          <span className="meta">Copy a character you already have, level by level.</span>
        </button>
      </div>
    </Window>
  )
}
