import { describe, expect, it } from 'vitest'
import { characterName, named } from './character-name.ts'

describe('a character’s name', () => {
  it('is the name, trimmed, and "Unnamed character" with none', () => {
    expect(characterName('Steve')).toBe('Steve')
    expect(characterName('  Lia Brightwater ')).toBe('Lia Brightwater')
    expect(characterName('')).toBe('Unnamed character')
    expect(characterName('   ')).toBe('Unnamed character')
  })

  it('counts only a name with something in it as named', () => {
    expect(named('Lia')).toBe(true)
    expect(named('  ')).toBe(false)
  })
})
