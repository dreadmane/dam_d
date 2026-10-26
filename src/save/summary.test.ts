// The summary's table cells (summary.ts): the player's text, escaped so it
// stays in its cell (#43, CodeQL's js/incomplete-sanitization).

import { describe, expect, it } from 'vitest'
import { cell } from './summary.ts'

describe('a summary table cell', () => {
  it('escapes a backslash, so text ending in one leaves the next pipe a column break', () => {
    expect(cell('Rope\\')).toBe('Rope\\\\')
  })

  it('escapes both a backslash and the pipe after it', () => {
    expect(cell('a\\|b')).toBe('a\\\\\\|b')
  })

  it('still escapes a pipe and folds a line break into a space', () => {
    expect(cell('a|b\nc\r\nd')).toBe('a\\|b c d')
  })
})
