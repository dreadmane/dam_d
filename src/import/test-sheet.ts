// A D&D Beyond sheet for tests only, as the fields its PDF holds: Brynn, a
// Cleric 5 / Fighter 2 on SRD records, with one of everything the import
// meets on a real sheet (measured on one on 2026-10-24): a class order the
// saving throws give, a species the rules lack, a feat at a class level, a
// feature's pick, the whole Cleric list printed with one spell marked, an
// always-prepared spell, a spell under D&D Beyond's older name, items found,
// renamed, attuned and custom, a field name with a trailing space, and the
// overflow page reusing the equipment rows' names. The prose a real sheet
// carries is left out: none is read.

import type { PdfField } from './pdf-fields.ts'

const FEATURES = [
  '=== CLERIC FEATURES ===',
  '* Divine Order • PHB-2024 70',
  '   | Thaumaturge •',
  '* Channel Divinity • PHB-2024 70',
  '   | 2 / Long Rest • 1 Action',
  '   | Channel Divinity: Turn Undead: 1 Action',
  '* Cleric Subclass • PHB-2024 71',
  '   | Life Domain',
  '* Ability Score Improvement • PHB-2024 71',
  '=== FIGHTER FEATURES ===',
  '* Fighting Style • PHB-2024 91',
  '| Defense •',
  '* Second Wind • PHB-2024 91',
  // The class levels' feats, then the background's, as on the real export.
  '=== FEATS ===',
  '* Grappler • PHB-2024 205',
  '* Magic Initiate • PHB-2024 203',
  '* Acolyte Ability Score Improvements • PHB-2024 178',
  '   | Increase two scores (+2 / +1) •',
]

// Each spell row: name, source, mark, page ref; under its level's header.
const SPELLS: [level: string, rows: [string, string, string][]][] = [
  ['CANTRIPS', [['Guidance', 'Cleric', 'O'], ['Sacred Flame', 'Cleric', 'O'], ['Thaumaturgy', 'Cleric', 'O'], ['Moment to Think', 'Cleric', 'O']]],
  [
    '1st LEVEL',
    [
      ['Bless', 'Cleric', '●'],
      ['Cure Wounds', 'Cleric (Always Prepared)', 'P'],
      ['Command', 'Cleric', 'O'],
      ['Detect Magic [R]', 'Cleric', 'O'],
      ['Guiding Bolt', 'Cleric', 'O'],
      ['Healing Word', 'Cleric', 'O'],
      ['Inflict Wounds', 'Cleric', 'O'],
      ['Sanctuary', 'Cleric', 'O'],
      ['Shield of Faith', 'Cleric', 'O'],
    ],
  ],
  ['2nd LEVEL', [['Aid', 'Cleric', 'O'], ['Nystul’s Magic Aura', 'Cleric', '●'], ['Hold Person', 'Cleric', 'O'], ['Silence [R]', 'Cleric', 'O']]],
  ['3rd LEVEL', [['Revivify', 'Cleric', 'O'], ['Spirit Guardians', 'Cleric', 'O']]],
]

export function brynnFields(): PdfField[] {
  const f: PdfField[] = []
  const on = (page: number, name: string, value = '') => f.push({ page, name, value })
  const head = (page: number, suffix = '') => {
    on(page, `CharacterName${suffix}`, 'Brynn')
    on(page, `CLASS  LEVEL${suffix}`, 'Fighter 2 / Cleric 5')
    on(page, `RACE${suffix}`, 'Locathah')
    on(page, `BACKGROUND${suffix}`, 'Acolyte')
    on(page, `EXPERIENCE POINTS${suffix}`, '(Milestone)')
  }
  head(1)
  const scores: [string, string, string, string][] = [
    ['STR', '14', 'StrProf', ''],
    ['DEX', '13', 'DexProf', ''],
    ['CON', '14', 'ConProf', ''],
    ['INT', '10', 'IntProf', ''],
    ['WIS', '17', 'WisProf', '•'],
    ['CHA', '11', 'ChaProf', '•'],
  ]
  for (const [score, value, prof, mark] of scores) {
    on(1, score, value)
    on(1, prof, mark)
  }
  on(1, 'DEXmod ', '+1')
  for (const [skill, mark] of [
    ['InsightProf', 'P'],
    ['ReligionProf', 'P'],
    ['HistoryProf', 'P'],
    ['MedicineProf', 'P'],
    ['StealthProf', ''],
  ])
    on(1, skill, mark)
  on(1, 'Stealth ', '+1')
  // Chain Mail 16, a Shield 2, and Defense's 1 in armor.
  on(1, 'AC', '19')
  on(1, 'Init', '+1')
  on(1, 'ProfBonus', '+3')
  on(1, 'Speed', '30 ft. (Walking), 30 ft. (Swimming)')
  on(1, 'MaxHP', '54')
  on(1, 'TempHP', '--')
  on(1, 'Passive1', '13')
  on(1, 'ProficienciesLang', '=== ARMOR === \nHeavy Armor, Light Armor\n\n=== TOOLS ===\nCalligrapher’s Supplies\n\n=== LANGUAGES ===\nCommon, Aquan')
  on(1, 'Inspiration')
  // The attack lines, under the sheet's own field names (the first row's
  // name has no number; some names end in spaces).
  const attacks: [string, string, string, string][] = [
    ['*Old Faithful', '+5', '1d8+2 Slashing', 'Martial, Versatile, Sap'],
    ['Sun Blade', '+7', '1d8+4 Radiant', '+1d8 Radiant, Martial, Versatile, Sap, Finesse'],
    ['*Odd Tome', '+3', '1d6+1 Piercing', 'Simple, Finesse, Light, Thrown, Nick, Range (20/60)'],
  ]
  attacks.forEach(([name, bonus, damage, notes], i) => {
    on(1, i ? `Wpn Name ${i + 1}` : 'Wpn Name', name)
    on(1, `Wpn${i + 1} AtkBonus `, bonus)
    on(1, `Wpn${i + 1} Damage `, damage)
    on(1, `Wpn Notes ${i + 1}`, notes)
  })

  head(2, '2')
  // The features text, split across fields between lines, as the sheet does.
  on(2, 'FeaturesTraits1', FEATURES.slice(0, 9).join('\n'))
  on(2, 'FeaturesTraits2', FEATURES.slice(9).join('\n'))
  on(2, 'GP', '15')
  on(2, 'CP', '0')
  const items: [string, string, string][] = [
    ['Chain Mail', '1', '55 lb.'],
    ['Shield', '1', '6 lb.'],
    ['Bracers of Defense +1, Clamshell', '1', '--'],
    ['Traveler’s Clothes', '1', '4 lb.'],
    // A weapon named by its last word; a magic weapon with a base; a
    // homebrew one its attack line makes a Longsword; and one no weapon fits.
    ['Hearthguard Longsword, w/Ward', '1', '3 lb.'],
    ['Sun Blade', '1', '3 lb.'],
    ['*Old Faithful', '1', '3 lb.'],
    ['*Odd Tome', '1', '1 lb.'],
  ]
  items.forEach(([name, qty, weight], i) => {
    on(2, `Eq Name${i}`, name)
    on(2, `Eq Qty${i}`, qty)
    on(2, `Eq Weight${i}`, weight)
  })
  on(2, 'Attuned Name1', 'Bracers of Defense +1, Clamshell')

  // The overflow pages: page 3's rows empty, page 4's under the same names.
  head(3, '3')
  on(3, 'Eq Name26')
  on(3, 'Eq Qty26')
  head(4, '3')
  on(4, 'Eq Name26', '*Mystery Pearl')
  on(4, 'Eq Qty26', '3')
  on(4, 'Eq Weight26', '0.5 lb.')

  on(5, 'ALIGNMENT', 'Lawful Good')
  on(5, 'EYES', 'Grey')
  on(5, 'Backstory', 'Raised in a lighthouse.')

  on(6, 'spellCastingClass0', 'Cleric')
  on(6, 'spellCastingAbility0', 'WIS')
  on(6, 'spellSaveDC0', '14')
  on(6, 'spellAtkBonus0', '+6')
  let row = 0
  SPELLS.forEach(([level, rows], i) => {
    on(6, `spellHeader${i}`, `=== ${level} ===`)
    for (const [name, source, mark] of rows) {
      on(6, `spellPrepared${row}`, mark)
      on(6, `spellName${row}`, name)
      on(6, `spellSource${row}`, source)
      on(6, `spellPage${row}`, 'PHB-2024 1')
      row++
    }
  })
  return f
}
