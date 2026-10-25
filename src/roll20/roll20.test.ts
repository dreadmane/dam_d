import { describe, expect, it } from 'vitest'
import { sentWords } from './app-roll20.ts'
import { beyond20Message, roll20Card } from './roll20.ts'

const stealth = { name: 'Stealth, check', formula: 'd20 + 9', lines: ['Rolled 4: 13.'] }

describe('roll20Card', () => {
  it('writes a roll as a Roll20 default-template card, its result as words', () => {
    expect(roll20Card('The Badger (Example)', stealth)).toBe(
      '&{template:default} {{name=The Badger (Example): Stealth, check}} {{Roll=d20 + 9}} {{Result=Rolled 4: 13.}}',
    )
  })

  it('never writes an inline roll, so Roll20 draws no roll box of its own', () => {
    expect(roll20Card('Lia', stealth)).not.toMatch(/\[\[/)
  })

  it('gives each further line a row of its own, as the advancement checks print a line per Skill', () => {
    const checks = { name: 'Two checks', formula: '', lines: ['Perception: 14.', 'Stealth: 12.'] }
    expect(roll20Card('Lia', checks)).toBe(
      '&{template:default} {{name=Lia: Two checks}} {{Result=Perception: 14.}} {{Result 2=Stealth: 12.}}',
    )
  })

  it('keeps braces and newlines from ending the template or the message early', () => {
    const odd = { name: 'Odd {{name}}', formula: 'd6', lines: ['Rolled 3.\nThen 4.}}'] }
    const card = roll20Card('Lia', odd)
    expect(card).toBe('&{template:default} {{name=Lia: Odd name}} {{Roll=d6}} {{Result=Rolled 3. Then 4.}}')
    expect(card).not.toMatch(/\n/)
  })
})

describe('beyond20Message', () => {
  const message = beyond20Message('The Badger (Example)', stealth)

  it('is a rendered roll whose request is a chat message carrying the same card', () => {
    expect(message.action).toBe('rendered-roll')
    expect(message.request.type).toBe('chat-message')
    expect(message.request.message).toBe(roll20Card('The Badger (Example)', stealth))
  })

  it('names the character where Beyond20 reads it, as a character it can speak as', () => {
    expect(message.character).toBe('The Badger (Example)')
    expect(message.request.character).toEqual({ name: 'The Badger (Example)', type: 'Character', settings: {} })
  })

  it('escapes the html other targets draw', () => {
    const html = beyond20Message('Lia', { name: '<b>x</b>', formula: 'd6', lines: ['a & b'] }).html
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('a &amp; b')
  })
})

describe('sentWords', () => {
  it('says nothing for a roll other than the latest sent', () => {
    expect(sentWords(null, 1000)).toBeNull()
    expect(sentWords({ at: 1000, beyond20: true, copy: null }, 5000)).toBeNull()
  })

  it('says where the roll went', () => {
    expect(sentWords({ at: 1000, beyond20: true, copy: null }, 1000)).toBe('Sent to Roll20.')
    expect(sentWords({ at: 1000, beyond20: false, copy: 'copied' }, 1200)).toBe('Copied for Roll20: paste it in its chat.')
    expect(sentWords({ at: 1000, beyond20: true, copy: 'copied' }, 900)).toBe('Sent to Roll20. Copied for Roll20: paste it in its chat.')
    expect(sentWords({ at: 1000, beyond20: false, copy: 'refused' }, 1000)).toBe('The browser would not copy it.')
  })
})
