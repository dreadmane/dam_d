// Rolling dice from notation ("1d12", "2d4", "d20"): the one place the app
// makes a random roll, for the dice tray and the Dice menu.

// A draw in [0, 1), which a test passes in to choose the faces. A roll
// without one draws from crypto.
export type Random = () => number

export function dieSides(notation: string): number {
  const m = /^1d(\d+)$/.exec(notation)
  if (!m) throw new Error(`${notation} is not a single die`)
  return Number(m[1])
}

// A face from crypto, rather than Math.random, with every face equally
// likely: an even spread across faces matters when a result is taken from
// the roll. A 32-bit draw is masked to the fewest bits that cover the die (5,
// 0 to 31, for a d20), and a draw past the last face is drawn again. Scaling
// the draw instead, by a division or a remainder, favours some faces
// slightly whenever the die's size doesn't divide 2³² (#43).
function cryptoFace(sides: number): number {
  const mask = (1 << (32 - Math.clz32(sides - 1))) - 1
  const draw = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(draw)
    const n = draw[0] & mask
    if (n < sides) return n + 1
  }
}

// A face from 1 to the die's sides.
export function rollDie(notation: string, random?: Random): number {
  const sides = dieSides(notation)
  return random ? 1 + Math.floor(random() * sides) : cryptoFace(sides)
}

// Every die of a notation, "2d4" as two d4s, with their sum: so the dice tray
// can show the faces a roll that only fills a field was made of.
export function rollFaces(notation: string, random?: Random): { faces: number[]; total: number } {
  const m = /^(\d*)d(\d+)$/.exec(notation.trim())
  if (!m) throw new Error(`${notation} is not dice notation`)
  const faces = Array.from({ length: Number(m[1] || 1) }, () => rollDie(`1d${m[2]}`, random))
  return { faces, total: faces.reduce((a, b) => a + b, 0) }
}
