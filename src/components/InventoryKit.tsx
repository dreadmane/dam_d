import { useState } from 'react'
import { useCharacterNotify } from '../notify/owner.ts'
import { addedLines, KICKER } from '../notify/lines.ts'
import { addItem } from '../play/inventory.ts'
import { attunement, baseOptions, CATALOGUE_KINDS, carryingLine, catalogueItem, findInCatalogue, needsAttunement, setAttuned, setCountsAs, setWorn, weaponSets, wearable, type CatalogueEntry, type CatalogueKind } from '../play/kit.ts'
import { deriveSheet, type Sheet } from '../rules/derive.ts'
import { equipped, isWeapon } from '../rules/equipped.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, Item, RosterRecord } from '../save/types.ts'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// The inventory's parts that read the rules (the spec §3.3, Inventory, coins,
// attunement), loaded with them so the startup script never carries the
// catalogue: what the character carries against their capacity, what they
// are attuned to, an item's Wear and Attune, and adding from the catalogue.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function KitLines({ rules, entity, sheet }: { rules: Rules; entity: CharacterEntity; sheet: Sheet }) {
  const { items, max } = attunement(rules, entity, sheet.attunementMax)
  const over = sheet.carrying.carried > sheet.carrying.capacity
  return (
    <div className="inventory-kit">
      <p className="meta" data-over={over || undefined}>
        {carryingLine(sheet)}
        {over ? ': over your capacity' : ''}
      </p>
      {/* Attunement as its slots (Rules Glossary, Attunement: three), one
          line each, filled by an item attuned or open, so how many are
          left reads at a glance (user, 2026-10-24). */}
      <section className="attunement" aria-labelledby="attunement-heading">
        <h3 id="attunement-heading">
          Attunement <span className="meta">· {items.length} of {max} slots</span>
        </h3>
        <ul className="attunement-list">
          {Array.from({ length: Math.max(max, items.length) }, (_, i) => items[i]).map((item, i) => (
            <li key={item?.id ?? `open-${i}`} className={item ? undefined : 'meta'}>
              <span className="attunement-slot" data-used={item ? true : undefined} aria-hidden="true" />
              {item ? item.name || 'Unnamed item' : 'Open slot'}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// An item's card's Wear or Equip, and Attune (Rules Glossary, Attunement):
// wearing or holding puts its effects on the sheet, and an item that needs
// Attunement needs that too. A weapon is equipped or not, as the Attack
// action says, and only an equipped one is an attack (equipped.ts). A
// fourth attunement refuses, naming the three. A weapon a feature's set
// leaves out (Martial Arts' Monk weapons) can be ruled into it by the DM,
// for this character (kit.ts weaponSets).
export function ItemKitControls({ rules, entity, item, update }: { rules: Rules; entity: CharacterEntity; item: Item; update: Update }) {
  const [error, setError] = useState('')
  const weapon = isWeapon(rules, item)
  const canWear = weapon || wearable(rules, item)
  const on = equipped(rules, item)
  const attune = needsAttunement(rules, item)
  const sets = weapon ? weaponSets(rules, entity, item) : []
  const ruledIn = (id: string) => Boolean(item.countsAs?.includes(id))
  if (!canWear && !attune) return null
  return (
    <>
      <p className="meta">
        {[
          canWear && (weapon ? (on ? 'Equipped: one of your attacks' : 'Not equipped: not among your attacks') : on ? 'Worn or held' : 'Not worn'),
          attune && (item.attuned ? 'Attuned' : 'Needs Attunement: its magic works only while you are attuned'),
          ...sets.filter((s) => ruledIn(s.id)).map((s) => (s.bond ? `Your ${s.name}` : `A ${s.name} by your DM’s ruling`)),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {error && (
        <p className="owed" role="alert">
          {error}
        </p>
      )}
      <div className="quick-choices">
        {canWear && (
          <button type="button" className="secondary" aria-pressed={on} onClick={() => update((e) => setWorn(e, item.id, !on))}>
            {weapon ? (on ? 'Unequip' : 'Equip') : on ? 'Take off' : 'Wear'}
          </button>
        )}
        {attune && (
          <button
            type="button"
            className="secondary"
            aria-pressed={Boolean(item.attuned)}
            onClick={() => {
              const r = setAttuned(rules, entity, item.id, !item.attuned, deriveSheet(rules, entity).attunementMax)
              if (!r.ok) return setError(r.error)
              setError('')
              update(() => r.entity)
            }}
          >
            {item.attuned ? 'End attunement' : 'Attune'}
          </button>
        )}
        {sets.map((s) => (
          <button key={s.id} type="button" className="secondary" aria-pressed={ruledIn(s.id)} onClick={() => update((e) => setCountsAs(e, item.id, s.id, !ruledIn(s.id), s.bond))}>
            {s.bond ? (ruledIn(s.id) ? 'End the bond' : `Bond as your ${s.name}`) : ruledIn(s.id) ? `End the ${s.name} ruling` : `Rule it a ${s.name}`}
          </button>
        ))}
      </div>
    </>
  )
}

// How many rows to draw before asking for a narrower find, so the window
// opens at once.
const LIMIT = 40

// Adding from the catalogue: the SRD's weapons, armor, gear, tools and magic
// items, found by name. A magic weapon or armor asks what it is made from
// when its record leaves that open (Weapon, +1: any Simple or Martial).
export function CatalogueWindow({ rules, update, onClose }: { rules: Rules; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  const notify = useCharacterNotify()
  const [find, setFind] = useState('')
  const [kind, setKind] = useState<CatalogueKind | null>(null)
  const [picked, setPicked] = useState<CatalogueEntry | null>(null)
  const [base, setBase] = useState('')
  const matched = findInCatalogue(rules, find, kind)
  const shown = matched.slice(0, LIMIT)
  const bases = picked ? baseOptions(rules, picked.ref) : null

  const add = (entry: CatalogueEntry, baseId?: string) => {
    const item = catalogueItem(rules, entry.ref, baseId, crypto.randomUUID())
    if (!item) return
    if (update((e) => addItem(e, item))) notify({ kicker: KICKER.added, lines: addedLines(item.name, item.quantity) })
    dialog.close()
  }

  const pick = (entry: CatalogueEntry) => {
    const options = baseOptions(rules, entry.ref)
    if (!options || options.ids.length === 1) return add(entry, options?.ids[0])
    setPicked(entry)
    setBase(options.ids[0])
  }

  const nameOf = (id: string) => (rules.weapons.get(id) ?? rules.armor.get(id))?.name ?? id

  return (
    <Window dialog={dialog} className="slot-dialog catalogue-dialog" labelledBy="catalogue-heading">
      <WindowHeader id="catalogue-heading" title={picked ? `${picked.name}: made from` : 'Add from the catalogue'} />
      {picked && bases ? (
        <>
          <p className="meta">The item says: {bases.printed}.</p>
          <label>
            <span>Made from</span>
            <select value={base} onChange={(e) => setBase(e.target.value)}>
              {bases.ids.map((id) => (
                <option key={id} value={id}>
                  {nameOf(id)}
                </option>
              ))}
            </select>
          </label>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setPicked(null)}>
              Back
            </button>
            <button type="button" className="primary" onClick={() => add(picked, base)}>
              Add
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="inventory-controls">
            <label className="inventory-find">
              <span>Find</span>
              <input type="search" value={find} onChange={(e) => setFind(e.target.value)} />
            </label>
            <label>
              <span>Kind</span>
              <select value={kind ?? '*'} onChange={(e) => setKind(e.target.value === '*' ? null : (e.target.value as CatalogueKind))}>
                <option value="*">Every kind</option>
                {CATALOGUE_KINDS.map((k) => (
                  <option key={k.kind} value={k.kind}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {matched.length === 0 ? (
            <p className="empty">Nothing matches.</p>
          ) : (
            <ul className="stat-list">
              {shown.map((c) => (
                <li key={c.ref}>
                  <button type="button" className="stat-row" onClick={() => pick(c)}>
                    <span className="stat-name">{c.name}</span>
                    <span className="stat-detail">{c.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {matched.length > shown.length && <p className="meta">{matched.length - shown.length} more: narrow the find to see them.</p>}
          <p className="meta">From the SRD 5.2.1, under CC-BY-4.0.</p>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={dialog.close}>
              Cancel
            </button>
          </div>
        </>
      )}
    </Window>
  )
}
