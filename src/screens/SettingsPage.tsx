import { useEffect, useState } from 'react'
import { APP_NAME } from '../app-name.ts'
import { describeBuild, loadBuildInfo } from '../build-info.ts'
import { DeleteConfirmWindow } from '../components/DeleteConfirm.tsx'
import { BookFileSection } from '../components/BookFileSection.tsx'
import { DiceSettingsFields } from '../components/DiceSettings.tsx'
import { Roll20SettingsFields } from '../components/Roll20Settings.tsx'
import { Link } from '../components/Link.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { rulesAttribution, rulesVersion } from '../rules/data.ts'
import { notifySystem } from '../notify/app-notices.ts'
import { KICKER } from '../notify/lines.ts'
import { hasNavigatedInApp, navigate } from '../routes.ts'
import { store } from '../save/app-store.ts'
import { copyOf } from '../save/copy.ts'
import { hasExamples, restoreExamples } from '../save/examples.ts'
import { download, exportBasename, exportFiles, EXTENSION } from '../save/export.ts'
import { persistenceState, requestPersistence, type PersistState } from '../save/persist.ts'
import type { RosterRecord } from '../save/record.ts'
import { primaryEntity, useRoster } from '../save/use-roster.ts'
import { applySettings, HEADING_FONTS, loadSettings, saveSettings, type Look, type Motion, type Settings, type Theme } from '../settings.ts'
import { characterName } from '../components/character-name.ts'
import { useTitle } from '../title.ts'

// The few switches (spec §3.3, Settings): the theme, the look, motion, and the heading
// font, the dice, Roll20, notifications, and whether the browser keeps saved
// characters. Every change applies at once and is kept on this device.
// Opened from a character's screens, the page ends with that character's own
// section: export, print, copy, delete. The spec's Optional rules arrive
// with the rules they switch, in M1.

const THEMES: { id: Theme; label: string; note: string }[] = [
  { id: 'system', label: 'System', note: "Follows this device's light or dark setting" },
  { id: 'dark', label: 'Dark', note: 'The designed theme' },
  { id: 'light', label: 'Light', note: 'Derived from the dark one' },
]

const LOOKS: { id: Look; label: string; note: string }[] = [
  { id: 'journal', label: "Adventurer's Journal", note: 'A field book: your turn on top, in combat or exploring' },
  { id: 'classic', label: 'Classic', note: 'The sheet in its sections, the quick bar first' },
]

const MOTIONS: { id: Motion; label: string; note: string }[] = [
  { id: 'system', label: 'System', note: "Follows this device's reduce-motion setting" },
  { id: 'reduce', label: 'Reduce', note: 'No animation, whatever the device says' },
  { id: 'full', label: 'Full', note: 'Keep animation, whatever the device says' },
]

export function SettingsPage({
  characterId,
  onDeleted,
}: {
  characterId?: string
  onDeleted: (record: RosterRecord) => void
}) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  useTitle('Settings')

  function change(next: Settings) {
    setSettings(next)
    saveSettings(next)
    applySettings(next)
  }

  return (
    // settings-screen: the Journal draws this page as the book's inside
    // cover, a bookplate (index.css, the shelf).
    <main className="settings-screen">
      <TopBar characterId={characterId}>
        {/* Back to wherever Settings was opened from; opened directly, the
            character it names, or the list of characters. */}
        <button
          type="button"
          className="text-link"
          onClick={() =>
            hasNavigatedInApp()
              ? history.back()
              : navigate(characterId ? { screen: 'character', id: characterId } : { screen: 'roster' })
          }
        >
          Back
        </button>
      </TopBar>
      <ScreenHeading>Settings</ScreenHeading>
      <p className="meta">Kept on this device only; they are not part of your character files.</p>

      <fieldset className="choice-cards">
        <legend>Theme</legend>
        {THEMES.map((t) => (
          <label key={t.id}>
            <input type="radio" name="theme" checked={settings.theme === t.id} onChange={() => change({ ...settings, theme: t.id })} />
            <span>
              <strong>{t.label}</strong>
              <span>{t.note}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-cards">
        <legend>Look</legend>
        {LOOKS.map((l) => (
          <label key={l.id}>
            <input type="radio" name="look" checked={settings.look === l.id} onChange={() => change({ ...settings, look: l.id })} />
            <span>
              <strong>{l.label}</strong>
              <span>{l.note}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-cards">
        <legend>Motion</legend>
        {MOTIONS.map((m) => (
          <label key={m.id}>
            <input type="radio" name="motion" checked={settings.motion === m.id} onChange={() => change({ ...settings, motion: m.id })} />
            <span>
              <strong>{m.label}</strong>
              <span>{m.note}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-cards">
        <legend>Type style</legend>
        {HEADING_FONTS.map((f, i) => (
          <label key={f.id}>
            <input
              type="radio"
              name="heading-font"
              checked={settings.headingFont === f.id}
              onChange={() => change({ ...settings, headingFont: f.id })}
            />
            <span>
              {/* Each option is shown in its own face, and its own case. */}
              <strong
                className="font-sample"
                style={{ fontFamily: `var(${f.familyVar})`, fontWeight: `var(${f.weightVar})`, textTransform: f.caps ? 'uppercase' : 'none' }}
              >
                {APP_NAME}
              </strong>
              <span>
                {f.label}
                {i === 0 && ' (default)'}: {f.face} headings
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <DiceSettingsFields dice={settings.dice} onChange={(dice) => change({ ...settings, dice })} />

      <Roll20SettingsFields roll20={settings.roll20} onChange={(roll20) => change({ ...settings, roll20 })} />

      <fieldset className="choice-cards">
        <legend>Optional rules</legend>
        <label>
          <input type="checkbox" checked={settings.rules.rolledHp} onChange={(e) => change({ ...settings, rules: { ...settings.rules, rolledHp: e.target.checked } })} />
          <span>
            <strong>Roll hit points when levelling up</strong>
            <span>Level up starts on rolling the Hit Die rather than the fixed value. Fixed is still there to choose.</span>
          </span>
        </label>
        <label>
          <input type="checkbox" checked={settings.rules.milestone} onChange={(e) => change({ ...settings, rules: { ...settings.rules, milestone: e.target.checked } })} />
          <span>
            <strong>Milestone levelling for new characters</strong>
            <span>A new character levels when the table says, with no XP to track. Each character can still change it on its Levels page.</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="choice-cards">
        <legend>Notifications</legend>
        <label>
          <input type="checkbox" checked={settings.flashes} onChange={(e) => change({ ...settings, flashes: e.target.checked })} />
          <span>
            <strong>Show notifications as they arrive</strong>
            <span>
              Each slides in under the top band for a few seconds, then goes to the folder. Turn this off and they go
              straight to the folder, which keeps every one either way. A notification with an Undo still shows.
            </span>
          </span>
        </label>
      </fieldset>

      <BookFileSection />

      <StorageSection />

      {hasExamples && <ExamplesSection />}

      <AboutSection />

      {characterId && <CharacterSection id={characterId} onDeleted={onDeleted} />}
    </main>
  )
}

// The character Settings was opened from, and the things done to the whole
// character rather than within it (user, 2026-09-28; the list's ⋯ menu offers
// the same). Last on the page, and Delete last in it, away from anything used
// in play (law 2), behind a confirmation and then an undo on the list (§3.2,
// Q13).
function CharacterSection({ id, onDeleted }: { id: string; onDeleted: (record: RosterRecord) => void }) {
  const { status } = useRoster(id)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<RosterRecord | null>(null)
  const [confirming, setConfirming] = useState(false)

  if (status.kind === 'loading' || status.kind === 'missing') return null
  if (status.kind === 'failed') {
    return (
      <section aria-labelledby="character-heading">
        <h2 id="character-heading">This character</h2>
        <p role="alert">{status.message}</p>
      </section>
    )
  }

  const { roster } = status
  const name = characterName(primaryEntity(roster).name)

  // Each also files a system message, for the list's folder; the
  // line here keeps its link to the new character.
  async function copy() {
    setError(null)
    try {
      const saved = await store.save(copyOf(roster))
      setCopied(saved)
      notifySystem({ kicker: KICKER.copied, lines: [`Saved ${characterName(primaryEntity(saved).name)}.`] })
    } catch (err) {
      setError(`The copy could not be saved: ${String(err)}`)
    }
  }

  async function confirmDelete() {
    setConfirming(false)
    try {
      await store.delete(roster.id)
      onDeleted(roster)
    } catch (err) {
      setError(`This character could not be deleted: ${String(err)}`)
    }
  }

  return (
    <section className="character-section" aria-labelledby="character-heading">
      <h2 id="character-heading">{name}</h2>
      <p className="meta">
        These act on the character itself, not on this device's settings.
        {roster.gameDataVersion !== rulesVersion && ` It was last saved against rules data ${roster.gameDataVersion}.`}
      </p>
      {error && <p role="alert">{error}</p>}

      <h3>Export</h3>
      <p>
        Downloads two files: <code>{exportBasename(roster, new Date()) + EXTENSION}</code>, the character itself, which is your
        backup and what Import reads; and a <code>.md</code> summary to read or share. This browser is the only place your
        characters are saved, so export to keep a backup.
      </p>
      <button
        type="button"
        className="secondary"
        onClick={() => exportFiles(roster).then(download, (err: unknown) => setError(`The export could not be written: ${String(err)}`))}
      >
        Export {name}
      </button>

      <h3>Print</h3>
      <p>Opens {name} on one plain page to print or save as a PDF.</p>
      <Link className="button secondary" to={{ screen: 'print', id: roster.id }}>
        Print sheet
      </Link>

      <h3>Copy</h3>
      <p>Saves a second character just like this one, named as a copy, to change without touching the original.</p>
      <button type="button" className="secondary" onClick={copy}>
        Copy {name}
      </button>
      {copied && (
        <p className="notice" role="status">
          Saved {characterName(primaryEntity(copied).name)}.{' '}
          <Link to={{ screen: 'character', id: copied.id }}>Open it</Link>
        </p>
      )}

      <div className="danger-zone">
        <h3>Delete</h3>
        <p>Removes this character from this browser. You can undo it straight after.</p>
        <button type="button" className="danger" aria-haspopup="dialog" onClick={() => setConfirming(true)}>
          Delete {name}
        </button>
      </div>

      {confirming && <DeleteConfirmWindow name={name} onDelete={confirmDelete} onClose={() => setConfirming(false)} />}
    </section>
  )
}

// Whether this browser has agreed to keep the saved characters (persist.ts). The
// app asks on create and import; this says what the answer was, and offers to
// ask again, since a tap here is a fair moment to.
function StorageSection() {
  const [state, setState] = useState<PersistState | null>(null)
  useEffect(() => {
    let current = true
    void persistenceState().then((s) => current && setState(s))
    return () => {
      current = false
    }
  }, [])
  if (!state) return null

  return (
    <section aria-labelledby="storage-heading">
      <h2 id="storage-heading">Saved characters</h2>
      <p role="status">
        {state === 'persisted' && 'This browser keeps your characters. It will not clear them to free space.'}
        {state === 'not-persisted' &&
          'This browser may clear your characters to free space, or after a long time without a visit. Export a character to keep a backup.'}
        {state === 'unsupported' && 'This browser cannot promise to keep your characters. Export a character to keep a backup.'}
      </p>
      {state === 'not-persisted' && (
        <button type="button" className="secondary" onClick={() => void requestPersistence().then(setState)}>
          Ask the browser to keep them
        </button>
      )}
      {/* For a bug report: which rules data this app carries (C8): the SRD
          snapshot's version. The app's own build is in About. */}
      <p className="meta">Rules data {rulesVersion}.</p>
    </section>
  )
}

// What dam’d is and whose work it uses, for players, who see the app and
// not the repository's CREDITS.md: that it's unofficial, the notice Wizards'
// Fan Content Policy asks for, word for word (user, 2026-10-25), the SRD's
// licence statement (which CC-BY-4.0 asks for where its text is shown, the
// spec §8, D1), Beyond20, the fonts, how it's made, and which build this is.
function AboutSection() {
  const [build, setBuild] = useState<string | null>(null)
  useEffect(() => {
    let current = true
    void loadBuildInfo().then((info) => current && setBuild(describeBuild(info)))
    return () => {
      current = false
    }
  }, [])

  return (
    <section aria-labelledby="about-heading">
      <h2 id="about-heading">About {APP_NAME}</h2>
      <p>
        {APP_NAME} is an unofficial character sheet for D&amp;D’s 2024 rules. It is not affiliated with, endorsed
        or sponsored by Wizards of the Coast.
      </p>
      <p className="meta">
        {APP_NAME} is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by
        Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
      </p>
      <p className="meta">{rulesAttribution}</p>
      <p>Rolls reach Roll20 through Beyond20, a browser extension by kakaroto.</p>
      <p>
        Its fonts are Alegreya Sans, Alegreya SC, Caveat, Cormorant SC and Roboto Condensed, each under the SIL Open
        Font License.
      </p>
      <p>
        It is written by Claude Code, an AI coding agent, at its maintainer’s direction, and its icons were drawn by
        an AI agent.
      </p>
      {build && <p className="meta">{build}</p>}
    </section>
  )
}

// The example characters (examples.ts): put back as they shipped, after a
// deletion or to start one over. It replaces changes made to them, so it asks
// once first, in place.
function ExamplesSection() {
  const [asking, setAsking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function putBack() {
    setAsking(false)
    try {
      const names = (await restoreExamples(store)).map((r) => r.name)
      const said = `${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]} are back on the list, as they came.`
      setMessage(said)
      notifySystem({ kicker: KICKER.restored, lines: [said] })
    } catch (err) {
      setMessage(`The examples could not be put back: ${String(err)}`)
    }
  }

  return (
    <section aria-labelledby="examples-heading">
      <h2 id="examples-heading">Example characters</h2>
      <p className="meta">The examples come with the app, to show what it does. Delete them or change them freely; this puts them back.</p>
      {asking ? (
        <>
          <p>Any changes made to the examples will be lost. Your other characters are not touched.</p>
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setAsking(false)}>
              Keep them as they are
            </button>
            <button type="button" className="secondary" onClick={() => void putBack()}>
              Put them back
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setMessage(null)
            setAsking(true)
          }}
        >
          Put back the examples
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
