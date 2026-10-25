import { describe, expect, it } from 'vitest'
import { creasesOf, isSides, LIGHTS, NUMERAL_EXTENT, overlay, SHAPES, SIDES } from './shapes.ts'

// A polygon's corners, from a path of M, L and Z only; null for a curve.
function corners(d: string): [number, number][] | null {
  if (/[AaCcQq]/.test(d)) return null
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const points: [number, number][] = []
  for (let i = 0; i < nums.length; i += 2) points.push([nums[i], nums[i + 1]])
  return points
}

function inside([x, y]: [number, number], poly: [number, number][]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

// The box a numeral's ink can take, in the widest and tallest numeral faces.
// The d100's three digits are set at two thirds (index.css), so they take
// the width two digits do.
const numeralBox = (sides: number, x: number, y: number) => {
  const half = NUMERAL_EXTENT.half[sides >= 10 ? 2 : 1]
  return { left: x - half, right: x + half, top: y - NUMERAL_EXTENT.above, bottom: y + NUMERAL_EXTENT.below }
}

describe('the dice shapes', () => {
  it('draw the eight dice the app offers', () => {
    expect([...SIDES].sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 20, 100])
    expect(Object.keys(SHAPES).map(Number).sort((a, b) => a - b)).toEqual([2, 4, 6, 8, 10, 12, 20, 100])
    expect(isSides(20)).toBe(true)
    expect(isSides(100)).toBe(true)
    expect(isSides(3)).toBe(false)
  })

  it('draw the d100 as one die on the d10’s silhouette, the d100 last', () => {
    expect(SHAPES[100]).toBe(SHAPES[10])
    expect(SIDES.at(-1)).toBe(100)
  })

  it('light every facet by a weight between −1 and 1, and never the front face', () => {
    for (const sides of SIDES) {
      const s = SHAPES[sides]
      for (const f of s.facets) {
        expect(f.weight, `d${sides}`).toBeGreaterThanOrEqual(-1)
        expect(f.weight, `d${sides}`).toBeLessThanOrEqual(1)
        expect(f.weight, `d${sides}`).not.toBe(0)
      }
      expect(s.facets.some((f) => f.d === s.front), `d${sides}`).toBe(false)
      // Each die has a facet facing the light and one facing away.
      expect(s.facets.some((f) => f.weight > 0) || sides === 8, `d${sides}`).toBe(true)
      expect(s.facets.some((f) => f.weight < 0), `d${sides}`).toBe(true)
    }
  })

  it('set each numeral on its front face', () => {
    for (const sides of SIDES) {
      const s = SHAPES[sides]
      const front = corners(s.front)
      const point: [number, number] = [s.numeral.x, s.numeral.y]
      if (front) expect(inside(point, front), `d${sides}`).toBe(true)
      // The coin's face is a disc of radius 32 about its centre.
      else expect(Math.hypot(s.numeral.x - 50, s.numeral.y - 50), `d${sides}`).toBeLessThan(32)
    }
  })

  it('keep the highlight clear of the numeral, so a two-digit numeral never hides it', () => {
    for (const sides of SIDES) {
      const { glint, numeral } = SHAPES[sides]
      const box = numeralBox(sides, numeral.x, numeral.y)
      const apart = glint.cx + glint.rx < box.left || glint.cx - glint.rx > box.right || glint.cy + glint.ry < box.top || glint.cy - glint.ry > box.bottom
      expect(apart, `d${sides}`).toBe(true)
      const body = corners(SHAPES[sides].body)
      if (body) expect(inside([glint.cx, glint.cy], body), `d${sides}`).toBe(true)
    }
  })

  // Measured (NUMERAL_EXTENT): every other front face holds its numerals.
  it('name the facets a numeral reaches beyond its face: only the d20’s two beside its triangle', () => {
    for (const sides of SIDES) {
      const { reach = [], facets } = SHAPES[sides]
      for (const w of reach) expect(facets.map((f) => f.weight), `d${sides}`).toContain(w)
      expect(reach.length > 0, `d${sides}`).toBe(sides === 20)
    }
  })

  it('draw a coin’s rim without seams, and every other die’s facet edges', () => {
    expect(creasesOf(SHAPES[2])).toHaveLength(1)
    expect(creasesOf(SHAPES[20])).toHaveLength(SHAPES[20].facets.length + 1)
  })

  it('light a facet white and shade one black, more in the tumble’s dim and bright lights', () => {
    expect(overlay(0.9, 'rest')).toEqual({ fill: '#fff', opacity: 0.18 })
    expect(overlay(-0.9, 'rest')).toEqual({ fill: '#000', opacity: 0.36 })
    expect(overlay(0.9, 'bright').opacity).toBeGreaterThan(overlay(0.9, 'rest').opacity)
    expect(overlay(-0.9, 'dim').opacity).toBeGreaterThan(overlay(-0.9, 'rest').opacity)
    expect(LIGHTS).toEqual(['rest', 'dim', 'bright'])
  })
})
