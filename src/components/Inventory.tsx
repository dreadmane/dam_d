import { lazy, Suspense, useMemo, useState } from 'react'
import { COINS, inventoryList, NO_FILTER, removeItem, restoreItem, setCoins, SORTS, type Coin, type InventoryFilter, type InventoryView, type Removed, type SortKey } from '../play/inventory.ts'
import { loadInventoryView, saveInventoryView } from '../play/inventory-view.ts'
import type { Sheet } from '../rules/derive.ts'
import { equipped, isWeapon } from '../rules/equipped.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, Item, RosterRecord } from '../save/record.ts'
import { INVENTORY_EMPTY } from '../voice.ts'
import { useHudDialog } from './dialog.ts'
import { ItemDialog } from './ItemDialog.tsx'
import { SheetSection } from './SheetSection.tsx'
import { Window, WindowHeader } from './Window.tsx'

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

// The parts that read the rules load with them (InventoryKit.tsx).
const KitLines = lazy(() => import('./InventoryKit.tsx').then((m) => ({ default: m.KitLines })))
const CatalogueWindow = lazy(() => import('./InventoryKit.tsx').then((m) => ({ default: m.CatalogueWindow })))

// The Inventory (the spec §3.3's menu, in M0's form): the coins first, a row
// of their own, then every item the character holds, found and sorted by
// what the player recorded. The sort is this device's, kept between visits.
// A row opens the item's card (ItemDialog); Remove offers Undo until the
// next change here. A menu (user, 2026-10-13): opened from the menu as a
// window over the sheet, or pinned to the sheet. With the rules loaded (M1),
// it says what the character carries against their capacity and what they
// are attuned to, adds from the catalogue, and an item's card has Wear and
// Attune.
//
// Rows are plain, not virtualized (user, 2026-09-28): content-visibility lets
// the browser skip laying out rows off screen, while Find-in-page and screen
// readers still reach every item.

export function InventorySection({ entity, update, rules, sheet }: { entity: CharacterEntity; update: Update; rules?: Rules; sheet?: Sheet }) {
  const [view, setView] = useState<InventoryView>(loadInventoryView)
  const [filter, setFilter] = useState<InventoryFilter>(NO_FILTER)
  // The item open in the dialog: an id, 'new' to add, or null.
  const [open, setOpen] = useState<string | null>(null)
  const [removed, setRemoved] = useState<Removed | null>(null)
  const [coinsOpen, setCoinsOpen] = useState(false)
  const [catalogueOpen, setCatalogueOpen] = useState(false)
  const list = useMemo(() => inventoryList(entity, view, filter), [entity, view, filter])

  function changeView(next: Partial<InventoryView>) {
    const v = { ...view, ...next }
    setView(v)
    saveInventoryView(v)
  }

  const total = entity.inventory.length
  const filtering = filter.query.trim() !== '' || filter.tag !== null

  function remove(item: Item) {
    let taken: Removed | null = null
    update((e) => {
      const r = removeItem(e, item.id)
      taken = r.removed
      return r.entity
    })
    setRemoved(taken)
    setOpen(null)
  }

  return (
    <SheetSection id="inventory" className="inventory" count={total.toLocaleString()}>
      {/* The coins first, a row of their own (A10), each as the table says:
          the app never converts them. */}
      <button type="button" className="gold-row" aria-haspopup="dialog" aria-label={`Coins: ${COINS.map((c) => `${entity.coins[c]} ${c}`).join(', ')}`} onClick={() => setCoinsOpen(true)}>
        <span>Coins</span>
        <span className="coin-counts">
          {COINS.map((c) => (
            <span key={c} className="coin-count">
              <span className="gold-count">{entity.coins[c].toLocaleString()}</span> {c}
            </span>
          ))}
        </span>
      </button>
      {coinsOpen && <CoinsDialog entity={entity} update={update} onClose={() => setCoinsOpen(false)} />}
      {rules && sheet && (
        <Suspense fallback={null}>
          <KitLines rules={rules} entity={entity} sheet={sheet} />
        </Suspense>
      )}
      <p className="inventory-adds">
        {rules && (
          <button
            type="button"
            className="secondary"
            aria-haspopup="dialog"
            onClick={() => {
              setRemoved(null)
              setCatalogueOpen(true)
            }}
          >
            Add from catalogue
          </button>
        )}
        <button
          type="button"
          className="secondary"
          aria-haspopup="dialog"
          onClick={() => {
            setRemoved(null)
            setOpen('new')
          }}
        >
          Add item
        </button>
      </p>
      {catalogueOpen && rules && (
        <Suspense fallback={null}>
          <CatalogueWindow rules={rules} update={update} onClose={() => setCatalogueOpen(false)} />
        </Suspense>
      )}
      {removed && (
        <div className="undo-bar" role="status">
          <span>Removed {removed.item.name || 'an item'}.</span>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              update((e) => restoreItem(e, removed))
              setRemoved(null)
            }}
          >
            Undo
          </button>
        </div>
      )}
      {open && <ItemDialog entity={entity} itemId={open === 'new' ? null : open} update={update} rules={rules} onClose={() => setOpen(null)} onRemove={remove} />}
      {total === 0 ? (
        <p className="empty-state">{INVENTORY_EMPTY}</p>
      ) : (
        <>
          <div className="inventory-controls">
            <label className="inventory-find">
              <span>Find</span>
              <input type="search" value={filter.query} onChange={(e) => setFilter({ ...filter, query: e.target.value })} />
            </label>
            <label>
              <span>Sort</span>
              <select value={view.sort} onChange={(e) => changeView({ sort: e.target.value as SortKey })}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            {list.tags.length > 0 && (
              <label>
                <span>Tag</span>
                <select value={filter.tag ?? '*'} onChange={(e) => setFilter({ ...filter, tag: e.target.value === '*' ? null : e.target.value })}>
                  <option value="*">All tags</option>
                  {list.tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="inventory-count">
            <p className="meta" role="status">
              {filtering ? `${list.items.length} of ${total} items match.` : `${total} ${total === 1 ? 'item' : 'items'}.`}
            </p>
            {filtering && (
              <button type="button" className="secondary" onClick={() => setFilter(NO_FILTER)}>
                Clear filters
              </button>
            )}
          </div>

          {list.items.length > 0 ? (
            <ul className="inventory-list">
              {list.items.map((item) => (
                <InventoryRow
                  key={item.id}
                  item={item}
                  // A weapon is equipped or not; anything else worn or not.
                  held={rules && isWeapon(rules, item) ? (equipped(rules, item) ? 'Equipped' : undefined) : item.worn ? 'Worn' : undefined}
                  onOpen={() => {
                    setRemoved(null)
                    setOpen(item.id)
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing matches.</p>
          )}
        </>
      )}
    </SheetSection>
  )
}

function InventoryRow({ item, held, onOpen }: { item: Item; held?: string; onOpen: () => void }) {
  const detail = [held, item.attuned && 'Attuned', item.weight !== undefined && `${item.weight.toLocaleString()} lb${item.quantity !== 1 ? ' each' : ''}`, ...item.tags.map((t) => `#${t}`)].filter(Boolean)
  return (
    <li className="inventory-item">
      <button type="button" className="inventory-row" aria-haspopup="dialog" onClick={onOpen}>
        <span className="inventory-name">{item.name || 'Unnamed item'}</span>
        <span className="inventory-quantity">× {item.quantity}</span>
        {detail.length > 0 && <span className="inventory-detail">{detail.join(' · ')}</span>}
      </button>
    </li>
  )
}

// The coins, each set to what the table says (the spec §4.1's five). A
// form, so it keeps its Done; each change saves at once.
function CoinsDialog({ entity, update, onClose }: { entity: CharacterEntity; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  // What is typed, by coin, so a field can be emptied while typing.
  const [drafts, setDrafts] = useState<Partial<Record<Coin, string>>>({})
  return (
    <Window dialog={dialog} className="gold-dialog" labelledBy="coins-heading">
      <WindowHeader id="coins-heading" title="Coins" />
      <div className="coin-fields">
        {COINS.map((c) => (
          <label key={c} className="name">
            <span>{c}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={drafts[c] ?? String(entity.coins[c])}
              onChange={(e) => {
                const text = e.target.value
                setDrafts((d) => ({ ...d, [c]: text }))
                if (/^\d+$/.test(text.trim())) update((x) => setCoins(x, c, Number(text)))
              }}
              onBlur={() => setDrafts((d) => ({ ...d, [c]: undefined }))}
            />
          </label>
        ))}
      </div>
      <p className="meta">Saved as you type. The coins are kept as the table says; nothing is converted.</p>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}
