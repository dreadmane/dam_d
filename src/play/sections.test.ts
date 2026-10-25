import { describe, expect, it } from 'vitest'
import filled from '../save/fixtures/roster-v1-filled.json'
import { newRoster } from '../save/new-roster.ts'
import type { RosterRecord } from '../save/record.ts'
import { primaryEntity } from '../save/use-roster.ts'
import { sectionCounts } from './sections.ts'

describe('the sections’ counts', () => {
  it('count what is held, so a change shows at once', () => {
    expect(sectionCounts(primaryEntity(newRoster({ name: '' })))).toEqual({ inventory: '0' })
    expect(sectionCounts(primaryEntity(filled as unknown as RosterRecord))).toEqual({ inventory: '3' })
  })
})
