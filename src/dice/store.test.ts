import { describe, expect, it } from 'vitest'
import { describeCheck } from './describe.ts'
import { createTrayStore } from './store.ts'

const roll = describeCheck('Longsword, to hit', { flat: 15, dice: ['d20'] }, 'normal', { faces: [14], kept: 14, total: 29 })
const pair = describeCheck('Longsword, to hit', { flat: 15, dice: ['d20'] }, 'advantage', { faces: [17, 6], kept: 17, total: 32 })

function setup() {
  let t = 1000
  const store = createTrayStore<string>({ now: () => t })
  let told = 0
  store.subscribe(() => told++)
  return { store, advance: (ms: number) => (t += ms), told: () => told }
}

describe('the tray store', () => {
  it('shows a roll timed from the tap, its last die landing after the tumble', () => {
    const { store, told } = setup()
    const shown = store.show(roll, { host: 'band', origin: null, motion: true })
    expect(shown).toMatchObject({ id: 1, at: 1000, landsAt: 1520, settled: false, leaving: false, host: 'band', line: 'Rolled 14: 29.' })
    expect(store.current()).toBe(shown)
    expect(told()).toBe(1)
  })

  it('tumbles until the last die lands, and not at all under reduced motion', () => {
    const { store, advance } = setup()
    store.show(pair, { host: 'band', origin: null, motion: true })
    expect(store.tumbling()).toBe(true)
    advance(544)
    expect(store.tumbling()).toBe(true)
    advance(1)
    expect(store.tumbling()).toBe(false)
    store.show(roll, { host: 'band', origin: null, motion: false })
    expect(store.current()).toMatchObject({ settled: true, landsAt: 1545 })
    expect(store.tumbling()).toBe(false)
  })

  it('with the dice off, is at rest at the tap, drawing the roll’s words alone or nothing', () => {
    const { store } = setup()
    expect(store.show(roll, { host: 'band', origin: null, motion: true, draw: 'line', say: true })).toMatchObject({ settled: true, landsAt: 1000, draw: 'line', say: 'Rolled 14: 29.' })
    expect(store.tumbling()).toBe(false)
    expect(store.show(roll, { host: 'band', origin: null, motion: true, draw: 'none' })).toMatchObject({ settled: true, draw: 'none' })
    expect(store.show(roll, { host: 'band', origin: null, motion: true }).draw).toBe('dice')
  })

  it('settles every die at once on a tap during the tumble, the hold counting from then', () => {
    const { store, advance } = setup()
    store.show(roll, { host: 'band', origin: null, motion: true })
    advance(100)
    store.settle()
    expect(store.current()).toMatchObject({ settled: true, landsAt: 1100 })
    expect(store.tumbling()).toBe(false)
  })

  it('leaves when its time is up, and a new roll replaces it in place', () => {
    const { store } = setup()
    store.show(roll, { host: 'band', origin: null, motion: true })
    store.end()
    expect(store.current()?.leaving).toBe(true)
    const next = store.show(pair, { host: 'band', origin: null, motion: true })
    expect(next).toMatchObject({ id: 2, leaving: false })
    // The first roll's leave ending clears nothing now.
    store.clear(1)
    expect(store.current()).toBe(next)
    store.clear(2)
    expect(store.current()).toBeNull()
  })

  it('goes with the window it showed in, and only that one', () => {
    const { store } = setup()
    store.show(roll, { host: 'pugilism-window', origin: null, motion: true })
    store.dropHost('another-window')
    expect(store.current()).not.toBeNull()
    store.dropHost('pugilism-window')
    expect(store.current()).toBeNull()
  })

  it('keeps the control that rolled and where it was, for the grow and the shrink', () => {
    const { store } = setup()
    const origin = { x: 20, y: 600, width: 120, height: 44 }
    expect(store.show(roll, { host: 'band', origin, motion: true, control: 'roll-button' })).toMatchObject({ origin, control: 'roll-button' })
  })

  it('speaks a roll only where its site asks, one that prints no line of its own', () => {
    const { store } = setup()
    expect(store.show(roll, { host: 'band', origin: null, motion: true }).say).toBe(null)
    expect(store.show(roll, { host: 'band', origin: null, motion: true, say: true }).say).toBe(roll.line)
  })

  it('speaks a site’s own words for a roll whose tray has no line: the checks name each Skill', () => {
    const { store } = setup()
    expect(store.show(roll, { host: 'band', origin: null, motion: true, say: 'Perception 14, Insight 2.' }).say).toBe('Perception 14, Insight 2.')
  })
})
