// The dice tray's markup (DiceTray.tsx TrayView; the dice total concept,
// direction B, user 2026-10-23): after the dice, the total in a seal, the
// damage's kind under it; after the seal, a natural's words; the tray
// marked with the moment (data-moment) and the d20 that counts with its face
// (data-natural); data-motion only where the app allows motion for the roll;
// --last, the last die's landing, on the tray. The tray stays hidden from a
// screen reader and holds nothing to tap: the roll site's own line is what
// one hears (DiceTray's dice-said, unchanged).

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { describeCheck, describePool, describeRoll, type DescribedRoll } from '../dice/describe.ts'
import { layoutDice } from '../dice/layout.ts'
import { delayOf, landsAfter } from '../dice/plan.ts'
import { TrayView, type TrayRoll } from './DiceTray.tsx'

const dagger = { flat: 5, dice: ['d20'] }
const shown = (roll: DescribedRoll, draw: TrayRoll['draw'] = 'dice'): TrayRoll => ({ ...roll, id: 7, draw, leaving: false })
function draw(roll: TrayRoll, { rolling = true } = {}) {
  const plan = roll.dice.map((_, i) => ({ delay: delayOf(i), decoys: [] }))
  return renderToStaticMarkup(
    <TrayView roll={roll} place="band" layout={layoutDice(roll.dice.length, 228, 116, null, true)} plan={plan} rolling={rolling} opening={false} motion={rolling} hint={false} sent={null} />,
  )
}
const tray = (html: string) => /^<div [^>]*>/.exec(html)![0]
// The tray's parts by class, in the order they are written.
const parts = (html: string) => [...html.matchAll(/class="(dice-tray-name|dice-row|tray-total|tray-seal|tray-total-value|tray-total-kind|tray-natural|dice-tray-line|tray-crack)"/g)].map((m) => m[1])

describe('the dice tray’s seal', () => {
  const attack = (faces: number[], kept: number, mode: 'normal' | 'advantage' | 'disadvantage' = 'normal') =>
    shown(describeCheck('Dagger, to hit', dagger, mode, { faces, kept, total: kept + 5 }, 'attack'))

  it('holds the total in a seal after the dice, the line along the foot', () => {
    const html = draw(attack([11], 11))
    expect(parts(html)).toEqual(['dice-tray-name', 'dice-row', 'tray-total', 'tray-seal', 'tray-total-value', 'dice-tray-line'])
    expect(html).toContain('<span class="tray-total"><span class="tray-seal"><span class="tray-total-value">16</span></span></span>')
    expect(html).toContain('<p class="dice-tray-line">d20 + 5 · Rolled 11: <strong>16</strong>.</p>')
  })

  it('splits the damage’s kind from its total, under the seal', () => {
    const damage = shown(describePool('Dagger, damage', '1d4 + 2 piercing', ['1d4'], { faces: [3], total: 5 }, '5 piercing'))
    expect(draw(damage)).toContain('<span class="tray-total-value">5</span></span><span class="tray-total-kind">piercing</span></span>')
  })

  it('has no seal for a roll with no total, nor with the dice off', () => {
    const stats = shown({ name: 'Stats', formula: '1d6', dice: [{ sides: 6, face: 4 }], line: 'Rolled 4.', bold: null })
    expect(draw(stats)).not.toContain('tray-total')
    const line = draw(shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [20], kept: 20, total: 25 }, 'attack'), 'line'))
    expect(parts(line)).toEqual(['dice-tray-name', 'dice-tray-line'])
    expect(tray(line)).not.toContain('data-moment')
  })

  // Found by the review (2026-10-23): a free roll of d100s totals three or
  // four digits, which at half the seal ran over the Journal's pressed ring.
  it('marks a total of three characters or more, for its numeral to step down', () => {
    const pool = (formula: string, faces: number[], total: number) => draw(shown(describePool('Free roll', formula, [formula], { faces, total })))
    expect(pool('2d100', [40, 59], 99)).toContain('<span class="tray-total-value">99</span>')
    expect(pool('2d100', [90, 90], 180)).toContain('<span class="tray-total-value" data-digits="3">180</span>')
    expect(pool('20d100', [...Array(19).fill(100), 80], 1980)).toContain('<span class="tray-total-value" data-digits="4">1980</span>')
    // A minus is a character of the numeral, as wide as a digit.
    expect(pool('1d4', [3], -12)).toContain('<span class="tray-total-value" data-digits="3">-12</span>')
  })

  it('stays hidden from a screen reader and holds nothing to tap', () => {
    const html = draw(attack([20], 20))
    expect(tray(html)).toContain('aria-hidden="true"')
    expect(html).not.toMatch(/<(button|a|input|select|textarea)\b|tabindex|role=/)
  })
})

describe('the moment', () => {
  it('marks an attack’s natural 20: the tray, the die, and the words after the seal', () => {
    const html = draw(shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [20], kept: 20, total: 25 }, 'attack')))
    expect(tray(html)).toContain('data-moment="20"')
    expect(html).toMatch(/<span class="die-cell" data-sides="20" data-rolling="true" data-natural="20"/)
    expect(parts(html)).toEqual(['dice-tray-name', 'dice-row', 'tray-total', 'tray-seal', 'tray-total-value', 'tray-natural', 'dice-tray-line'])
    expect(html).toContain('<p class="tray-natural">Natural 20 · Critical Hit</p>')
  })

  it('cracks the seal on a natural 1, the crack drawn under the numeral', () => {
    const html = draw(shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [1], kept: 1, total: 6 }, 'attack')))
    expect(tray(html)).toContain('data-moment="1"')
    expect(html).toContain('data-natural="1"')
    expect(parts(html)).toEqual(['dice-tray-name', 'dice-row', 'tray-total', 'tray-seal', 'tray-crack', 'tray-total-value', 'tray-natural', 'dice-tray-line'])
    expect(html).toContain('<path class="tray-crack-lip"')
    expect(html).toContain('<p class="tray-natural">Natural 1 · the attack misses</p>')
    // A 20 has no crack.
    expect(draw(shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [20], kept: 20, total: 25 }, 'attack')))).not.toContain('tray-crack')
  })

  it('says a death save’s words, its seal holding the d20’s face', () => {
    const html = draw(shown(describeRoll('Death saving throw', '1d20', { faces: [20], total: 20 }, 'death-save')))
    expect(html).toContain('<span class="tray-total-value">20</span>')
    expect(html).toContain('<p class="tray-natural">Natural 20 · you regain 1 Hit Point</p>')
    expect(draw(shown(describeRoll('Death saving throw', '1d20', { faces: [1], total: 1 }, 'death-save')))).toContain('<p class="tray-natural">Natural 1 · two failures</p>')
  })

  it('marks the kept 20 under Advantage alone, and nothing when Disadvantage drops it', () => {
    const save = (mode: 'advantage' | 'disadvantage', faces: number[], kept: number) => draw(shown(describeCheck('Dexterity save', { flat: 2, dice: ['d20'] }, mode, { faces, kept, total: kept + 2 })))
    const kept = save('advantage', [12, 20], 20)
    expect(kept.match(/data-natural="[^"]+"/g)).toEqual(['data-natural="20"'])
    expect(kept).toMatch(/data-dropped="true"(?![^>]*data-natural)/)
    expect(kept).toContain('<p class="tray-natural">Natural 20</p>')
    const dropped = save('disadvantage', [20, 12], 12)
    expect(dropped).not.toContain('data-natural')
    expect(tray(dropped)).not.toContain('data-moment')
    expect(dropped).not.toContain('tray-natural')
  })

  it('has none on an ordinary roll', () => {
    const html = draw(shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [11], kept: 11, total: 16 }, 'attack')))
    expect(html).not.toMatch(/data-moment|data-natural|tray-natural/)
  })
})

describe('the tray’s motion', () => {
  const twenty = shown(describeCheck('Dagger, to hit', dagger, 'normal', { faces: [20], kept: 20, total: 25 }, 'attack'))

  it('is marked only where the app allows motion for the roll', () => {
    expect(tray(draw(twenty))).toContain('data-motion="true"')
    expect(tray(draw(twenty, { rolling: false }))).not.toContain('data-motion')
    // The still keeps the moment.
    expect(tray(draw(twenty, { rolling: false }))).toContain('data-moment="20"')
  })

  it('carries the last die’s landing on the tray, for the seal and the moment to wait for', () => {
    expect(tray(draw(twenty))).toContain(`style="--last:${landsAfter(1)}ms"`)
    const fireball = shown(describePool('Fireball, damage', '8d6', ['8d6'], { faces: [1, 2, 3, 4, 5, 6, 2, 3], total: 26 }, '26 fire'))
    expect(tray(draw(fireball))).toContain(`style="--last:${landsAfter(8)}ms"`)
    expect(draw(fireball)).not.toMatch(/class="dice-row" style="[^"]*--last/)
  })
})
