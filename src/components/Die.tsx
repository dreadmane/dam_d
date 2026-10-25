import { useState, type CSSProperties } from 'react'
import type { TrayDie } from '../dice/describe.ts'
import { creasesOf, LIGHTS, overlay, SHAPES } from '../dice/shapes.ts'

// One die, drawn face on as a lit solid from src/dice/shapes.ts (the dice
// roll, approved by the user 2026-10-14). Three lighting layers: the rest
// light, and a dim and a bright one that only the tumble shows, one after
// the other, so the die reads as turning under a fixed light. The highlight is
// a white-to-clear gradient, never a filter. The numeral is cut in at 44 px
// and up (a dark copy up and left, a light copy down and right); below that
// the offsets would eat its contrast. Five decoy faces show in turn during the
// tumble, by CSS alone; at rest they are hidden, which is all reduced motion
// needs. The colours, the face and the tumble's timing come from the --dice-*
// custom properties, so Settings can change them without touching this. On a
// Marble die the veins show over the body (DiceDefs.tsx), a static layer under
// the light, in one of three seeds so the dice of a pool differ.

// Each die's gradient needs an id of its own in the document.
let glints = 0

// A d100's three-digit face is set smaller (index.css), so it takes the
// width two digits do on the d10's silhouette.
const numeralClass = (base: string, face: number) => (face > 99 ? `${base} die-long` : base)

export function Die({ die, size, decoys = [], seed = 0 }: { die: TrayDie; size: number; decoys?: number[]; seed?: number }) {
  const [glint] = useState(() => `dice-glint-${++glints}`)
  const shape = SHAPES[die.sides]
  const { x, y } = shape.numeral
  // One screen pixel, in the die's own units: the cut's offset.
  const px = 100 / size
  const cut = size >= 44
  return (
    <svg className="die" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={glint}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="die-body" d={shape.body} />
      <path className="die-veins" d={shape.body} filter={`url(#dice-marble-${seed % 3})`} mask={`url(#dice-clear-${die.sides})`} />
      {LIGHTS.map((light) => (
        <g key={light} className={`die-light die-light-${light}`}>
          {shape.facets.map((f) => {
            const o = overlay(f.weight, light)
            return <path key={f.d} d={f.d} fill={o.fill} fillOpacity={o.opacity} />
          })}
        </g>
      ))}
      <g className="die-creases">
        {creasesOf(shape).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <ellipse className="die-glint" cx={shape.glint.cx} cy={shape.glint.cy} rx={shape.glint.rx} ry={shape.glint.ry} fill={`url(#${glint})`} />
      {cut && (
        <text className={numeralClass('die-cut die-cut-dark', die.face)} x={x - px} y={y - px} dy="0.35em">
          {die.face}
        </text>
      )}
      {cut && (
        <text className={numeralClass('die-cut die-cut-light', die.face)} x={x + px} y={y + px} dy="0.35em">
          {die.face}
        </text>
      )}
      <text className={numeralClass('die-face', die.face)} x={x} y={y} dy="0.35em">
        {die.face}
      </text>
      {decoys.map((face, k) => (
        <text key={k} className={numeralClass('die-decoy', face)} x={x} y={y} dy="0.35em" style={{ '--k': k } as CSSProperties}>
          {face}
        </text>
      ))}
    </svg>
  )
}
