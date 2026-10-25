// Whether focus on an element holds the band open (Hud.tsx). Focus keeps the
// band open so a control the reader is using never vanishes from under the
// keyboard: a button, a link, a field. The screen's heading takes focus
// after an in-app navigation only to tell a screen reader the screen
// changed (ScreenHeading.tsx). It is no control, and holding the band open
// for it kept the band from folding, after a character was opened from the
// list, until the reader tapped the page (2026-10-23). The band's own toggle
// and the folded line's MENU never hold it: opening the band would take
// them away.

const CONTROLS = ['button', 'a[href]', 'input', 'select', 'textarea', 'summary', '[contenteditable="true"]'].join(', ')

export function holdsBandOpen(target: Pick<Element, 'matches'>, own: readonly (Element | null)[]): boolean {
  return target.matches(CONTROLS) && !own.includes(target as Element)
}
