// One readout for everything examined (review A15, carried from Crawler
// Interface): a window that shows one thing opens with its name line, then
// short `Label: value.` lines, each a sentence with its full stop. Pure, so
// each kind is tested; WindowHeader draws them.

import type { Item } from '../save/record.ts'

export interface Readout {
  name: string
  lines: string[]
}

// "Label: value." A value that already ends a sentence keeps its own stop.
const line = (label: string, value: string) => `${label}: ${/[.!?]$/.test(value) ? value : `${value}.`}`

// An item: how many, what each weighs, and its tags, as the player recorded
// them.
export function itemReadout(item: Item): Readout {
  const lines: string[] = []
  if (item.quantity !== 1) lines.push(line('Quantity', item.quantity.toLocaleString()))
  if (item.weight !== undefined) lines.push(line('Weight', `${item.weight.toLocaleString()} lb${item.quantity !== 1 ? ' each' : ''}`))
  if (item.tags.length > 0) lines.push(line('Tags', item.tags.join(', ')))
  return { name: item.name || 'Unnamed item', lines }
}
