import { describe, expect, it } from 'vitest'
import { newRoster } from '../save/new-roster.ts'
import type { CharacterEntity, Item } from '../save/record.ts'
import { primaryEntity } from '../save/use-roster.ts'
import {
  addItem,
  DEFAULT_VIEW,
  draftOf,
  emptyDraft,
  inventoryList,
  itemFromDraft,
  NO_FILTER,
  removeItem,
  replaceItem,
  restoreItem,
  setCoins,
} from './inventory.ts'
import { parseInventoryView } from './inventory-view.ts'

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({ id, name, description: '', quantity: 1, tags: [], ...extra })

const blank = primaryEntity(newRoster({ name: 'Lia' }))
const held: CharacterEntity = {
  ...blank,
  inventory: [
    item('a', 'Rope', { weight: 5, tags: ['camp'], description: 'Hempen, 50 feet' }),
    item('b', 'bedroll', { weight: 7, tags: ['camp'] }),
    item('c', 'Letter', { quantity: 2 }),
    item('d', 'Arrows', { quantity: 20, weight: 0.05 }),
  ],
}
const names = (items: Item[]) => items.map((i) => i.name)

describe('the inventory list', () => {
  it('keeps the order added by default, and sorts by name or by the heaviest stack', () => {
    expect(names(inventoryList(held, DEFAULT_VIEW, NO_FILTER).items)).toEqual(['Rope', 'bedroll', 'Letter', 'Arrows'])
    expect(names(inventoryList(held, { sort: 'name' }, NO_FILTER).items)).toEqual(['Arrows', 'bedroll', 'Letter', 'Rope'])
    // 7 lb, 5 lb, 20 × 0.05 = 1 lb, then the letter, whose weight is unknown.
    expect(names(inventoryList(held, { sort: 'weight' }, NO_FILTER).items)).toEqual(['bedroll', 'Rope', 'Arrows', 'Letter'])
  })

  it('finds by name, description or tag, and filters by a tag', () => {
    expect(names(inventoryList(held, DEFAULT_VIEW, { query: 'hemp', tag: null }).items)).toEqual(['Rope'])
    expect(names(inventoryList(held, DEFAULT_VIEW, { query: 'CAMP', tag: null }).items)).toEqual(['Rope', 'bedroll'])
    expect(names(inventoryList(held, DEFAULT_VIEW, { query: '', tag: 'camp' }).items)).toEqual(['Rope', 'bedroll'])
    expect(inventoryList(held, DEFAULT_VIEW, NO_FILTER).tags).toEqual(['camp'])
  })

  it('reads a sort it does not offer as the default', () => {
    expect(parseInventoryView('{"sort":"weight"}')).toEqual({ sort: 'weight' })
    for (const raw of [null, '', 'nope', '{"sort":"value"}', '{"sort":"equipped","showFolded":true}', 'null']) expect(parseInventoryView(raw), String(raw)).toEqual(DEFAULT_VIEW)
  })
})

describe('the item form', () => {
  it('makes an item from its fields, trimmed, with each tag once', () => {
    const r = itemFromDraft({ name: ' Rope ', quantity: '2', description: ' Hempen ', tags: 'camp, , climbing, camp', weight: '5' })
    expect(r).toEqual({ ok: true, item: { name: 'Rope', quantity: 2, description: 'Hempen', tags: ['camp', 'climbing'], weight: 5 } })
  })

  it('leaves the weight out when none is given, and says what is wrong', () => {
    expect(itemFromDraft({ ...emptyDraft(), name: 'Letter' })).toEqual({ ok: true, item: { name: 'Letter', quantity: 1, description: '', tags: [] } })
    expect(itemFromDraft({ ...emptyDraft(), quantity: '1.5', weight: 'heavy' })).toEqual({
      ok: false,
      errors: ['Give the item a name.', 'Quantity is a whole number, 0 or more.', 'Weight is a number of pounds, such as 3 or 0.5, or left empty.'],
    })
  })

  it('round-trips an item through its form, keeping what the form does not show', () => {
    const rope = item('a', 'Rope', { weight: 0.5, tags: ['camp'], itemId: 'equipment:rope', worn: false })
    const r = itemFromDraft(draftOf(rope), rope)
    expect(r.ok && { ...r.item, id: rope.id }).toEqual(rope)
    // A weight cleared in the form goes.
    const cleared = itemFromDraft({ ...draftOf(rope), weight: '' }, rope)
    expect(cleared.ok && 'weight' in cleared.item).toBe(false)
  })
})

describe('changing the inventory', () => {
  it('adds, replaces, and removes with an Undo that puts the item back in its place', () => {
    const added = addItem(blank, item('x', 'Torch'))
    expect(names(added.inventory)).toEqual(['Torch'])
    expect(replaceItem(added, item('x', 'Lantern')).inventory[0].name).toBe('Lantern')
    const { entity, removed } = removeItem(held, 'b')
    expect(names(entity.inventory)).toEqual(['Rope', 'Letter', 'Arrows'])
    expect(restoreItem(entity, removed!).inventory).toEqual(held.inventory)
    expect(removeItem(held, 'nope').removed).toBeNull()
  })

  it('sets a coin’s count as the table says, never below none', () => {
    expect(setCoins(blank, 'gp', 15).coins).toEqual({ cp: 0, sp: 0, ep: 0, gp: 15, pp: 0 })
    expect(setCoins(blank, 'sp', -3).coins.sp).toBe(0)
  })
})
