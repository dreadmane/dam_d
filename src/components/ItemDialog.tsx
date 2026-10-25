import { lazy, Suspense, useState } from 'react'
import { useCharacterNotify } from '../notify/owner.ts'
import { addedLines, KICKER } from '../notify/lines.ts'
import { addItem, draftOf, emptyDraft, itemFromDraft, replaceItem, type ItemDraft } from '../play/inventory.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, Item, RosterRecord } from '../save/record.ts'
import { useHudDialog } from './dialog.ts'
import { itemReadout } from './readout.ts'
import { Window, WindowHeader } from './Window.tsx'

// One item, shown and edited with the same fields (Crawler Interface's flat
// item form ruling, cut for M0 to a name, how many, a description, tags and a
// weight). Opened from an inventory row to show the item's card, with Edit
// and Remove; or from Add item with an empty form.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

const newId = () => crypto.randomUUID()

// Wear and Attune read the rules, and load with them (InventoryKit.tsx).
const ItemKitControls = lazy(() => import('./InventoryKit.tsx').then((m) => ({ default: m.ItemKitControls })))

export function ItemDialog({
  entity,
  itemId,
  update,
  rules,
  onClose,
  onRemove,
}: {
  entity: CharacterEntity
  itemId: string | null // null to add
  update: Update
  rules?: Rules
  onClose: () => void
  onRemove: (item: Item) => void
}) {
  const item = itemId ? entity.inventory.find((i) => i.id === itemId) : undefined
  const [editing, setEditing] = useState(!itemId)
  // The card closes on a tap outside; the form keeps its Cancel.
  const dialog = useHudDialog({ onClose, dismissOnOutside: !editing })
  const [draft, setDraft] = useState<ItemDraft>(() => (item ? draftOf(item) : emptyDraft()))
  const [errors, setErrors] = useState<string[]>([])
  const notify = useCharacterNotify()
  const set = (patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, ...patch }))

  function save() {
    const r = itemFromDraft(draft, item)
    if (!r.ok) {
      setErrors(r.errors)
      return
    }
    setErrors([])
    if (item) {
      update((e) => replaceItem(e, { ...r.item, id: item.id }))
      setEditing(false)
      return
    }
    // Something arriving in the Inventory is reported.
    if (update((e) => addItem(e, { ...r.item, id: newId() }))) notify({ kicker: KICKER.added, lines: addedLines(r.item.name, r.item.quantity) })
    dialog.close()
  }

  // Gone while open (another copy of the app removed it): nothing to show.
  if (itemId && !item) return null

  return (
    <Window dialog={dialog} className="item-dialog" labelledBy="item-heading">
      {item && !editing ? <WindowHeader id="item-heading" readout={itemReadout(item)} /> : <WindowHeader id="item-heading" title={item ? `Edit ${item.name || 'Unnamed item'}` : 'Add an item'} />}
      {item && !editing ? (
        <>
          {item.description ? <p className="item-description">{item.description}</p> : <p className="meta">No description.</p>}
          {rules && (
            <Suspense fallback={null}>
              <ItemKitControls rules={rules} entity={entity} item={item} update={update} />
            </Suspense>
          )}
          <div className="dialog-actions">
            <div className="dialog-aside">
              <button type="button" className="danger" onClick={() => dialog.closeThen(() => onRemove(item))}>
                Remove
              </button>
            </div>
            <button type="button" className="secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="secondary" onClick={dialog.close}>
              Done
            </button>
          </div>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <div className="item-fields">
            <label>
              <span>Name</span>
              <input value={draft.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" />
            </label>
            <div className="item-fields-row">
              <label>
                <span>Quantity</span>
                <input type="number" inputMode="numeric" min={0} value={draft.quantity} onChange={(e) => set({ quantity: e.target.value })} />
              </label>
              <label>
                <span>Weight, lb each</span>
                <input type="text" inputMode="decimal" value={draft.weight} onChange={(e) => set({ weight: e.target.value })} autoComplete="off" />
              </label>
            </div>
            <label>
              <span>Description</span>
              <textarea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
            </label>
            <label>
              <span>Tags, separated by commas</span>
              <input value={draft.tags} onChange={(e) => set({ tags: e.target.value })} autoComplete="off" />
            </label>
          </div>
          {errors.length > 0 && (
            <ul className="form-errors" role="alert">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (!item) return dialog.close()
                setDraft(draftOf(item))
                setErrors([])
                setEditing(false)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary">
              {item ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      )}
    </Window>
  )
}
