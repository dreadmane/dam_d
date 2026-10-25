import type { RollInput } from '../rolls/rolls.ts'

// Rolls into Roll20 (the user, 2026-10-18): a roll made here goes to a
// Roll20 game's chat as the app rolled it. Roll20 takes nothing from outside
// its own page, so the roll travels in the player's browser: through the
// Beyond20 extension where it is installed and this site is in its custom
// domains, and on the clipboard, when Settings turns that on, for a paste.
// Both carry the same card, written here. Pure: app-roll20.ts sends it.
//
// The card is Roll20's default roll template, which every game has with no
// sheet and no paid plan. The result goes in as words, never as an inline
// roll: [[4+9]] would draw a roll box the GM could take for Roll20's own
// dice. The research: domains/platform/reference/vtt-roll-integration-
// research-2026-10-18.md in the workspace.

// Braces would end a template row early and "=" a row's key, so neither may
// appear inside one; newlines would end the chat message.
const clean = (text: string) => text.replace(/[{}]/g, '').replace(/\s*\n\s*/g, ' ').trim()
const key = (text: string) => clean(text).replace(/=/g, '-')

// The card: the character and the roll's name as its title, the formula, then
// the window's own words, a row each ("Result", then "Result 2"…, as the
// advancement checks print a line per Skill).
export function roll20Card(character: string, roll: Pick<RollInput, 'name' | 'formula' | 'lines'>): string {
  const rows: [string, string][] = []
  if (roll.formula) rows.push(['Roll', roll.formula])
  roll.lines.forEach((line, i) => rows.push([i === 0 ? 'Result' : `Result ${i + 1}`, line]))
  return [`&{template:default} {{name=${clean(`${character}: ${roll.name}`)}}}`, ...rows.map(([k, v]) => `{{${key(k)}=${clean(v)}}}`)].join(' ')
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Beyond20's message for a roll already made (its docs/api.md, the
// rendered-roll action). Its Roll20 side posts a chat-message request's
// message into the chat as it stands, so the card above is what lands, the
// same as a paste. Foundry and Beyond20's other targets draw the html. The
// fields Beyond20 reads but a chat message has no use for are empty.
export function beyond20Message(name: string, roll: Pick<RollInput, 'name' | 'formula' | 'lines'>) {
  const message = roll20Card(name, roll)
  const character = { name, type: 'Character', settings: {} }
  const words = [roll.formula, ...roll.lines].filter(Boolean).map(escapeHtml).join(' · ')
  return {
    action: 'rendered-roll',
    request: { action: 'roll', type: 'chat-message', name: roll.name, message, roll: 0, character, whisper: 0 },
    title: roll.name,
    html: `<div class="beyond20-message"><strong>${escapeHtml(roll.name)}</strong><br>${words}</div>`,
    character: name,
    whisper: 0,
    play_sound: false,
    source: 'd-amp-d',
    attributes: {},
    description: '',
    attack_rolls: [],
    roll_info: [],
    damage_rolls: [],
    total_damages: {},
    open: false,
  }
}
