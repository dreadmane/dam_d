// The inventory (Crawler Interface's §3.2, the flat item form, cut for M0 to
// what every item has: a name, how many, a description, tags and a weight),
// and the purse beside it. Pure, so every change is tested without React.
//
// Nothing here is a rule. The weight is the player's own number, in pounds
// each, and nothing totals it against a carrying limit until M1 reads that
// rule from the data. The coins are the five the save format names (the
// spec §4.1, cp to pp), recorded as the table says: the app never converts
// them.

import type { CharacterEntity, Item } from '../save/record.ts'

export type SortKey = 'added' | 'name' | 'weight'

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'added', label: 'Order added' },
  { key: 'name', label: 'Name' },
  { key: 'weight', label: 'Heaviest' },
]

// The part of the view kept on the device (inventory-view.ts).
export interface InventoryView {
  sort: SortKey
}

export const DEFAULT_VIEW: InventoryView = { sort: 'added' }

// The part that lasts only while the window is open.
export interface InventoryFilter {
  query: string
  tag: string | null
}

export const NO_FILTER: InventoryFilter = { query: '', tag: null }

export interface InventoryList {
  items: Item[]
  // Every tag present, for the filter.
  tags: string[]
}

const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })

function matches(item: Item, f: InventoryFilter): boolean {
  if (f.tag !== null && !item.tags.includes(f.tag)) return false
  const q = f.query.trim().toLocaleLowerCase()
  if (!q) return true
  return [item.name, item.description, ...item.tags].some((s) => s.toLocaleLowerCase().includes(q))
}

function compare(sort: SortKey): ((a: Item, b: Item) => number) | null {
  switch (sort) {
    case 'added':
      return null
    case 'name':
      return byName
    case 'weight':
      // Heaviest first, the whole stack's weight; an item with no weight
      // recorded is unknown, not weightless, so it goes last.
      return (a, b) => (b.weight === undefined ? -1 : b.weight * b.quantity) - (a.weight === undefined ? -1 : a.weight * a.quantity) || byName(a, b)
  }
}

export function inventoryList(e: CharacterEntity, view: InventoryView, filter: InventoryFilter): InventoryList {
  const matched = e.inventory.filter((i) => matches(i, filter))
  const order = compare(view.sort)
  return {
    items: order ? matched.toSorted(order) : matched,
    tags: [...new Set(e.inventory.flatMap((i) => i.tags))].sort((a, b) => a.localeCompare(b)),
  }
}

// The item form's fields as typed.
export interface ItemDraft {
  name: string
  quantity: string
  description: string
  tags: string
  weight: string
}

export const emptyDraft = (): ItemDraft => ({ name: '', quantity: '1', description: '', tags: '', weight: '' })

export const draftOf = (item: Item): ItemDraft => ({
  name: item.name,
  quantity: String(item.quantity),
  description: item.description,
  tags: item.tags.join(', '),
  weight: item.weight === undefined ? '' : String(item.weight),
})

const WHOLE = /^\d+$/
const POUNDS = /^\d+(\.\d+)?$/

export type DraftResult = { ok: true; item: Omit<Item, 'id'> } | { ok: false; errors: string[] }

// The form's fields as an item, or what is wrong with them. Fields the form
// does not show (a catalogue id, effects, worn: M1's) are kept from `keep`.
export function itemFromDraft(d: ItemDraft, keep: Partial<Item> = {}): DraftResult {
  const errors: string[] = []
  const name = d.name.trim()
  if (!name) errors.push('Give the item a name.')
  if (!WHOLE.test(d.quantity.trim())) errors.push('Quantity is a whole number, 0 or more.')
  if (d.weight.trim() && !POUNDS.test(d.weight.trim())) errors.push('Weight is a number of pounds, such as 3 or 0.5, or left empty.')
  if (errors.length) return { ok: false, errors }
  const { id: _id, weight: _weight, ...kept } = keep
  return {
    ok: true,
    item: {
      ...kept,
      name,
      description: d.description.trim(),
      quantity: Number(d.quantity),
      tags: [...new Set(d.tags.split(',').map((t) => t.trim()).filter(Boolean))],
      ...(d.weight.trim() ? { weight: Number(d.weight) } : {}),
    },
  }
}

export function addItem(entity: CharacterEntity, item: Item): CharacterEntity {
  return { ...entity, inventory: [...entity.inventory, item] }
}

export function replaceItem(entity: CharacterEntity, item: Item): CharacterEntity {
  return { ...entity, inventory: entity.inventory.map((i) => (i.id === item.id ? item : i)) }
}

// Everything needed to put a removed item back exactly: its place in the list.
export interface Removed {
  item: Item
  index: number
}

export function removeItem(entity: CharacterEntity, itemId: string): { entity: CharacterEntity; removed: Removed | null } {
  const index = entity.inventory.findIndex((i) => i.id === itemId)
  if (index < 0) return { entity, removed: null }
  return { entity: { ...entity, inventory: entity.inventory.filter((i) => i.id !== itemId) }, removed: { item: entity.inventory[index], index } }
}

// Undo: back in its place.
export function restoreItem(entity: CharacterEntity, r: Removed): CharacterEntity {
  const inventory = [...entity.inventory]
  inventory.splice(Math.min(r.index, inventory.length), 0, r.item)
  return { ...entity, inventory }
}

export type Coin = keyof CharacterEntity['coins']

// The five coins, in the save format's order, smallest first.
export const COINS: readonly Coin[] = ['cp', 'sp', 'ep', 'gp', 'pp']

// One coin's count set as the table says; never below none.
export function setCoins(entity: CharacterEntity, coin: Coin, count: number): CharacterEntity {
  return { ...entity, coins: { ...entity.coins, [coin]: Math.max(0, Math.trunc(count)) } }
}
