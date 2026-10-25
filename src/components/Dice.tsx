import { useState } from 'react'
import { showDice } from '../dice/app-tray.ts'
import { describePool } from '../dice/describe.ts'
import {
  diceIn,
  EMPTY_POOL,
  formulaOf,
  MOST_DICE,
  MOST_MODIFIER,
  notationsOf,
  parsePool,
  rollPool,
  tapDie,
  tapModifier,
  type FreeRoll,
} from '../dice/free-roll.ts'
import { SIDES } from '../dice/shapes.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { CharacterEntity } from '../save/record.ts'
import { deviceStore } from './device-store.ts'
import { Die } from './Die.tsx'
import { SectionInfo, type Rule } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'

// Dice, the free roll (user, 2026-10-14; the design the user shaped,
// 2026-10-17, Crawler Interface's notes/2026-10-17-free-roll): a roll the
// table calls for that nothing on the sheet covers. A menu, opened from the
// menu and pinnable like every menu (sheet-layout.ts). Every die the game
// uses, the d100 as one die, as keys in two rows of four: a tap adds one to
// the roll, and a die in the roll is lit with how many. A modifier steps by
// one. Clear and Roll come last, held at the window's foot on a screen too
// short for it; Roll says what it rolls. Each roll shows in the tray, goes in
// the Rolls log and is printed above Roll. The pool's rules are in
// dice/free-roll.ts. Crawler Interface's Stat Checks under the keys were
// DCC's; M1 brings D&D's checks to the sheet itself.

// The last roll made here, kept on this device as the pins are, so the menu
// opens on it: Roll repeats it, and the next die tapped starts a new one.
const lastRoll = deviceStore('d-amp-d:free-roll', parsePool)

const signed = (n: number) => (n < 0 ? `−${-n}` : n > 0 ? `+${n}` : '0')

const DICE_RULE: Rule = {
  title: 'Dice',
  text: [
    'For a roll the table calls for that nothing on the sheet covers. Tap a die to add it to the roll, as many of each as you need, and set a modifier if there is one. Roll says what it rolls.',
    'After a roll, Roll repeats it, and the next die you tap starts a new roll. Clear starts over.',
  ],
  notes: ['The d100 is one die, from 1 to 100.', 'Every roll shows in the tray and goes in the Rolls log.'],
}

export default function DiceSection({ entity }: { entity: CharacterEntity }) {
  const record = useRecordRoll()
  const [state, setState] = useState<FreeRoll>(() => ({ pool: lastRoll.get(), rolled: true }))
  const [said, setSaid] = useState('')
  const { pool } = state
  const formula = formulaOf(pool)
  const count = diceIn(pool)
  const full = count >= MOST_DICE && !state.rolled

  function change(next: FreeRoll) {
    setState(next)
    setSaid('')
  }

  function roll() {
    const r = rollPool(pool)
    const described = describePool('Free roll', formula, notationsOf(pool), r)
    showDice(described)
    record(entity, described)
    setSaid(described.line)
    lastRoll.set(pool)
    setState({ pool, rolled: true })
  }

  const hint = count === 0 ? 'Tap a die to add it to the roll.' : full ? `${MOST_DICE} dice is the most one roll holds.` : ''

  return (
    <SheetSection id="dice" className="dice-section" info={<SectionInfo rule={DICE_RULE} label="How the Dice menu works" />}>
      <div className="dice-keys" role="group" aria-label="Add a die">
        {SIDES.map((sides) => {
          const n = pool.counts[sides] ?? 0
          return (
            <button
              key={sides}
              type="button"
              className="dice-key"
              data-count={n || undefined}
              disabled={full}
              aria-label={`Add a d${sides}${n ? `, ${n} in the roll` : ''}`}
              onClick={() => change(tapDie(state, sides))}
            >
              <Die die={{ sides, face: sides }} size={26} />
              <span className="dice-key-name">
                d{sides}
                {n > 0 && ` ×${n}`}
              </span>
            </button>
          )
        })}
      </div>
      <div className="dice-modifier">
        <span id="dice-modifier-label">Modifier</span>
        <button type="button" className="secondary" aria-label="Take 1 off the modifier" disabled={pool.modifier <= -MOST_MODIFIER} onClick={() => change(tapModifier(state, -1))}>
          −
        </button>
        <output className="dice-modifier-value" aria-labelledby="dice-modifier-label">
          {signed(pool.modifier)}
        </output>
        <button type="button" className="secondary" aria-label="Add 1 to the modifier" disabled={pool.modifier >= MOST_MODIFIER} onClick={() => change(tapModifier(state, 1))}>
          +
        </button>
      </div>
      <div className="dice-foot">
        <p className="dice-menu-line" role="status">
          {said || hint}
        </p>
        <div className="dice-actions">
          <button type="button" className="secondary" disabled={count === 0 && pool.modifier === 0} onClick={() => change({ pool: EMPTY_POOL, rolled: false })}>
            Clear
          </button>
          <button type="button" className="primary" disabled={count === 0} onClick={roll}>
            {count === 0 ? 'Roll' : `Roll ${formula}`}
          </button>
        </div>
      </div>
    </SheetSection>
  )
}
