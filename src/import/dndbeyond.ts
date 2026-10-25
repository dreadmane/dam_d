// Reading the character sheet D&D Beyond exports as a PDF (spec §7.2): its
// named fields, as pdf-fields.ts reads them, into one plain record of what
// the sheet says. Nothing here knows the rules: names stay as the sheet
// prints them, and to-character.ts looks them up.
//
// The field names are the classic printed sheet's (CharacterName, STR,
// AcrobaticsProf) plus D&D Beyond's own (spellName0 to spellNameN, Eq Name0
// to Eq NameN), measured on a real export on 2026-10-24
// (apps/d-amp-d/notes/2026-10-24-character-import in the workspace). Some
// names carry a trailing space ("DEXmod ", "Stealth "), so names are
// trimmed. The overflow pages repeat names with other values, so fields
// are read per page, in page order.
//
// The sheet's prose (feature, action and spell descriptions) is the books'
// text and is never kept: only names, numbers and the player's own words
// (the details page) come out of here.

import type { Ability } from '../rules/expr.ts'
import type { PdfField } from './pdf-fields.ts'

export interface DdbFeature {
  // The section's heading as printed: "CLERIC FEATURES", "FEATS".
  section: string
  // "Ability Score Improvement", with a class level printed before it
  // ("8: Ability Score Improvement") moved to level.
  name: string
  level?: number
  // Where D&D Beyond says it is printed: "PHB-2024 70", "AU 8".
  source: string
  // The options picked under it ("Protector", "Arcana Domain"), without the
  // uses and actions the sheet also lists there.
  choices: string[]
}

export interface DdbItem {
  name: string
  quantity: number
  // Pounds each, where the sheet gives a weight ("--" is none).
  weight: number | null
}

export interface DdbSpell {
  name: string
  // 0 for a cantrip.
  level: number
  // What it comes from, as printed: "Cleric", "Cleric (Always Prepared)",
  // "Driftglobe".
  source: string
  // The sheet's mark: P is always prepared; O is an empty circle, which is
  // how every other spell on the class's list is printed.
  mark: string
  // Where D&D Beyond says it is printed: "PHB-2024 282".
  book: string
  ritual: boolean
}

export interface DdbSheet {
  name: string
  // In the order the sheet prints them.
  classes: { name: string; level: number }[]
  species: string
  background: string
  milestone: boolean
  xp: number
  alignment: string
  details: { label: string; text: string }[]
  scores: Record<Ability, number | null>
  saveProficient: Record<Ability, boolean>
  // Each skill as printed, with its mark: P proficient, E expertise.
  skills: { name: string; mark: string }[]
  features: DdbFeature[]
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[] }
  items: DdbItem[]
  attuned: string[]
  // The attack lines, which say what a weapon the player named is: its
  // damage ("1d8+7 Slashing") and properties ("Martial, Versatile, Sap").
  attacks: { name: string; bonus: number | null; damage: string; notes: string }[]
  coins: { cp: number; sp: number; ep: number; gp: number; pp: number }
  spells: DdbSpell[]
  // The hit points the character is at: a current HP is printed only when
  // it is set (an empty field is full), a temporary one as "--" when none.
  hitPoints: { current: number | null; temp: number }
  heroicInspiration: boolean
  // What the sheet worked out, for the check against dam’d's own figures.
  printed: {
    ac: number | null
    maxHp: number | null
    proficiency: number | null
    initiative: number | null
    speed: string
    passivePerception: number | null
    saves: Record<Ability, number | null>
    spellcasting: { className: string; ability: string; saveDc: number | null; attack: number | null }[]
  }
}

const ABILITY_FIELDS: Record<Ability, { score: string; save: string; prof: string }> = {
  str: { score: 'STR', save: 'ST Strength', prof: 'StrProf' },
  dex: { score: 'DEX', save: 'ST Dexterity', prof: 'DexProf' },
  con: { score: 'CON', save: 'ST Constitution', prof: 'ConProf' },
  int: { score: 'INT', save: 'ST Intelligence', prof: 'IntProf' },
  wis: { score: 'WIS', save: 'ST Wisdom', prof: 'WisProf' },
  cha: { score: 'CHA', save: 'ST Charisma', prof: 'ChaProf' },
}

// Each skill's name as the rules print it, beside the sheet's two field
// names for it, which don't always agree with each other.
const SKILL_FIELDS: [name: string, mark: string][] = [
  ['Acrobatics', 'AcrobaticsProf'],
  ['Animal Handling', 'AnimalHandlingProf'],
  ['Arcana', 'ArcanaProf'],
  ['Athletics', 'AthleticsProf'],
  ['Deception', 'DeceptionProf'],
  ['History', 'HistoryProf'],
  ['Insight', 'InsightProf'],
  ['Intimidation', 'IntimidationProf'],
  ['Investigation', 'InvestigationProf'],
  ['Medicine', 'MedicineProf'],
  ['Nature', 'NatureProf'],
  ['Perception', 'PerceptionProf'],
  ['Performance', 'PerformanceProf'],
  ['Persuasion', 'PersuasionProf'],
  ['Religion', 'ReligionProf'],
  ['Sleight of Hand', 'SleightOfHandProf'],
  ['Stealth', 'StealthProf'],
  ['Survival', 'SurvivalProf'],
]

// The details page's fields, in the order they are kept: the player's own
// words, which go to the character's appearance and notes.
const DETAIL_FIELDS: [label: string, field: string][] = [
  ['Gender', 'GENDER'],
  ['Age', 'AGE'],
  ['Height', 'HEIGHT'],
  ['Weight', 'WEIGHT'],
  ['Eyes', 'EYES'],
  ['Skin', 'SKIN'],
  ['Hair', 'HAIR'],
  ['Faith', 'FAITH'],
  ['Appearance', 'Appearance'],
  ['Personality traits', 'PersonalityTraits'],
  ['Ideals', 'Ideals'],
  ['Bonds', 'Bonds'],
  ['Flaws', 'Flaws'],
  ['Allies and organizations', 'AlliesOrganizations'],
  ['Backstory', 'Backstory'],
]

const LEVEL_WORDS: Record<string, number> = { CANTRIPS: 0 }

// "+7", "-1", "23" as a number; "--", "" or words as null.
export function numberIn(text: string | undefined): number | null {
  const m = text?.trim().match(/^[+-]?\d+/)
  return m ? Number(m[0]) : null
}

// The fields of one page, by trimmed name; the first of a repeated name wins.
type Page = Map<string, string>

function pagesOf(fields: PdfField[]): Page[] {
  const pages: Page[] = []
  for (const f of fields) {
    const page = (pages[f.page - 1] ??= new Map())
    const name = f.name.trim()
    if (!page.has(name)) page.set(name, f.value)
  }
  return pages.filter(Boolean)
}

// A D&D Beyond sheet, or null when the fields aren't one: the first page's
// name and class line are what every export has.
export function readDndBeyondSheet(fields: PdfField[]): DdbSheet | null {
  const pages = pagesOf(fields)
  const first = pages.find((p) => p.has('CharacterName') && p.has('CLASS  LEVEL'))
  if (!first) return null
  // A field anywhere, by its exact name.
  const any = (name: string) => pages.find((p) => p.get(name)?.trim())?.get(name)?.trim() ?? ''
  const get = (name: string) => first.get(name)?.trim() ?? ''

  const scores = {} as DdbSheet['scores']
  const saveProficient = {} as DdbSheet['saveProficient']
  const saves = {} as DdbSheet['printed']['saves']
  for (const [a, f] of Object.entries(ABILITY_FIELDS) as [Ability, (typeof ABILITY_FIELDS)[Ability]][]) {
    scores[a] = numberIn(get(f.score))
    // The save's mark is a bullet when proficient, empty when not.
    saveProficient[a] = get(f.prof) !== ''
    saves[a] = numberIn(get(f.save))
  }

  const xpText = get('EXPERIENCE POINTS')
  return {
    name: get('CharacterName'),
    classes: classesIn(get('CLASS  LEVEL')),
    species: get('RACE'),
    background: get('BACKGROUND'),
    milestone: /milestone/i.test(xpText),
    xp: numberIn(xpText.replace(/,/g, '')) ?? 0,
    alignment: any('ALIGNMENT'),
    details: DETAIL_FIELDS.map(([label, field]) => ({ label, text: any(field) })).filter((d) => d.text),
    scores,
    saveProficient,
    skills: SKILL_FIELDS.map(([name, mark]) => ({ name, mark: get(mark) })),
    features: featuresIn(joined(fields, /^FeaturesTraits\d+$/)),
    proficiencies: proficienciesIn(get('ProficienciesLang')),
    ...itemsIn(pages),
    attacks: attacksIn(first),
    coins: { cp: numberIn(any('CP')) ?? 0, sp: numberIn(any('SP')) ?? 0, ep: numberIn(any('EP')) ?? 0, gp: numberIn(any('GP')) ?? 0, pp: numberIn(any('PP')) ?? 0 },
    spells: spellsIn(fields),
    hitPoints: { current: numberIn(get('CurrentHP')), temp: numberIn(get('TempHP')) ?? 0 },
    heroicInspiration: !['', 'Off'].includes(get('Inspiration')),
    printed: {
      ac: numberIn(get('AC')),
      maxHp: numberIn(get('MaxHP')),
      proficiency: numberIn(get('ProfBonus')),
      initiative: numberIn(get('Init')),
      speed: get('Speed'),
      passivePerception: numberIn(get('Passive1')),
      saves,
      spellcasting: spellcastingIn(pages),
    },
  }
}

// "Monk 1 / Cleric 14" as each class and its level, in the printed order.
export function classesIn(line: string): DdbSheet['classes'] {
  return line
    .split('/')
    .map((part) => part.trim().match(/^(.*\S)\s+(\d+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ name: m[1], level: Number(m[2]) }))
}

// A long text the sheet splits across numbered fields, whole again. The
// sheet breaks it between lines, so the pieces join with a line break.
function joined(fields: PdfField[], name: RegExp): string {
  return fields
    .filter((f) => name.test(f.name.trim()) && f.value.trim())
    .map((f) => f.value.replace(/\r\n?/g, '\n').replace(/\n+$/, ''))
    .join('\n')
}

// The features text: "=== CLERIC FEATURES ===" opens a section, "* Name •
// SOURCE page" a feature, and "| Option" lines under it name what was
// picked. Other "|" lines are its uses and actions ("| 3 / Long Rest • 1
// Action", "| Channel Divinity: Divine Spark: 1 Action"), and the rest is
// the books' description, which is skipped.
export function featuresIn(text: string): DdbFeature[] {
  const features: DdbFeature[] = []
  let section = ''
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^===\s*(.*?)\s*===$/)
    if (heading) {
      section = heading[1]
      continue
    }
    const feature = line.match(/^\*\s+(?:(\d+):\s*)?(.*?)\s*(?:•\s*(.*))?$/)
    if (feature) {
      features.push({ section, name: feature[2], ...(feature[1] ? { level: Number(feature[1]) } : {}), source: feature[3]?.trim() ?? '', choices: [] })
      continue
    }
    const option = line.match(/^\|\s*(.*?)\s*(?:•\s*(.*))?$/)
    const current = features.at(-1)
    if (option && current) {
      const [, name, after = ''] = option
      // A use ("3 / Long Rest") or an action ("Name: 1 Action") isn't a pick.
      const isUse = /\d+\s*\/\s*(Long|Short) Rest/i.test(name) || name.includes(':') || /Action|Reaction|Special/.test(after)
      if (name && !isUse) current.choices.push(name)
    }
  }
  return features
}

// "=== ARMOR ===\nLight Armor, Shields\n\n=== WEAPONS ===\n…" as lists.
export function proficienciesIn(text: string): DdbSheet['proficiencies'] {
  const out: DdbSheet['proficiencies'] = { armor: [], weapons: [], tools: [], languages: [] }
  let into: string[] | null = null
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^===\s*(.*?)\s*===$/)
    if (heading) {
      const key = heading[1].toLowerCase() as keyof typeof out
      into = out[key] ?? null
      continue
    }
    if (into && line) into.push(...line.split(',').map((s) => s.trim()).filter(Boolean))
  }
  return out
}

// The equipment rows (page 2, then the overflow pages) and the attuned list.
// A row's name, quantity and weight share its number on its own page.
function itemsIn(pages: Page[]): { items: DdbItem[]; attuned: string[] } {
  const items: DdbItem[] = []
  const attuned: string[] = []
  for (const page of pages) {
    for (const [name, value] of page) {
      const row = name.match(/^Eq Name(\d+)$/)
      if (row && value.trim()) {
        const weight = page.get(`Eq Weight${row[1]}`)?.trim() ?? ''
        items.push({ name: value.trim(), quantity: numberIn(page.get(`Eq Qty${row[1]}`)) ?? 1, weight: /^\d/.test(weight) ? parseFloat(weight) : null })
      }
      if (/^Attuned Name\d+$/.test(name) && value.trim()) attuned.push(value.trim())
    }
  }
  return { items, attuned }
}

// The attack lines on the first page: row 1's name field is "Wpn Name",
// the others "Wpn Name 2" and on; their numbers sit in "Wpn2 Damage" and
// "Wpn Notes 2".
function attacksIn(page: Page): DdbSheet['attacks'] {
  const out: DdbSheet['attacks'] = []
  for (let row = 1; page.has(row === 1 ? 'Wpn Name' : `Wpn Name ${row}`); row++) {
    const name = page.get(row === 1 ? 'Wpn Name' : `Wpn Name ${row}`)?.trim() ?? ''
    if (name) out.push({ name, bonus: numberIn(page.get(`Wpn${row} AtkBonus`)), damage: page.get(`Wpn${row} Damage`)?.trim() ?? '', notes: page.get(`Wpn Notes ${row}`)?.trim() ?? '' })
  }
  return out
}

// The spell pages, in field order: each level's header comes before its
// rows, so a row takes the level of the header above it. A row's cells
// share its number on its page.
function spellsIn(fields: PdfField[]): DdbSpell[] {
  const rows = new Map<string, { level: number; cells: Partial<Record<string, string>> }>()
  let level = 0
  for (const f of fields) {
    const name = f.name.trim()
    const header = /^spellHeader\d+$/.test(name) ? f.value.match(/===\s*(.*?)\s*===/) : null
    if (header) {
      level = LEVEL_WORDS[header[1].toUpperCase()] ?? numberIn(header[1]) ?? level
      continue
    }
    const cell = name.match(/^spell(Prepared|Name|Source|Page)(\d+)$/)
    if (!cell) continue
    const key = `${f.page}:${cell[2]}`
    const row = rows.get(key) ?? { level, cells: {} }
    rows.set(key, row)
    row.cells[cell[1]] = f.value.trim()
  }
  return [...rows.values()]
    .filter((r) => r.cells.Name)
    .map(({ level, cells }) => ({
      name: cells.Name!.replace(/\s*\[R\]$/, ''),
      level,
      source: cells.Source ?? '',
      mark: cells.Prepared ?? '',
      book: cells.Page ?? '',
      ritual: /\[R\]$/.test(cells.Name!),
    }))
}

// Each spellcasting class the spell pages head with its ability, DC and
// attack, once each.
function spellcastingIn(pages: Page[]): DdbSheet['printed']['spellcasting'] {
  const seen = new Set<string>()
  const out: DdbSheet['printed']['spellcasting'] = []
  for (const page of pages) {
    for (const [name, value] of page) {
      const m = name.match(/^spellCastingClass(\d+)$/)
      if (!m || !value.trim() || seen.has(value.trim())) continue
      seen.add(value.trim())
      out.push({ className: value.trim(), ability: page.get(`spellCastingAbility${m[1]}`)?.trim() ?? '', saveDc: numberIn(page.get(`spellSaveDC${m[1]}`)), attack: numberIn(page.get(`spellAtkBonus${m[1]}`)) })
    }
  }
  return out
}
