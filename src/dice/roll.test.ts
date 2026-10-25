import { describe, expect, it } from 'vitest'
import { rollFaces } from './roll.ts'

// A fixed sequence of draws, each in [0, 1).
const draws = (...xs: number[]) => {
  let i = 0
  return () => xs[i++ % xs.length]
}

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
