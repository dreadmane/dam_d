// The sheet and its menus (Crawler Interface's play view, user 2026-10-13,
// carried as-is by the spec §3.3): what is rolled or tapped in play sits on
// the sheet and never folds; what is only read opens from the menu as a
// window of its own; and a menu the player pins joins the sheet, in the
// menu's order. The player may arrange the sheet's sections: the order is
// the device's, as the pins are.
//
// The sheet's own sections arrive through M1 in the spec §3.3's order: the
// quick bar, Attacks, Abilities and saves, Skills, Spells, Conditions and
// effects, Class resources, Rest, Advancement. Each joins ALWAYS and ORDER
// in its place as it is built, and each menu joins MENUS. The quick bar is
// the one menu pinned by default (the spec §3.3: on the sheet, at the top,
// and it pins and unpins like a menu). Death saves are not arranged: at 0 HP
// they stand above the sheet.
//
// The Adventurer's Journal (settings.ts Look, user 2026-10-20) puts On your
// turn first, above everything the player arranges, and makes Attacks a
// menu: its rows are the turn's Action group, with the same rolls. Its
// quick bar is the dock at the foot of the screen (QuickBar.tsx QuickDock),
// so it is neither on the sheet nor a menu there (user, 2026-10-20).

export type SectionId = 'death-saves' | 'turn' | 'quick-bar' | 'attacks' | 'abilities' | 'skills' | 'spells' | 'conditions' | 'resources' | 'rest' | 'inventory' | 'features' | 'dice' | 'rolls' | 'scratch-pad'

// Each section's name, as its heading and the menu say it.
export const SECTION_NAME: Record<SectionId, string> = {
  // Not arranged: at 0 HP it stands above the rest of the sheet.
  'death-saves': 'Death saves',
  // The Journal's only, first and not arranged.
  turn: 'On your turn',
  'quick-bar': 'Quick bar',
  attacks: 'Attacks',
  abilities: 'Abilities and saves',
  skills: 'Skills',
  spells: 'Spells',
  conditions: 'Conditions and effects',
  resources: 'Class resources',
  rest: 'Rest',
  inventory: 'Inventory',
  features: 'Features and traits',
  dice: 'Dice',
  rolls: 'Rolls',
  'scratch-pad': 'Scratch pad',
}

// Each section's short name, where its full one will not fit: lettered down
// its tab in the Journal's thumb index, and the folded band's running head
// (ThumbIndex.tsx, Hud.tsx). A word of the section's own name, so the word a
// tab shows is in the name a screen reader says for it (WCAG 2.5.3); two
// where one alone would not say which section it is.
export const SECTION_SHORT: Record<SectionId, string> = {
  'death-saves': 'Death saves',
  turn: 'Turn',
  'quick-bar': 'Quick bar',
  attacks: 'Attacks',
  abilities: 'Abilities',
  skills: 'Skills',
  spells: 'Spells',
  conditions: 'Conditions',
  resources: 'Resources',
  rest: 'Rest',
  inventory: 'Inventory',
  features: 'Features',
  dice: 'Dice',
  rolls: 'Rolls',
  'scratch-pad': 'Scratch pad',
}

// Always on the sheet: what is rolled or tapped in play.
const ALWAYS: readonly SectionId[] = ['attacks', 'abilities', 'skills', 'spells', 'conditions', 'resources', 'rest']

// Opened from the menu unless pinned, in this order: the spec §3.3's menus,
// read now and then. Dice just before Rolls, the roller beside its log.
const MENUS: readonly SectionId[] = ['quick-bar', 'inventory', 'features', 'dice', 'rolls', 'scratch-pad']

// The sheet's order, pinned menus included.
const ORDER: readonly SectionId[] = ['quick-bar', 'attacks', 'abilities', 'skills', 'spells', 'conditions', 'resources', 'rest', 'inventory', 'features', 'dice', 'rolls', 'scratch-pad']

// What the player has pinned (true) or sent back to the menu (false), by
// section; a section with no choice is where pinnedByDefault puts it.
export type Pins = Readonly<Partial<Record<string, boolean>>>

export interface SheetLayout {
  // The sections on the sheet, top to bottom, pinned menus included.
  sheet: SectionId[]
  // The menus the menu opens, less those pinned to the sheet.
  menus: SectionId[]
}

// Where a menu is before the player pins or unpins it. The quick bar starts
// pinned; every other menu starts in the menu, though M2's companions may
// start pinned once there is one, as Crawler Interface's pets did.
const PINNED_MENUS: readonly SectionId[] = ['quick-bar']
export const pinnedByDefault = (id: SectionId, look: LayoutLook = 'classic'): boolean => !menusIn(look).includes(id) || PINNED_MENUS.includes(id)

export type LayoutLook = 'classic' | 'journal'

// The Journal's sheet holds Attacks in the turn, so Attacks is its first menu.
const alwaysIn = (look: LayoutLook): readonly SectionId[] => (look === 'journal' ? ALWAYS.filter((id) => id !== 'attacks') : ALWAYS)
const menusIn = (look: LayoutLook): readonly SectionId[] => (look === 'journal' ? ['attacks', ...MENUS.filter((id) => id !== 'quick-bar')] : MENUS)

const pinnedHere = (id: SectionId, pins: Pins, look: LayoutLook): boolean => pins[id] ?? pinnedByDefault(id, look)

// `order` is the player's arrangement as stored (components/sheet-order.ts);
// none is the sheet's own order.
export function sheetLayout(pins: Pins, order: readonly string[] = [], look: LayoutLook = 'classic'): SheetLayout {
  const always = alwaysIn(look)
  const menus = menusIn(look)
  const arranged = fullOrder(order).filter((id) => always.includes(id) || (menus.includes(id) && pinnedHere(id, pins, look)))
  return {
    sheet: look === 'journal' ? ['turn', ...arranged] : arranged,
    menus: menus.filter((id) => !pinnedHere(id, pins, look)),
  }
}

const isSection = (id: string): id is SectionId => (ORDER as readonly string[]).includes(id)

// The player's arrangement made whole. It is stored as the place of every
// section, those off the sheet included, so a menu unpinned keeps its place
// for when it is pinned again, and one never placed sits where ORDER puts it.
// Names it does not know are dropped, each name counts once, and a section it
// lacks goes back after the one ORDER has before it.
export function fullOrder(stored: readonly string[]): SectionId[] {
  const out: SectionId[] = []
  for (const id of stored) if (isSection(id) && !out.includes(id)) out.push(id)
  ORDER.forEach((id, i) => {
    if (out.includes(id)) return
    let at = 0
    for (let j = i - 1; j >= 0; j--) {
      const k = out.indexOf(ORDER[j])
      if (k >= 0) {
        at = k + 1
        break
      }
    }
    out.splice(at, 0, id)
  })
  return out
}

// Whether an arrangement leaves the sheet in its own order, when there is
// nothing to put back.
export const isOwnOrder = (stored: readonly string[]): boolean => fullOrder(stored).every((id, i) => id === ORDER[i])

// One section moved a place up (-1) or down (1) the sheet: past the section
// the sheet shows next to it, every section off the sheet keeping its place.
// `sheet` is what the sheet shows, top to bottom. Nothing moves past an end.
export function moveSection(stored: readonly string[], sheet: readonly SectionId[], id: SectionId, by: -1 | 1): SectionId[] {
  const order = fullOrder(stored)
  const at = sheet.indexOf(id)
  const neighbour = at < 0 ? undefined : sheet[at + by]
  if (neighbour === undefined) return order
  const next = order.filter((x) => x !== id)
  const k = next.indexOf(neighbour)
  next.splice(by < 0 ? k : k + 1, 0, id)
  return next
}

// Whether a section on the sheet is a pinned menu, whose PINNED sends it back
// to the menu.
export const isPinned = (id: SectionId, pins: Pins, look: LayoutLook = 'classic'): boolean => menusIn(look).includes(id) && pinnedHere(id, pins, look)

// Whether the player can move a section on the sheet: all but the turn.
export const arrangeable = (id: SectionId): boolean => id !== 'turn'

// The Journal's thumb index (ThumbIndex.tsx, the sheet concept, user
// 2026-10-23): a tab for each section the sheet shows, in the sheet's order,
// so a pinned menu gets one, and the death saves first while they stand
// above the sheet at 0 HP. `sheet` is sheetLayout's. Classic has no index.
export const indexSections = (sheet: readonly SectionId[], look: LayoutLook, deathSaves: boolean): SectionId[] =>
  look === 'journal' ? [...(deathSaves ? (['death-saves'] as const) : []), ...sheet] : []
