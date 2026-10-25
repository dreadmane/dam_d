// The Handbook's register (voice.ts, the spec §6.1): each voiced line reads
// right for any character, keeps every fact of the plain line it replaced,
// and a level gained is told from the rules data, as Level up's rung lists it.

import { describe, expect, it } from 'vitest'
import { levelUp } from './play/ladder.ts'
import { deriveSheet } from './rules/derive.ts'
import { levelGrants } from './rules/level.ts'
import { testRules } from './rules/test-rules.ts'
import cleric from './save/examples/cleric-fighter.json'
import wizard from './save/examples/wizard.json'
import type { CharacterEntity } from './save/types.ts'
import { bringsOf, buildFinishedLine, importedLine, INVENTORY_EMPTY, levelGained, LONG_REST_NOTHING, ROSTER_EMPTY, stableAside, who } from './voice.ts'

const rules = testRules()
const entity = (record: { entities: unknown[] }) => structuredClone(record.entities[0]) as CharacterEntity

// The notice Add level files, made as LevelUpRung makes it: the grant of
// the class's next level, and the sheet after the level at the fixed HP.
function gained(e: CharacterEntity, classId: string) {
  const held = e.classes.map((c) => c.classId)
  const before = deriveSheet(rules, e)
  const classLevel = (e.classes.find((c) => c.classId === classId)?.level ?? 0) + 1
  const grant = levelGrants(rules, classId, classLevel, { subclassId: e.classes.find((c) => c.classId === classId)?.subclassId, first: held[0] === classId || held.length === 0 })
  const after = deriveSheet(rules, levelUp(e, classId, { method: 'fixed' }))
  const notice = levelGained({ name: e.name, level: before.level + 1, className: rules.classes.get(classId)!.name, classLevel, brings: bringsOf(grant), maxHp: after.hp.max })
  return { notice, after: levelUp(e, classId, { method: 'fixed' }) }
}

describe('a level gained', () => {
  it('says the approved line for Ilsabet Vane’s Wizard 6, in the gold tier under a plain kicker', () => {
    expect(gained(entity(wizard), 'wizard').notice).toEqual({
      kicker: 'Level 6',
      tier: 'gold',
      lines: ['Ilsabet Vane reaches level 6. You gain Sculpt Spells; Max HP 38.'],
    })
  })

  it('says so when the level brings no new feature, and still gives Max HP', () => {
    const six = gained(entity(wizard), 'wizard').after
    expect(gained(six, 'wizard').notice.lines).toEqual(['Ilsabet Vane reaches level 7. This level brings no new feature; Max HP 44.'])
  })

  it('names the class on a multiclass level, and lists several features with the choices they bring', () => {
    expect(gained(entity(wizard), 'fighter').notice).toEqual({
      kicker: 'Level 6',
      tier: 'gold',
      lines: ['Ilsabet Vane reaches level 6 (Fighter 1). You gain Fighting Style, Second Wind, and Weapon Mastery, with 2 choices to make; Max HP 40.'],
    })
  })

  it('says a subclass is to be chosen, as the rung does', () => {
    const { notice } = gained(entity(cleric), 'fighter')
    expect(notice.kicker).toBe('Level 8')
    expect(notice.lines[0]).toMatch(/^Halvard Stoneward reaches level 8 \(Fighter 3\)\. You gain Fighter Subclass, with a subclass to choose; Max HP \d+\.$/)
  })

  it('reads right with no feature but something owed, and with both owed', () => {
    const base = { name: 'Ilsabet Vane', level: 4, className: 'Wizard', classLevel: 4, maxHp: 26 }
    expect(levelGained({ ...base, brings: { features: [], subclass: false, choices: 1 } }).lines).toEqual(['Ilsabet Vane reaches level 4. This level brings no new feature, but 1 choice to make; Max HP 26.'])
    expect(levelGained({ ...base, brings: { features: ['Wizard Subclass'], subclass: true, choices: 2 } }).lines).toEqual([
      'Ilsabet Vane reaches level 4. You gain Wizard Subclass, with a subclass to choose and 2 choices to make; Max HP 26.',
    ])
  })

  it('reads right for a character with no name yet', () => {
    expect(levelGained({ name: '  ', level: 2, className: 'Fighter', classLevel: 2, brings: { features: ['Action Surge'], subclass: false, choices: 0 }, maxHp: 20 }).lines).toEqual([
      'Your character reaches level 2. You gain Action Surge; Max HP 20.',
    ])
  })
})

describe('the quiet lines', () => {
  it('name the character, or say "your character" before there is a name', () => {
    expect(who(' Maren Holt ')).toBe('Maren Holt')
    expect(who('')).toBe('your character')
    expect(who('', { start: true })).toBe('Your character')
    expect(buildFinishedLine('Maren Holt')).toBe('Everything is chosen: Maren Holt is ready for adventure.')
    expect(buildFinishedLine('')).toBe('Everything is chosen: your character is ready for adventure.')
    expect(stableAside('Unga-Bunga')).toBe('Breathe easy: Unga-Bunga is holding on.')
    expect(stableAside('')).toBe('Breathe easy: your character is holding on.')
    expect(importedLine('Unga-Bunga')).toBe('Unga-Bunga is imported and ready to play.')
    expect(importedLine(' ')).toBe('An unnamed character is imported and ready to play.')
  })

  it('keep every fact of the plain lines they replaced', () => {
    // No characters saved in this browser yet. Start a new one, or import a .dnd.json file.
    expect(ROSTER_EMPTY).toContain('none are saved in this browser yet')
    expect(ROSTER_EMPTY).toContain('Start a new one, or import a .dnd.json file.')
    // Nothing to restore.
    expect(LONG_REST_NOTHING).toMatch(/^Nothing to restore/)
    // Nothing in the inventory yet.
    expect(INVENTORY_EMPTY).toMatch(/inventory is empty/)
    // Everything is chosen.
    expect(buildFinishedLine('Maren Holt')).toMatch(/^Everything is chosen/)
  })
})
