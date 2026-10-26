import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from 'react'
import { trayStore, useTray, type Host } from '../dice/app-tray.ts'
import { isNatural, sealOf, type Natural, type SealTotal } from '../dice/describe.ts'
import { layoutDice, rowsBudget, type DiceLayout } from '../dice/layout.ts'
import { decoysFor, delayOf, landsAfter, seeded } from '../dice/plan.ts'
import type { Shown } from '../dice/store.ts'
import { motionAllowed, takeMotionHint } from '../motion.ts'
import { sentWords, useSent } from '../roll20/app-roll20.ts'
import { originFrom } from './dialog.ts'
import { Die } from './Die.tsx'

// The dice tray (the dice roll, approved by the user 2026-10-14): the HUD's
// panel, grown from the control that rolled, holding the roll's dice as they
// land, its name as a readout's name line and the window's own words for the
// result. A display, never a control: aria-hidden, since the roll site's own
// result line is the one announcement, and taking no taps (index.css). It
// shows in one host: the window on top (Window.tsx), or under the band when no
// window is open (Flash.tsx). It stays HOLD_MS after the last die lands, then
// shrinks back into the control that rolled; a tap, a key or a focus move ends
// it sooner (app-tray.ts), and a new roll replaces its dice in place.
//
// Beside the dice the total is pressed into a seal, large (the dice total
// concept, direction B, user 2026-10-23); the line along the bottom keeps the
// formula and the window's words, the total still in bold. A natural 20 or 1
// on the d20 that counts is the roll's moment: the seal in gold leaf, or
// cracked and askew, and the words for it after the seal (describe.ts), on
// their own line, or on a screen too short for the tray to grow by it, on
// the name's (index.css). The
// seal presses, and the moment plays, as the last die lands, only where the
// app allows motion (data-motion, from motionAllowed(), which follows
// Settings, Motion); the still shows both by colour, mark and words.

const HOLD_MS = 2500
const SHRINK_FALLBACK_MS = 200

// What the dice's layout needs from the tray as drawn: the dice row's width;
// the widest word under a die (kept, rerolled), which every column must hold,
// and the height that word and its mark add to a row; the height of the
// rest of the tray, its padding and frame, the name and the line, which take
// as many lines as their words need; and a natural's words, which grow the
// tray rather than shrink the dice (rowsBudget).
interface Fit {
  width: number
  wordWidth: number
  wordHeight: number
  rest: number
  natural: number
}

const px = (value: string) => parseFloat(value) || 0

// An element's height with its margins. Layout sizes, which the grow's scale
// does not touch.
function outerHeight(el: Element | null): number {
  if (!(el instanceof HTMLElement)) return 0
  const style = getComputedStyle(el)
  return el.offsetHeight + px(style.marginTop) + px(style.marginBottom)
}

function measure(tray: HTMLElement): Fit {
  const row = tray.querySelector<HTMLElement>('.dice-row')
  const style = getComputedStyle(tray)
  const rowStyle = row && getComputedStyle(row)
  const cells = [...tray.querySelectorAll('.die-cell')]
  const words = [...tray.querySelectorAll<HTMLElement>('.die-word')]
  return {
    width: row?.clientWidth ?? 0,
    wordWidth: Math.max(0, ...words.map((w) => w.scrollWidth)),
    wordHeight: Math.max(0, ...cells.map((c) => outerHeight(c.querySelector('.die-kept')) + outerHeight(c.querySelector('.die-word')))),
    rest:
      px(style.paddingTop) +
      px(style.paddingBottom) +
      px(style.borderTopWidth) +
      px(style.borderBottomWidth) +
      outerHeight(tray.querySelector('.dice-tray-name')) +
      outerHeight(tray.querySelector('.dice-tray-line')) +
      outerHeight(tray.querySelector('.dice-tray-sent')) +
      outerHeight(tray.querySelector('.dice-tray-hint')) +
      (rowStyle ? px(rowStyle.paddingTop) + px(rowStyle.paddingBottom) : 0),
    natural: naturalGrows(tray),
  }
}

// The height a natural's words add to the tray: their own line, or on a
// short screen, where they join the name's line (index.css), what they add
// to that line beyond the name's own height, their baselines aligned. Layout
// offsets, which the grow's scale does not touch.
function naturalGrows(tray: HTMLElement): number {
  const words = tray.querySelector<HTMLElement>('.tray-natural')
  const name = tray.querySelector<HTMLElement>('.dice-tray-name')
  if (!words) return 0
  if (!name || getComputedStyle(words).gridRowStart !== '1') return outerHeight(words)
  const span = (el: HTMLElement) => {
    const style = getComputedStyle(el)
    return { top: el.offsetTop - px(style.marginTop), bottom: el.offsetTop + el.offsetHeight + px(style.marginBottom) }
  }
  const [a, b] = [span(name), span(words)]
  return Math.max(0, Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) - outerHeight(name))
}

const same = (a: Fit, b: Fit) => a.width === b.width && a.wordWidth === b.wordWidth && a.wordHeight === b.wordHeight && a.rest === b.rest && a.natural === b.natural

// The tray, and beside it, for a roll its site asks the tray to speak, the
// roll's name and its words for a screen reader. Under the band that line
// sits in the flash stack's live region; in a window it is a live region of
// its own, there for as long as the window is on top, so a change in it is
// heard.
export function DiceTray({ place, host }: { place: 'band' | 'window'; host: Host | null }) {
  const shown = useTray()
  const mine = shown && host !== null && shown.host === host ? shown : null
  return (
    <>
      {mine && mine.draw !== 'none' && <Tray roll={mine} place={place} />}
      <p className="visually-hidden dice-said" role={place === 'window' ? 'status' : undefined}>
        {mine?.say ? `${mine.name}: ${mine.say}` : ''}
      </p>
    </>
  )
}

function Tray({ roll, place }: { roll: Shown<Host>; place: 'band' | 'window' }) {
  const box = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const motion = motionAllowed()
  // The grow plays once, as the tray first appears; a roll replacing another
  // keeps the panel where it is.
  const [opening, setOpening] = useState(motion)

  // The tray as laid out, measured before the first paint and again whenever
  // a part of it changes size (a turned phone, the font arriving), so the
  // dice are sized to what the name and the line leave and no die is drawn
  // past the edge. The name and the line can wrap to two lines or more, so
  // their heights are read, never assumed.
  const [fit, setFit] = useState<Fit>({ width: 342, wordWidth: 0, wordHeight: 0, rest: 0, natural: 0 })
  useLayoutEffect(() => {
    const tray = box.current
    if (!tray) return
    const update = () => {
      const now = measure(tray)
      setFit((was) => (same(was, now) ? was : now))
    }
    update()
    const watch = new ResizeObserver(update)
    for (const part of [row.current, tray.querySelector('.dice-tray-name'), tray.querySelector('.dice-tray-line'), tray.querySelector('.dice-tray-sent')]) {
      if (part) watch.observe(part)
    }
    return () => watch.disconnect()
  }, [roll.id])

  // Grown out of the control that rolled, as a window grows from its opener,
  // and shrunk back into the control behind the latest roll.
  useLayoutEffect(() => {
    const el = box.current
    if (el && roll.origin) el.style.transformOrigin = originFrom(roll.origin, el.getBoundingClientRect())
  }, [roll.origin])

  useEffect(() => {
    if (!opening) return
    const el = box.current
    const done = () => setOpening(false)
    const grown = (e: AnimationEvent) => {
      if (e.target === el) done()
    }
    el?.addEventListener('animationend', grown)
    const timer = window.setTimeout(done, SHRINK_FALLBACK_MS)
    return () => {
      el?.removeEventListener('animationend', grown)
      window.clearTimeout(timer)
    }
  }, [opening])

  // The hold: from the last die landing, or from the tap that settled them.
  useEffect(() => {
    if (roll.leaving) return
    const timer = window.setTimeout(() => trayStore.end(), Math.max(0, roll.landsAt + HOLD_MS - performance.now()))
    return () => window.clearTimeout(timer)
  }, [roll.id, roll.landsAt, roll.leaving])

  // The leave: the shrink, then gone. Under reduced motion simply gone.
  useEffect(() => {
    if (!roll.leaving) return
    const el = box.current
    const done = () => trayStore.clear(roll.id)
    if (!el || !motionAllowed()) return done()
    const shrunk = (e: AnimationEvent) => {
      if (e.target === el) done()
    }
    el.addEventListener('animationend', shrunk)
    const timer = window.setTimeout(done, SHRINK_FALLBACK_MS)
    return () => {
      el.removeEventListener('animationend', shrunk)
      window.clearTimeout(timer)
    }
  }, [roll.id, roll.leaving])

  // Each die's start after the tap, and the faces it flickers through, from a
  // seeded generator that decides nothing. Both hosts are on screen when a
  // roll shows, so the tray is drawn at the tap and the delays count from it.
  const plan = useMemo(() => {
    const random = seeded(roll.id * 7919 + roll.dice.length)
    return roll.dice.map((d, i) => ({ delay: delayOf(i), decoys: decoysFor(d.sides, d.face, random) }))
  }, [roll.id, roll.dice])

  const rolling = motion && !roll.settled
  // The first roll whose tumble the device's reduce-motion setting skips
  // says why, and where to change it (motion.ts).
  const hint = roll.draw === 'dice' && !motion && takeMotionHint(roll.id)
  const sent = sentWords(useSent(), roll.at)
  const words = roll.dice.some((d) => d.word)
  const seal = traySeal(roll)
  const layout = layoutDice(roll.dice.length, fit.width, rowsBudget(window.innerHeight, fit.rest, fit.natural), words ? { width: fit.wordWidth, height: fit.wordHeight } : null, seal !== null)

  return <TrayView roll={roll} place={place} layout={layout} plan={plan} rolling={rolling} opening={opening} motion={motion} hint={hint} sent={sent} boxRef={box} rowRef={row} />
}

// The seal's total: only beside dice drawn, for a roll with a total.
const traySeal = (roll: Pick<TrayRoll, 'bold' | 'draw'>): SealTotal | null => (roll.draw === 'dice' ? sealOf(roll.bold) : null)

export type TrayRoll = Pick<Shown<Host>, 'id' | 'name' | 'formula' | 'line' | 'bold' | 'natural' | 'dice' | 'draw' | 'leaving'>

// The tray as drawn, from what Tray has measured and planned: no hooks, so a
// test can draw it.
// rolling: the dice tumble, the app allowing motion and no tap having settled
// them; the seal's press and the moment wait on it too (data-motion), so a
// tap that settles the dice lands the seal with them.
export function TrayView({
  roll,
  place,
  layout,
  plan,
  rolling,
  opening,
  motion,
  hint,
  sent,
  boxRef,
  rowRef,
}: {
  roll: TrayRoll
  place: 'band' | 'window'
  layout: DiceLayout
  plan: { delay: number; decoys: number[] }[]
  rolling: boolean
  opening: boolean
  motion: boolean
  hint: boolean
  sent: string | null
  boxRef?: Ref<HTMLDivElement>
  rowRef?: Ref<HTMLDivElement>
}) {
  const seal = traySeal(roll)
  const moment = seal ? roll.natural : undefined
  // When the last die lands, from the tap: the kept mark, the seal and the
  // moment wait for it (index.css).
  const last = plan.length ? landsAfter(plan.length) : 0
  return (
    <div
      ref={boxRef}
      className="dice-tray hud-frame"
      aria-hidden="true"
      data-place={place}
      data-opening={(opening && !roll.leaving) || undefined}
      data-closing={(roll.leaving && motion) || undefined}
      data-motion={rolling || undefined}
      data-moment={moment?.face}
      style={{ '--last': `${last}ms` } as CSSProperties}
    >
      <p className="dice-tray-name">{roll.name}</p>
      {/* With the dice off, a roll the tray is the only print of shows its
          name and words alone. */}
      {roll.draw === 'dice' && (
        <div
          ref={rowRef}
          className="dice-row"
          style={{ '--die-size': `${layout.size}px`, '--die-cell': `${layout.cell}px`, '--die-gap': `${layout.gap}px`, '--columns': layout.columns } as CSSProperties}
        >
          {roll.dice.map((d, i) => (
            <span
              key={`${roll.id}-${i}`}
              className="die-cell"
              data-sides={d.sides}
              data-rolling={rolling || undefined}
              data-dropped={d.dropped || undefined}
              data-natural={d.natural}
              style={{ '--delay': `${plan[i].delay}ms` } as CSSProperties}
            >
              <span className="die-shadow" />
              <Die die={d} size={layout.size} decoys={rolling ? plan[i].decoys : undefined} seed={i} />
              {d.kept && <span className="die-kept" />}
              {d.word && <span className="die-word">{d.word}</span>}
            </span>
          ))}
        </div>
      )}
      {/* Keyed by the roll, so a roll replacing another presses its own seal.
          Only a 20 or a 1 marks it: a Critical Hit on a 19 is words alone. */}
      {seal && <TraySeal key={`seal-${roll.id}`} total={seal} natural={isNatural(moment?.face) ? moment?.face : undefined} />}
      {moment && (
        <p key={`natural-${roll.id}`} className="tray-natural">
          {moment.words}
        </p>
      )}
      {(roll.formula || roll.line) && (
        <p className="dice-tray-line">
          {roll.formula}
          {roll.formula && roll.line ? ' · ' : ''}
          <Line text={roll.line} bold={roll.bold} />
        </p>
      )}
      {sent && <p className="dice-tray-sent">{sent}</p>}
      {hint && <p className="dice-tray-hint">No tumble: this device asks for less motion. Settings, Motion, Full brings it back.</p>}
    </div>
  )
}

// The total pressed into the seal, and under it the word after the total (a
// damage type). A natural 1 cracks the wax: a deep line with a lighter lip,
// under the numeral, which stays whole (index.css draws it). A total of
// three characters or more (a free roll of d100s reaches four) is marked,
// for its numeral to step down inside the seal.
const CRACK = 'M-2 36 L14 41 L22 35 L35 47 L47 42 L58 55 L67 50 L80 62 L88 58 L102 66 M58 55 L61 68 L57 77'

const digitsOf = (value: string) => (value.length >= 4 ? '4' : value.length === 3 ? '3' : undefined)

function TraySeal({ total, natural }: { total: SealTotal; natural?: Natural }) {
  return (
    <span className="tray-total">
      <span className="tray-seal">
        {natural === 1 && (
          <svg className="tray-crack" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            <path className="tray-crack-lip" d={CRACK} transform="translate(0 2.6)" />
            <path className="tray-crack-line" d={CRACK} />
          </svg>
        )}
        <span className="tray-total-value" data-digits={digitsOf(total.value)}>
          {total.value}
        </span>
      </span>
      {total.kind && <span className="tray-total-kind">{total.kind}</span>}
    </span>
  )
}

// The window's words, the total in bold.
function Line({ text, bold }: { text: string; bold: string | null }) {
  const at = bold ? text.lastIndexOf(bold) : -1
  if (!bold || at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <strong>{bold}</strong>
      {text.slice(at + bold.length)}
    </>
  )
}
