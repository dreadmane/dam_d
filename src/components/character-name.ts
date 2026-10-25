// How a character is named where the page is about them: the name, trimmed,
// or "Unnamed character" before the player gives one. One definition, used
// by the band's heading, the page's title, the list's rows and the rolls.

export const UNNAMED = 'Unnamed character'

export const named = (name: string) => name.trim() !== ''

export const characterName = (name: string) => (named(name) ? name.trim() : UNNAMED)
