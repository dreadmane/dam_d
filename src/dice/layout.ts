// How the dice of one roll sit in the tray (the dice roll, approved by the
// user 2026-10-14): one die large, a pair a little smaller, then smaller
// sizes as the count grows, so a single row holds up to six dice and two rows
// hold up to sixteen. A size steps down before a row is added, and the rows
// are balanced: eight dice are four and four, never seven and one. The numeral
// is 42 percent of the die and never under the app's 13 px floor. A word under
// the dice (kept, rerolled) widens every column to the widest word and adds
// its line to every row, so the dice stay evenly spaced inside the tray.
//
// Beside the seal that shows the total (the dice total concept, user
// 2026-10-23), five or six dice sit in two rows of three at 48 px, balanced
// (five is three and two), where one row would have to step them down to 36
// or 32 px to fit the narrower room. The two rows give way to the height: on
// a short screen (a phone turned on its side) whose tray has no room for
// them, the dice take one row at the size it fits, so they keep the largest
// size at which either arrangement fits, two rows of three where both would.
// Every other count keeps its rule, in the room the seal leaves.

// The tray's height (the design brief's min(200px, 40vh)): the dice are sized
// to fit what the tray's other parts leave of 200 px, or of two fifths of a
// shorter screen. A roll whose dice cannot fit that even at the smallest size
// grows the tray rather than cut off its line, never past two fifths of the
// screen (index.css's max-height).
export const TRAY_HEIGHT = 200
export const TRAY_SHARE = 0.4

// The height the dice rows may take: what the tray's other parts (its
// padding and frame, the name, the line) leave of its height. grows: a part
// that adds its height to the tray's rather than take it from the dice, a
// natural's words (the dice total concept, user 2026-10-23: the tray grows
// by their line), within two fifths of the screen all the same.
export function rowsBudget(screenHeight: number, rest: number, grows = 0): number {
  return Math.min(TRAY_HEIGHT, screenHeight * TRAY_SHARE - grows) - rest
}

export interface DiceLayout {
  size: number
  gap: number
  columns: number
  rows: number
  numeral: number
  // A column's width: the die, or the widest word under one.
  cell: number
}

// The word under a die: the widest one's width, and the height its line adds.
export interface Under {
  width: number
  height: number
}

const SIZES = [80, 72, 48, 44, 36, 32] as const

function startingSize(count: number): number {
  if (count <= 1) return 80
  if (count === 2) return 72
  if (count <= 6) return 48
  if (count <= 10) return 44
  if (count <= 16) return 36
  return 32
}

// The rows a count is meant to take before the size steps down.
const intendedRows = (count: number) => (count <= 6 ? 1 : count <= 16 ? 2 : Infinity)
// Beside the seal, five and six are first offered two rows of three.
const besideSeal = (count: number, seal: boolean) => seal && (count === 5 || count === 6)

// width: the dice row's own width; heightBudget: the height the rows may
// take (rowsBudget); under: the word under the dice, if any; seal: whether the
// seal stands beside them.
export function layoutDice(count: number, width: number, heightBudget = Infinity, under: Under | null = null, seal = false): DiceLayout {
  const n = Math.max(1, count)
  let i = SIZES.indexOf(startingSize(n) as (typeof SIZES)[number])
  for (;;) {
    const size = SIZES[i]
    const gap = size >= 44 ? 8 : 6
    const cell = Math.max(size, Math.ceil(under?.width ?? 0))
    const fit = Math.max(1, Math.floor((width + gap) / (cell + gap)))
    const heightOf = (rows: number) => rows * (size + (under?.height ?? 0)) + (rows - 1) * gap
    const drawn = (columns: number, rows: number): DiceLayout => ({ size, gap, columns, rows, numeral: Math.max(13, Math.round(size * 0.42)), cell })
    if (besideSeal(n, seal) && fit >= 3 && heightOf(2) <= heightBudget) return drawn(3, 2)
    const rows = Math.ceil(n / fit)
    const last = i === SIZES.length - 1
    if (last || (rows <= intendedRows(n) && heightOf(rows) <= heightBudget)) return drawn(Math.ceil(n / rows), rows)
    i++
  }
}
