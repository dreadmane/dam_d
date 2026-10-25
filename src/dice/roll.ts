// Rolling dice from notation ("1d12", "2d4", "d20"): the one place the app
// makes a random roll, for the dice tray and the Dice menu.

export type Random = () => number

// crypto rather than Math.random: an even spread across faces matters when a
// result is taken from the roll.
const cryptoRandom: Random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

export function dieSides(notation: string): number {
  const m = /^1d(\d+)$/.exec(notation)
  if (!m) throw new Error(`${notation} is not a single die`)
  return Number(m[1])
}

// A face from 1 to the die's sides.
export function rollDie(notation: string, random: Random = cryptoRandom): number {
  return 1 + Math.floor(random() * dieSides(notation))
}

// Every die of a notation, "2d4" as two d4s, with their sum: so the dice tray
// can show the faces a roll that only fills a field was made of.
export function rollFaces(notation: string, random: Random = cryptoRandom): { faces: number[]; total: number } {
  const m = /^(\d*)d(\d+)$/.exec(notation.trim())
  if (!m) throw new Error(`${notation} is not dice notation`)
  const faces = Array.from({ length: Number(m[1] || 1) }, () => rollDie(`1d${m[2]}`, random))
  return { faces, total: faces.reduce((a, b) => a + b, 0) }
}
