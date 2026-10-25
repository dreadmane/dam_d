import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { characterName } from '../components/character-name.ts'
import { ErrorBoundary } from '../components/ErrorBoundary.tsx'
import { Hud } from '../components/Hud.tsx'
import { InventorySection } from '../components/Inventory.tsx'
import { Link } from '../components/Link.tsx'
import { MenuWindow } from '../components/MenuWindow.tsx'
import { setPinned, usePins } from '../components/pins.ts'
import { RollsSection } from '../components/Rolls.tsx'
import { ScratchPad } from '../components/ScratchPad.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { SheetSection } from '../components/SheetSection.tsx'
import { SHEET, SectionPlace, type Place } from '../components/section-place.ts'
import { useSectionInView } from '../components/section-in-view.ts'
import { clearMenuEntry, OPEN_MENU } from '../components/sections-nav.ts'
import { useOrder } from '../components/sheet-order.ts'
import { ThumbIndex } from '../components/ThumbIndex.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { indexSections, isPinned, pinnedByDefault, SECTION_NAME, SECTION_SHORT, sheetLayout, type SectionId } from '../play/sheet-layout.ts'
import { bandLine, bandReadout, levelReady } from '../play/vitals.ts'
import { deriveSheet, type Sheet } from '../rules/derive.ts'
import { useRules, type Rules, type RulesStatus } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/record.ts'
import { primaryEntity, useRoster } from '../save/use-roster.ts'
import { useCharacterTitle } from '../title.ts'
import { loadSettings } from '../settings.ts'

// The sheet (the spec §3.3), home for a character, inside the band that
// carries the name, the photo and the vitals. The rules load on first need
// (rules/load.ts) and the sheet is derived from them and the saved choices
// (rules/derive.ts), never stored. Below the band, the sheet's own sections
// and the menus the player pinned, in the order the player arranged (user,
// 2026-10-13; play/sheet-layout.ts); every other menu opens from MENU as a
// window over the sheet. Until the rules arrive, the sections that need them
// wait and the rest work. Export, Copy, and Delete are not here: they are the
// character's section in Settings, and on the list's ⋯ menu (user,
// 2026-09-28).

// Saved to the minute, as the list says it (C8).
const SAVED_AT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

// Dice, the free roll, a menu opened now and then (2026-10-17), loads when
// it is first opened or pinned.
const DiceSection = lazy(() => import('../components/Dice.tsx'))

// The sheet's rule-driven sections and the Health window load with the rules:
// none can draw before the rules arrive.
const RuledSection = lazy(() => import('../components/RuledSections.tsx').then((m) => ({ default: m.RuledSection })))
const HealthWindow = lazy(() => import('../components/RuledSections.tsx').then((m) => ({ default: m.HealthWindow })))
const QuickRoll = lazy(() => import('../components/RuledSections.tsx').then((m) => ({ default: m.QuickRoll })))
const QuickDock = lazy(() => import('../components/RuledSections.tsx').then((m) => ({ default: m.QuickDock })))
const ReactionsBand = lazy(() => import('../components/RuledSections.tsx').then((m) => ({ default: m.ReactionsBand })))

export function PlayView({ id }: { id: string }) {
  const { status, update } = useRoster(id)
  const rules = useRules()
  useCharacterTitle(status)
  const pins = usePins()
  const order = useOrder()
  // The menu whose window is open, which the menu asks for.
  const [menu, setMenu] = useState<SectionId | null>(null)
  useEffect(() => {
    clearMenuEntry()
    const opened = (e: Event) => {
      // Before the window measures its box: the sheet hides under it (index.css).
      document.body.setAttribute('data-menu-open', '')
      setMenu((e as CustomEvent<SectionId>).detail)
    }
    window.addEventListener(OPEN_MENU, opened)
    return () => window.removeEventListener(OPEN_MENU, opened)
  }, [])

  const back = (
    <TopBar>
      <Link to={{ screen: 'roster' }}>All characters</Link>
    </TopBar>
  )

  if (status.kind === 'loading' || status.kind === 'missing') {
    return (
      <main aria-busy="true">
        {back}
        <ScreenHeading>Character</ScreenHeading>
      </main>
    )
  }
  if (status.kind === 'failed') {
    return (
      <main>
        {back}
        <ScreenHeading>Character</ScreenHeading>
        <p role="alert">{status.message}</p>
      </main>
    )
  }

  const { roster, savedAt } = status
  const character = primaryEntity(roster)
  return <Sheet roster={roster} savedAt={savedAt} character={character} update={update} rules={rules} pins={pins} order={order} menu={menu} setMenu={setMenu} />
}

function Sheet({
  roster,
  savedAt,
  character,
  update,
  rules,
  pins,
  order,
  menu,
  setMenu,
}: {
  roster: RosterRecord
  savedAt: string
  character: CharacterEntity
  update: ReturnType<typeof useRoster>['update']
  rules: RulesStatus
  pins: ReturnType<typeof usePins>
  order: ReturnType<typeof useOrder>
  menu: SectionId | null
  setMenu: (menu: SectionId | null) => void
}) {
  const ready = rules.kind === 'ready' ? rules.rules : null
  const sheet = useMemo(() => (ready ? deriveSheet(ready, character) : null), [ready, character])
  // The Health window, opened from the band's HP or the death saves' Heal.
  const [health, setHealth] = useState(false)
  // The quick roll for Initiative, opened from the band.
  const [initiative, setInitiative] = useState(false)
// The look, as Settings left it when the sheet opened (settings.ts): the
  // Journal adds On your turn and makes Attacks a menu (play/sheet-layout.ts).
  const [look] = useState(() => loadSettings().look)
  const journal = look === 'journal'
  const layout = sheetLayout(pins, order, look)
  // The open book on a wide screen: two pages side by side.
  const spread = useWide() && journal
  // At 0 HP, with a class: the death saves above everything (SRD p.17).
  const deathSaves = character.classes.length > 0 && character.hp.current === 0
  // The Journal's thumb index and running head: the sections the page
  // shows, and the one in view (components/section-in-view.ts). Classic has
  // neither, and measures nothing.
  const { shown, current } = useSectionInView(indexSections(layout.sheet, look, deathSaves))
  // A pinned menu's PINNED sends it back to the menu; whether that is kept
  // as a choice depends on where the section is by default.
  const pin = (s: SectionId, pinned: boolean) => setPinned(s, pinned, pinnedByDefault(s, look))
  const place = (s: SectionId): Place => (isPinned(s, pins, look) ? { at: 'pinned', unpin: () => pin(s, false) } : SHEET)

  // Each section behind its own boundary: a crash in one leaves the others,
  // and the band, working.
  // The sections the rules derive, once they have loaded, from their own
  // chunk (components/RuledSections.tsx).
  function ruled(s: SectionId, sheet: Sheet, ready: Rules): ReactNode {
    return (
      <Suspense fallback={<RulesWait id={s} rules={{ kind: 'loading' }} />}>
        <RuledSection id={s} rosterId={roster.id} sheet={sheet} rules={ready} entity={character} update={update} onHeal={() => setHealth(true)} />
      </Suspense>
    )
  }

  const placed = (s: SectionId) => (
    <SectionPlace.Provider key={s} value={place(s)}>
      {section(s)}
    </SectionPlace.Provider>
  )

  function section(s: SectionId): ReactNode {
    switch (s) {
      case 'death-saves':
      case 'turn':
      case 'quick-bar':
      case 'attacks':
      case 'abilities':
      case 'skills':
      case 'spells':
      case 'conditions':
      case 'resources':
      case 'rest':
      case 'features':
        return (
          <ErrorBoundary name={SECTION_NAME[s]}>
            {sheet && ready ? ruled(s, sheet, ready) : <RulesWait id={s} rules={rules} />}
          </ErrorBoundary>
        )
      case 'inventory':
        return (
          <ErrorBoundary name="The Inventory">
            <InventorySection entity={character} update={update} rules={ready ?? undefined} sheet={sheet ?? undefined} />
          </ErrorBoundary>
        )
      case 'dice':
        return (
          <ErrorBoundary name="Dice">
            <Suspense fallback={null}>
              <DiceSection entity={character} />
            </Suspense>
          </ErrorBoundary>
        )
      case 'rolls':
        return (
          <ErrorBoundary name="Rolls">
            <RollsSection rosterId={roster.id} character={characterName(character.name)} />
          </ErrorBoundary>
        )
      case 'scratch-pad':
        return (
          <ErrorBoundary name="The Scratch pad">
            <ScratchPad entity={character} update={update} />
          </ErrorBoundary>
        )
    }
  }

  return (
    <Hud rosterId={roster.id} entity={character} update={update} runningHead={current ? SECTION_SHORT[current] : undefined} vitals={
        sheet && ready ? (
          <Vitals journal={journal} line={bandLine(sheet, character, ready)} readout={bandReadout(sheet, character)} inspiration={character.heroicInspiration} id={roster.id} levelReady={levelReady(ready, character, sheet.level)} onHp={() => setHealth(true)} onInitiative={() => setInitiative(true)} concentrating={character.concentration ? ready.spells.get(character.concentration.spellId)?.name : undefined} />
        ) : undefined
      }
      reactions={
        // The Journal's foot is the quick bar; its reactions are the turn's.
        journal && sheet && ready ? (
          <ErrorBoundary name="The Quick bar">
            <Suspense fallback={null}>
              <QuickDock rules={ready} entity={character} sheet={sheet} update={update} />
            </Suspense>
          </ErrorBoundary>
        ) : sheet && ready && character.classes.length > 0 ? (
          <ErrorBoundary name="Reactions">
            <Suspense fallback={null}>
              <ReactionsBand rules={ready} entity={character} sheet={sheet} update={update} />
            </Suspense>
          </ErrorBoundary>
        ) : undefined
      }>

      {/* The thumb index, fixed down the page's fore-edge (ThumbIndex.tsx). */}
      <ThumbIndex sections={shown} current={current} />
      {deathSaves && section('death-saves')}
      {spread ? (
        <div className="journal-spread">
          {(['left', 'right'] as const).map((page) => (
            <div key={page} className="journal-page" data-page={page}>
              {layout.sheet.filter((s) => (page === 'right') === RIGHT_PAGE.has(s)).map(placed)}
            </div>
          ))}
        </div>
      ) : (
        layout.sheet.map(placed)
      )}

      {health && sheet && ready && (
        <Suspense fallback={null}>
          <HealthWindow rules={ready} entity={character} sheet={sheet} update={update} onClose={() => setHealth(false)} />
        </Suspense>
      )}
      {initiative && sheet && ready && (
        <Suspense fallback={null}>
          <QuickRoll rules={ready} entity={character} name="Initiative" total={sheet.initiative} onClose={() => setInitiative(false)} />
        </Suspense>
      )}

      {/* A menu's window: the section itself, drawn over the sheet. It stays
          while PIN closes it, though the section is on the sheet by then. */}
      {menu && (
        <MenuWindow id={menu} onPin={() => pin(menu, true)} onClose={() => setMenu(null)}>
          {section(menu)}
        </MenuWindow>
      )}

      {/* When it was saved, to the minute (C8). The rules data's version is
          for whoever debugs, so it lives in Settings. */}
      <footer>
        <p>Saved {SAVED_AT.format(new Date(savedAt))}</p>
      </footer>
    </Hud>
  )
}

// The Journal's open book (index.css, .journal-spread): from 64 rem, the
// turn and what is spent in it on the right-hand page, everything else
// (abilities, skills, conditions, rest, the pinned menus) on the left, each
// page in the sheet's order.
const RIGHT_PAGE: ReadonlySet<SectionId> = new Set(['turn', 'quick-bar', 'attacks', 'spells', 'resources'])
const WIDE = '(min-width: 64rem)'

function useWide(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches)
  useEffect(() => {
    const media = window.matchMedia(WIDE)
    const changed = () => setWide(media.matches)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [])
  return wide
}

// The band's vitals (play/vitals.ts): the class line, then the readout in
// two lines, labels muted and values in the text colour. The label's last
// word and its value share a run that never wraps apart. In the Journal the
// readout is a row of inked boxes, a label over each value, HP and
// Initiative the two that open something.
function Vitals({ journal, line, readout, inspiration, id, levelReady, onHp, onInitiative, concentrating }: { journal: boolean; line: string; readout: ReturnType<typeof bandReadout>; inspiration: boolean; id: string; levelReady: boolean; onHp: () => void; onInitiative: () => void; concentrating?: string }) {
  if (journal)
    return (
      <>
        <p className="hud-full meta">{line}</p>
        <p className="hud-full band-links">
          <Link to={{ screen: 'levels', id }}>Levels</Link>
          {levelReady && <Link to={{ screen: 'levels', id, up: true }}>Level up</Link>}
        </p>
        <div className="hud-full journal-vitals">
          {readout.flat().map((item) =>
            item.label === 'HP' || item.roll ? (
              <button
                key={item.label}
                type="button"
                className="journal-vital"
                // HP stays on the band's collapsed line, beside the running
                // head (index.css): a tap there opens the Health window, not
                // the band (Hud.tsx).
                data-line={item.label === 'HP' || undefined}
                aria-haspopup="dialog"
                aria-label={item.label === 'HP' ? `HP ${item.value}: take damage or heal` : `Roll ${item.label}, ${item.value}`}
                onClick={item.label === 'HP' ? onHp : onInitiative}
              >
                <span className="journal-vital-label">{item.label}</span>
                <span className="journal-vital-value">{item.value}</span>
                <span className="journal-vital-hint">{item.label === 'HP' ? 'Change' : 'Roll'}</span>
              </button>
            ) : (
              <p key={item.label} className="journal-vital">
                <span className="journal-vital-label">{item.label}</span>
                <span className="journal-vital-value">{item.value}</span>
              </p>
            ),
          )}
        </div>
        {(inspiration || concentrating) && (
          <div className="hud-full band-readout">
            {inspiration && <p className="readout-inspiration">Heroic Inspiration</p>}
            {concentrating && <p className="readout-inspiration">Concentrating on {concentrating}</p>}
          </div>
        )}
      </>
    )
  return (
    <>
      <p className="hud-full meta">{line}</p>
      {/* The ladder (screens/LevelsScreen.tsx): Levels always, Level up
          when the character is due one (play/vitals.ts levelReady). */}
      <p className="hud-full band-links">
        <Link to={{ screen: 'levels', id }}>Levels</Link>
        {levelReady && <Link to={{ screen: 'levels', id, up: true }}>Level up</Link>}
      </p>
      <div className="hud-full band-readout">
        {readout.map((items) => (
          <p key={items[0].label}>
            {items.map((item, i) => (
              <span key={item.label}>
                {i > 0 && ' · '}
                {/* HP opens the Health window: Take damage, Heal, Temp HP.
                    Initiative opens its quick roll. */}
                {item.label === 'HP' ? (
                  <button type="button" className="readout-pair readout-button" aria-haspopup="dialog" aria-label={`HP ${item.value}: take damage or heal`} onClick={onHp}>
                    {item.label} <span className="readout-value">{item.value}</span>
                  </button>
                ) : item.roll ? (
                  <button type="button" className="readout-pair readout-button" aria-haspopup="dialog" aria-label={`Roll ${item.label}, ${item.value}`} onClick={onInitiative}>
                    {item.label} <span className="readout-value">{item.value}</span>
                  </button>
                ) : (
                  <span className="readout-pair">
                    {item.label} <span className="readout-value">{item.value}</span>
                  </span>
                )}
              </span>
            ))}
          </p>
        ))}
        {inspiration && <p className="readout-inspiration">Heroic Inspiration</p>}
        {concentrating && <p className="readout-inspiration">Concentrating on {concentrating}</p>}
      </div>
    </>
  )
}

// A section that needs the rules, while they load or if they fail.
function RulesWait({ id, rules }: { id: SectionId; rules: RulesStatus }) {
  return (
    <SheetSection id={id}>
      {rules.kind === 'failed' ? <p role="alert">{rules.message}</p> : <p className="meta" aria-busy="true">Loading the rules…</p>}
    </SheetSection>
  )
}
