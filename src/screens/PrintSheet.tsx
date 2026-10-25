import { characterName } from '../components/character-name.ts'
import { CharacterUnreadable } from '../components/CharacterUnreadable.tsx'
import { Link } from '../components/Link.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { primaryEntity, useRoster } from '../save/use-roster.ts'
import { useCharacterTitle } from '../title.ts'

// The phone-readable, printable result (spec §3.3, Print sheet, M0's form):
// the character's own data on one plain page, with the app's chrome hidden
// when printed: the name and the notes. M1 adds the heading line D&D's sheet
// gives (Level, classes, species, background, AC, HP, Speed, proficiency
// bonus). It states values the player already has; it reproduces nothing
// from the book.
export function PrintSheet({ id }: { id: string }) {
  const { status } = useRoster(id)
  useCharacterTitle(status, 'Print sheet')
  if (status.kind === 'failed') return <CharacterUnreadable title="Print sheet" message={status.message} />
  if (status.kind !== 'ready') return <main aria-busy="true" />
  const e = primaryEntity(status.roster)
  return (
    <main className="print-sheet">
      <div className="no-print">
        <TopBar characterId={id}>
          <Link to={{ screen: 'character', id }}>Back to the character</Link>
        </TopBar>
        <button type="button" className="primary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <ScreenHeading>{characterName(e.name)}</ScreenHeading>
      <section>
        <h2>Notes</h2>
        {e.notes.trim() ? <p className="print-notes">{e.notes}</p> : <p className="meta">No notes.</p>}
      </section>
    </main>
  )
}
