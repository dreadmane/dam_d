import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { layoutDice } from '../dice/layout.ts'
import { DICE_DIES, DICE_INKS, dieLook, inkOn, readable, type DieId, type InkId } from '../dice/looks.ts'
import { decoysFor, delayOf, seeded } from '../dice/plan.ts'
import { SIDES, type Sides } from '../dice/shapes.ts'
import { motionAllowed } from '../motion.ts'
import { diceStyle, NUMERAL_FONTS, type DiceSettings } from '../settings.ts'
import { Die } from './Die.tsx'

// Settings, Dice (the dice roll, approved by the user 2026-10-14): the eight
// dice (the d100 since the free roll, 2026-10-17) in the chosen look on a
// strip drawn as the tray, Show the dice when
// you roll, and the die, its numerals and their face, each card showing its
// choice on a die. A numeral colour that would not read on the chosen die
// cannot be chosen, and says so. The page's other settings apply at once and
// stay on this device; so do these.

export function DiceSettingsFields({ dice, onChange }: { dice: DiceSettings; onChange: (next: DiceSettings) => void }) {
  const ink = inkOn(dice.die, dice.ink)
  const look = `${dice.die} ${ink} ${dice.font}`
  return (
    <>
      <fieldset className="choice-cards">
        <legend>Dice</legend>
        <DicePreview look={look} />
        <label>
          <input type="checkbox" checked={dice.show} onChange={(e) => onChange({ ...dice, show: e.target.checked })} />
          <span>
            <strong>Show the dice when you roll</strong>
            <span>
              Each roll shows its dice for a few seconds beside the number it prints anyway. Off, the number alone; the Rolls log keeps every
              roll either way.
            </span>
          </span>
        </label>
      </fieldset>

      <fieldset className="choice-cards dice-cards">
        <legend>Die</legend>
        <div className="dice-card-row">
          {DICE_DIES.map((d, i) => (
            <DiceCard key={d.id} name="dice-die" checked={dice.die === d.id} onChange={() => onChange({ ...dice, die: d.id, ink: dice.ink && readable(d.id, dice.ink) ? dice.ink : null })}>
              <Sample die={d.id} ink={inkOn(d.id, dice.ink)} font={dice.font} size={48} face={20} />
              <span className="dice-card-name">
                {d.label}
                {i === 0 && ' (default)'}
              </span>
            </DiceCard>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-cards dice-cards">
        <legend>Numerals</legend>
        <div className="dice-card-row">
          {DICE_INKS.map((k) => {
            const reads = readable(dice.die, k.id)
            return (
              <DiceCard key={k.id} name="dice-ink" checked={ink === k.id} disabled={!reads} onChange={() => onChange({ ...dice, ink: k.id })}>
                <Sample die={dice.die} ink={reads ? k.id : ink} font={dice.font} size={44} face={14} />
                <span className="dice-card-name">
                  {k.label}
                  {dieLook(dice.die).ink === k.id && ' (default)'}
                  {!reads && <span className="meta">Too faint on {dieLook(dice.die).label}</span>}
                </span>
              </DiceCard>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="choice-cards dice-cards">
        <legend>Numeral font</legend>
        <div className="dice-card-row">
          {NUMERAL_FONTS.map((f, i) => (
            <DiceCard key={f.id} name="dice-font" checked={dice.font === f.id} onChange={() => onChange({ ...dice, font: f.id })}>
              <Sample die={dice.die} ink={ink} font={f.id} size={56} face={20} />
              <span className="dice-card-name">
                {f.label}
                {i === 0 && ' (default)'}
              </span>
            </DiceCard>
          ))}
        </div>
      </fieldset>
    </>
  )
}

// A radio card whose choice is shown on a die; the name carries it.
function DiceCard({ name, checked, disabled, onChange, children }: { name: string; checked: boolean; disabled?: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} />
      {children}
    </label>
  )
}

// One die in one look, whatever the page's own: every --dice-* property set.
function Sample({ die, ink, font, size, face }: { die: DieId; ink: InkId; font: string; size: number; face: number }) {
  return (
    <span className="dice-sample" style={{ ...diceStyle({ die, ink, font }), '--die-size': `${size}px` } as CSSProperties}>
      <span className="die-cell">
        <span className="die-shadow" />
        <Die die={{ sides: 20, face }} size={size} />
      </span>
    </span>
  )
}

// The eight dice, each showing its highest face, tumbling as they would in
// the tray when the look changes or when rolled again. Not a roll: nothing
// rides on these faces and nothing is logged.
function DicePreview({ look }: { look: string }) {
  const [shown, setShown] = useState<{ n: number; faces: number[] }>({ n: 0, faces: [...SIDES] })
  const again = () => setShown((s) => ({ n: s.n + 1, faces: SIDES.map((sides) => 1 + Math.floor(Math.random() * sides)) }))
  const row = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(318)
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  const layout = layoutDice(SIDES.length, width)
  const rolling = motionAllowed()
  const random = seeded(shown.n * 7919 + 7)
  return (
    <div className="dice-preview-wrap">
      {/* A tap on the dice rolls them too; the button is the keyboard's way. */}
      <div className="dice-preview hud-frame" aria-hidden="true" onClick={again}>
        <div
          ref={row}
          className="dice-row"
          style={{ '--die-size': `${layout.size}px`, '--die-cell': `${layout.cell}px`, '--die-gap': `${layout.gap}px`, '--columns': layout.columns } as CSSProperties}
        >
          {SIDES.map((sides: Sides, i) => {
            const face = shown.faces[i]
            return (
              <span
                key={`${shown.n}-${look}-${i}`}
                className="die-cell"
                data-sides={sides}
                data-rolling={rolling || undefined}
                data-natural={sides === 20 && face === 20 ? 20 : undefined}
                style={{ '--delay': `${delayOf(i)}ms` } as CSSProperties}
              >
                <span className="die-shadow" />
                <Die die={{ sides, face }} size={layout.size} decoys={rolling ? decoysFor(sides, face, random) : undefined} seed={i} />
              </span>
            )
          })}
        </div>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={again}>
          Roll them
        </button>
        <p className="meta">Tap the dice or Roll them to see them again. Nothing here is logged.</p>
      </div>
    </div>
  )
}
