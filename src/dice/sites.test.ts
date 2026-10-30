// Every roll on the app's screens shows its dice (the dice roll, approved by
// the user 2026-10-14), and every roll made in play goes in the Rolls log,
// so a roll site added later can do neither silently: each call that rolls
// is followed within a few lines by showDice and by its record.

import { describe, expect, it } from 'vitest'

const sources = import.meta.glob(['../components/*.tsx', '../screens/*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

// The calls that roll dice (roll.ts, free-roll.ts, play/play.ts).
const ROLLS = /\b(rollDie|rollFaces|rollPool|rollD20)\(/
const WITHIN = 12

const sites = Object.entries(sources).flatMap(([file, text]) => {
  const lines = text.split(/\r?\n/)
  return lines.flatMap((line, i) => {
    if (!ROLLS.test(line)) return []
    const after = lines.slice(i, i + WITHIN)
    return [{ file, at: `${file}:${i + 1}`, shown: after.some((l) => /\bshowDice\(/.test(l)), recorded: after.some((l) => /\brecord\(/.test(l)) }]
  })
})

describe('every roll on the app’s screens', () => {
  it('is found: every roll site on the screens, by file', () => {
    // A glob that matched nothing would pass the tests below with no sites.
    expect(sites.map((s) => s.file.split('/').pop()).toSorted()).toEqual(['Attacks.tsx', 'BuildScreen.tsx', 'Dice.tsx', 'Health.tsx', 'LevelsScreen.tsx', 'LevelsScreen.tsx', 'QuickRoll.tsx', 'Resources.tsx', 'RuleCard.tsx', 'Spells.tsx'])
  })

  it('shows its dice', () => {
    expect(sites.filter((s) => !s.shown).map((s) => s.at)).toEqual([])
  })

  it('goes in the Rolls log', () => {
    expect(sites.filter((s) => !s.recorded).map((s) => s.at)).toEqual([])
  })
})

// What each d20 is rolled for (the dice total concept, user 2026-10-23): an
// attack roll's natural 20 or 1 says the rules' result, so every quick roll
// that rolls an attack says so, and nothing else does; the death save's d20
// is described as one.
const quickRolls = Object.entries(sources).flatMap(([file, text]) =>
  [...text.matchAll(/<QuickRoll\b[\s\S]*?\/>/g)].map((m) => ({ file: file.split('/').pop(), tag: m[0] })),
)
const ATTACK = /to hit|Opportunity Attack|spell attack/

describe('what each d20 is rolled for', () => {
  it('is found: every quick roll on the screens', () => {
    expect(quickRolls.map((q) => q.file).toSorted()).toEqual(['Abilities.tsx', 'Attacks.tsx', 'Health.tsx', 'PlayView.tsx', 'QuickBar.tsx', 'Reactions.tsx', 'Skills.tsx', 'Spells.tsx', 'Turn.tsx', 'Turn.tsx'])
  })

  it('marks every quick roll of an attack as one, and no other', () => {
    expect(quickRolls.filter((q) => ATTACK.test(q.tag) !== /\sattack[\s/]/.test(q.tag)).map((q) => `${q.file}: ${q.tag}`)).toEqual([])
    expect(quickRolls.filter((q) => /\sattack[\s/]/.test(q.tag)).map((q) => q.file).toSorted()).toEqual(['Attacks.tsx', 'QuickBar.tsx', 'Reactions.tsx', 'Spells.tsx', 'Turn.tsx'])
  })

  it('describes the death saving throw’s d20 as one', () => {
    expect(sources['../components/Health.tsx']).toMatch(/describeCheck\('Death saving throw', \{ flat: t\.total, dice: \['d20'\] \}, mode, rolled, 'death-save'\)/)
  })

  it('passes the quick roll’s kind and crit range on to its description', () => {
    expect(sources['../components/QuickRoll.tsx']).toMatch(/describeCheck\(name, check, mode, r, attack \? 'attack' : 'other', critMin\)/)
  })

  // Improved Critical is for weapons and Unarmed Strikes (SRD p.49), so a
  // weapon attack's roll takes the sheet's crit range and a spell attack's
  // none (#13).
  it('gives every weapon attack’s quick roll the sheet’s crit range, and a spell attack none', () => {
    const weapon = quickRolls.filter((q) => /to hit|Opportunity Attack/.test(q.tag))
    expect(weapon.filter((q) => !/\scritMin=\{sheet\.critMin\}\s/.test(q.tag)).map((q) => `${q.file}: ${q.tag}`)).toEqual([])
    expect(quickRolls.filter((q) => /critMin=/.test(q.tag)).map((q) => q.file).toSorted()).toEqual(['Attacks.tsx', 'QuickBar.tsx', 'Reactions.tsx', 'Turn.tsx'])
  })
})
