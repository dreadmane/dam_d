import { NUMERAL_EXTENT, SHAPES, SIDES } from '../dice/shapes.ts'

// Marble's veins, defined once for every die in the document (the dice
// roll, approved by the user 2026-10-14): the thin grey contour lines of a
// warped noise field, in three seeds so the dice of a pool differ, and for
// each die a clear zone that keeps them off its numeral, so the numeral sits
// on the plain Bone body and keeps its measured contrast. The browser draws
// the noise; there is no image. Only a Marble die shows them (--dice-veins).

const SEEDS = [14, 27, 41]
// The noise field's middle band is the vein: one step of 25 at 0.9.
const BAND = Array.from({ length: 25 }, (_, i) => (i === 12 ? 0.9 : 0)).join(' ')
// The clear zone is the numeral's ink (NUMERAL_EXTENT) with room for the
// cut-in offsets, a screen pixel each, 2.3 units on a 44 px die, and fully
// clear there: its edge is softened over SOFT units outside that.
const CUT = 2.5
const SOFT = 2

export function DiceDefs() {
  return (
    <svg className="dice-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {SEEDS.map((seed, i) => (
          <filter key={seed} id={`dice-marble-${i}`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={2} seed={seed + 20} result="warp" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={5} seed={seed} result="noise" />
            <feDisplacementMap in="noise" in2="warp" scale={16} xChannelSelector="R" yChannelSelector="G" result="warped" />
            <feColorMatrix in="warped" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="field" />
            <feComponentTransfer in="field" result="band">
              <feFuncA type="table" tableValues={BAND} />
            </feComponentTransfer>
            <feFlood className="dice-vein" result="grey" />
            <feComposite in="grey" in2="band" operator="in" result="veins" />
            <feComposite in="veins" in2="SourceGraphic" operator="in" />
          </filter>
        ))}
        <filter id="dice-clear-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={SOFT} />
        </filter>
        {SIDES.map((sides) => {
          const { x, y } = SHAPES[sides].numeral
          const room = CUT + 2 * SOFT
          const half = NUMERAL_EXTENT.half[sides >= 10 ? 2 : 1] + room
          const top = y - NUMERAL_EXTENT.above - room
          const bottom = y + NUMERAL_EXTENT.below + room
          return (
            <mask key={sides} id={`dice-clear-${sides}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <rect width="100" height="100" fill="#fff" />
              <rect x={x - half} y={top} width={2 * half} height={bottom - top} rx="6" fill="#000" filter="url(#dice-clear-soft)" />
            </mask>
          )
        })}
      </defs>
    </svg>
  )
}
