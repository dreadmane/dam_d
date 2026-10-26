import { afterEach, describe, expect, it, vi } from 'vitest'
import { rollDie, rollFaces } from './roll.ts'

// A fixed sequence of draws, each in [0, 1).
const draws = (...xs: number[]) => {
  let i = 0
  return () => xs[i++ % xs.length]
}

// crypto's 32-bit draws, in order: each call fills the array with the next.
const cryptoDraws = (...xs: number[]) =>
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(((array: Uint32Array) => {
    array[0] = xs.shift() ?? 0
    return array
  }) as typeof crypto.getRandomValues)

// A roll without a draw of its own takes crypto's, every face equally likely
// (#43, CodeQL's js/biased-cryptographic-random).
describe('rollDie from crypto', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("gives each of a d20's twenty in-range draws its own face, 1 to 20", () => {
    cryptoDraws(...Array.from({ length: 20 }, (_, i) => i))
    expect(Array.from({ length: 20 }, () => rollDie('1d20'))).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })

  it('draws again when a draw is past the last face, rather than scaling it', () => {
    const spy = cryptoDraws(31, 20, 4)
    expect(rollDie('1d20')).toBe(5)
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it("reads only the bits that cover the die: a draw's high bits don't move the face", () => {
    cryptoDraws(0xffffff03)
    expect(rollDie('1d20')).toBe(4)
  })

  it('covers a d100 with seven bits, and a d1 with none', () => {
    cryptoDraws(127, 99, 0xffffffff)
    expect(rollDie('1d100')).toBe(100)
    expect(rollDie('1d1')).toBe(1)
  })
})

describe('rollFaces', () => {
  it('rolls every die of a notation and adds them: two d4s', () => {
    expect(rollFaces('2d4', draws(0.5, 0.99))).toEqual({ faces: [3, 4], total: 7 })
  })

  it('reads a die with no count as one: 1d6 and d20', () => {
    expect(rollFaces('1d6', draws(0)).faces).toEqual([1])
    expect(rollFaces('d20', draws(0.999)).faces).toEqual([20])
  })

  it('refuses what is not dice notation', () => {
    expect(() => rollFaces('2d')).toThrow()
  })
})
