// The eight dice the app draws (Crawler Interface's, from its book's p.55: the d2 to the d12, the d20, and the
// d100, which generally only the GM rolls, on a table), each drawn face on
// in a 100 × 100 box as a lit solid (the dice roll, approved by the user
// 2026-10-14). One light from the upper left for every die: each
// facet around the front face is lit or shaded by its weight, from 1 (facing
// the light) to −1 (facing away). The front face, where the numeral sits,
// carries no lighting at all, so a numeral's contrast is measured on the
// die's own colour. Each front face holds its numerals in every numeral face
// but the d20's triangle, whose numerals reach the two facets beside it; their
// light counts in which numeral colours a die offers (looks.ts). The
// highlight sits on the most lit facet at the upper
// left (on the d6, the d8 and the coin, near the front face's upper left),
// clear of the numeral, so a two-digit numeral never hides it. The d2 is a
// coin, the first way to roll one: its face is the inner disc,
// and its rim catches the light. The d100 is one die on the d10's silhouette
// (the free roll, user 2026-10-17: "I'd just have a single d100 to save
// space"), though the book rolls it as two d10s, the tens and the ones
// its three-digit face is set at two thirds (index.css), so it takes
// the width two digits do.

export type Sides = 2 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export interface Facet {
  d: string
  weight: number
}

export interface Shape {
  body: string
  // The face toward the player: the numeral's, never lit or shaded.
  front: string
  facets: Facet[]
  // The lines between facets, where they are not the facets' own outlines.
  creases?: string[]
  // The numeral's centre.
  numeral: { x: number; y: number }
  // The highlight: an ellipse filled with a white-to-clear gradient.
  glint: { cx: number; cy: number; rx: number; ry: number }
  // The facets beyond the front face a numeral's ink reaches, by weight.
  reach?: number[]
}

export const SIDES: readonly Sides[] = [20, 12, 10, 8, 6, 4, 2, 100]

export const isSides = (n: number): n is Sides => (SIDES as readonly number[]).includes(n)

// The ink a numeral puts down about its centre, in the 100 box: half its
// width for one digit or two, and how far it rises above and falls below.
// The widest and tallest of the numeral faces (Jost's two digits, Anton's
// tall ones), measured from the faces as drawn
// (notes/2026-10-14-dice-settings/measure-numerals.mjs; rerun it when a shape
// or a face changes).
export const NUMERAL_EXTENT = { half: { 1: 12.8, 2: 26.5 }, above: 21.5, below: 15.2 } as const

const D10: Shape = {
  body: 'M50 4 L92 40 L80 92 L20 92 L8 40 Z',
  front: 'M24 46 L76 46 L80 92 L20 92 Z',
  facets: [
    { d: 'M50 4 L8 40 L24 46 Z', weight: 0.9 },
    { d: 'M50 4 L24 46 L76 46 Z', weight: 0.3 },
    { d: 'M50 4 L76 46 L92 40 Z', weight: -0.3 },
    { d: 'M8 40 L24 46 L20 92 Z', weight: 0.2 },
    { d: 'M92 40 L76 46 L80 92 Z', weight: -0.8 },
  ],
  numeral: { x: 50, y: 68 },
  glint: { cx: 30, cy: 30, rx: 5, ry: 4 },
}

export const SHAPES: Record<Sides, Shape> = {
  20: {
    body: 'M50 3 L91 27 L91 73 L50 97 L9 73 L9 27 Z',
    front: 'M50 24 L78 69 L22 69 Z',
    facets: [
      { d: 'M50 3 L91 27 L50 24 Z', weight: 0.4 },
      { d: 'M50 3 L9 27 L50 24 Z', weight: 0.9 },
      { d: 'M9 27 L22 69 L50 24 Z', weight: 0.55 },
      { d: 'M9 27 L9 73 L22 69 Z', weight: 0.2 },
      { d: 'M91 27 L91 73 L78 69 Z', weight: -0.5 },
      { d: 'M91 27 L78 69 L50 24 Z', weight: -0.2 },
      { d: 'M9 73 L50 97 L22 69 Z', weight: -0.35 },
      { d: 'M50 97 L78 69 L22 69 Z', weight: -0.7 },
      { d: 'M91 73 L50 97 L78 69 Z', weight: -0.9 },
    ],
    numeral: { x: 50, y: 48 },
    glint: { cx: 35, cy: 18, rx: 8, ry: 4 },
    reach: [0.55, -0.2],
  },
  12: {
    body: 'M50 4 L94 36 L77 90 L23 90 L6 36 Z',
    front: 'M50 21 L78 43 L76 71 L24 71 L22 43 Z',
    facets: [
      { d: 'M50 4 L94 36 L78 43 L50 21 Z', weight: 0.45 },
      { d: 'M50 4 L6 36 L22 43 L50 21 Z', weight: 0.9 },
      { d: 'M6 36 L23 90 L24 71 L22 43 Z', weight: 0.3 },
      { d: 'M94 36 L77 90 L76 71 L78 43 Z', weight: -0.6 },
      { d: 'M23 90 L77 90 L76 71 L24 71 Z', weight: -0.85 },
    ],
    numeral: { x: 50, y: 52 },
    glint: { cx: 32, cy: 26, rx: 7, ry: 4 },
  },
  10: D10,
  100: D10,
  8: {
    body: 'M50 4 L94 50 L50 96 L6 50 Z',
    front: 'M50 4 L94 50 L6 50 Z',
    facets: [
      { d: 'M6 50 L50 96 L50 50 Z', weight: -0.3 },
      { d: 'M94 50 L50 96 L50 50 Z', weight: -0.85 },
    ],
    numeral: { x: 50, y: 34 },
    glint: { cx: 30, cy: 33, rx: 5, ry: 3 },
  },
  6: {
    body: 'M16 20 L30 8 L92 8 L92 70 L80 84 L16 84 Z',
    front: 'M16 20 L80 20 L80 84 L16 84 Z',
    facets: [
      { d: 'M16 20 L30 8 L92 8 L80 20 Z', weight: 0.9 },
      { d: 'M80 20 L92 8 L92 70 L80 84 Z', weight: -0.8 },
    ],
    numeral: { x: 48, y: 52 },
    glint: { cx: 27, cy: 30, rx: 7, ry: 4 },
  },
  4: {
    body: 'M50 6 L96 88 L4 88 Z',
    front: 'M4 88 L96 88 L50 44 Z',
    facets: [
      { d: 'M50 6 L50 44 L4 88 Z', weight: 0.7 },
      { d: 'M50 6 L96 88 L50 44 Z', weight: -0.6 },
    ],
    numeral: { x: 50, y: 72 },
    glint: { cx: 40, cy: 40, rx: 5, ry: 4 },
  },
  2: {
    body: 'M50 8 A42 42 0 1 1 49.99 8 Z',
    front: 'M50 18 A32 32 0 1 1 49.99 18 Z',
    facets: [
      { d: 'M50 8 A42 42 0 0 0 8 50 L18 50 A32 32 0 0 1 50 18 Z', weight: 0.8 },
      { d: 'M50 8 A42 42 0 0 1 92 50 L82 50 A32 32 0 0 0 50 18 Z', weight: 0.1 },
      { d: 'M8 50 A42 42 0 0 0 50 92 L50 82 A32 32 0 0 1 18 50 Z', weight: -0.2 },
      { d: 'M92 50 A42 42 0 0 1 50 92 L50 82 A32 32 0 0 0 82 50 Z', weight: -0.8 },
    ],
    // A coin has no edges between its rim's quarters: only the face's ring.
    creases: ['M50 18 A32 32 0 1 1 49.99 18 Z'],
    numeral: { x: 50, y: 50 },
    glint: { cx: 24, cy: 26, rx: 6, ry: 3 },
  },
}

// The lines between facets: the facets' own outlines, unless a die names its own.
export const creasesOf = (s: Shape): string[] => s.creases ?? [s.front, ...s.facets.map((f) => f.d)]

// The tumble's three lights (rest, then dim and bright standing in for the die
// turning under a fixed light): lit facets take white, shaded ones black, at
// the facet's weight times the light's strength.
export type Light = 'rest' | 'dim' | 'bright'

export const LIGHTS: readonly Light[] = ['rest', 'dim', 'bright']

const STRENGTH: Record<Light, { lit: number; shade: number }> = {
  rest: { lit: 0.2, shade: 0.4 },
  dim: { lit: 0.12, shade: 0.56 },
  bright: { lit: 0.3, shade: 0.2 },
}

export function overlay(weight: number, light: Light): { fill: '#fff' | '#000'; opacity: number } {
  const s = STRENGTH[light]
  const opacity = Math.round(Math.abs(weight) * (weight >= 0 ? s.lit : s.shade) * 1000) / 1000
  return { fill: weight >= 0 ? '#fff' : '#000', opacity }
}
