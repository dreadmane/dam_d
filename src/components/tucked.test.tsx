// The turn's tucked-in note (Turn.tsx Tucked) stamps each condition on the
// character (the sheet concept's borrowing from direction C, user
// 2026-10-23): its name a stamp of its own, which index.css draws, and the
// commas and the full stop between them hidden from the eye but not from a
// screen reader, so the note reads as it did before the stamps.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { deriveSheet } from '../rules/derive.ts'
import { testRules } from '../rules/test-rules.ts'
import wizard from '../save/examples/wizard.json'
import type { CharacterEntity, Condition } from '../save/types.ts'
import { Tucked } from './Turn.tsx'

const rules = testRules()
const ilsabet = (conditions: Condition[]): CharacterEntity => ({ ...(structuredClone((wizard as { entities: unknown[] }).entities[0]) as CharacterEntity), conditions })
const note = (entity: CharacterEntity) => renderToStaticMarkup(<Tucked rules={rules} entity={entity} sheet={deriveSheet(rules, entity)} />)
// What a screen reader reads: every word, the hidden ones too.
const read = (html: string) => html.replace(/<[^>]+>/g, '')

describe('the tucked-in note', () => {
  it('stamps each condition on the character', () => {
    const html = note(ilsabet([{ id: 'a', conditionId: 'poisoned' }, { id: 'b', conditionId: 'prone' }]))
    expect(html.match(/<span class="condition-stamp">[^<]*<\/span>/g)).toEqual(['<span class="condition-stamp">Poisoned</span>', '<span class="condition-stamp">Prone</span>'])
  })

  it('reads as it did, the stamps’ commas and full stop kept for a screen reader', () => {
    const html = note(ilsabet([{ id: 'a', conditionId: 'poisoned' }, { id: 'b', conditionId: 'prone' }]))
    expect(read(html)).toBe('Tucked inPoisoned, Prone. Not concentrating.')
    expect(html).toContain('<span class="condition-stamp">Poisoned</span><span class="visually-hidden">, </span><span class="condition-stamp">Prone</span><span class="visually-hidden">.</span>')
  })

  it('stamps a custom effect by its name too', () => {
    const html = note(ilsabet([{ id: 'a', custom: { name: 'Hexed', text: '' } }]))
    expect(html).toContain('<span class="condition-stamp">Hexed</span><span class="visually-hidden">.</span>')
    expect(read(html)).toBe('Tucked inHexed. Not concentrating.')
  })

  it('stamps nothing when there are none, and leaves the rest of the note in the hand', () => {
    const html = note(ilsabet([]))
    expect(html).not.toContain('condition-stamp')
    expect(read(html)).toBe('Tucked inNo conditions. Not concentrating.')
  })
})
