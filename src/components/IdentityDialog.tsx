import type { CharacterEntity } from '../save/record.ts'
import { characterName } from './character-name.ts'
import { NameEditor } from './NameEditor.tsx'
import { PhotoSection } from './PhotoSection.tsx'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// Who the character is, opened by tapping the photo in the band (user,
// 2026-09-27; the spec §3.3, Identity panel): the photo large, to add,
// adjust, replace, or remove, and the name, to edit. Nothing in it waits to
// be saved, so a tap outside closes it, until something is typed into the
// name.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown

export function IdentityDialog({ entity, update, onClose }: { entity: CharacterEntity; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })

  return (
    <Window dialog={dialog} className="identity-dialog" labelledBy="identity-heading">
      <WindowHeader id="identity-heading" title={characterName(entity.name)} />
      <PhotoSection entity={entity} update={update} heading="h3" size="full" />
      <section aria-labelledby="name-heading">
        <h3 id="name-heading">Name</h3>
        <NameEditor name={entity.name} onRename={(name) => update((e) => ({ ...e, name }))} />
      </section>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}
