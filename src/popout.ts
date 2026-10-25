// Pop out (user, 2026-10-21): on the desktop, the sheet in a window of its
// own, a phone's width with no tabs or address bar, to stand beside a VTT. A
// browser's tabbed window keeps a minimum width for its tab strip; a pop-up
// has none, so it narrows into the shrink below a phone's width (index.css).
// The copies keep each other current as any two tabs do (save/changes.ts).

export const POPOUT_NAME = 'd-amp-d-sheet'
export const POPOUT_WIDTH = 360

type Media = (query: string) => boolean

// A mouse to drag the window with, and not the pop-out itself, where the
// item would only open the window it is in.
export function canPopOut(name: string, media: Media): boolean {
  return name !== POPOUT_NAME && media('(hover: hover) and (pointer: fine)')
}

// The pop-up's features: the phone's width, the screen's full height, at its
// left edge. Opening it again reuses the one window by name.
export function popOutFeatures(screen: { availHeight: number }): string {
  return `popup,width=${POPOUT_WIDTH},height=${screen.availHeight},left=0,top=0`
}

export function popOut(url: string): void {
  window.open(url, POPOUT_NAME, popOutFeatures(window.screen))?.focus()
}

export function canPopOutHere(): boolean {
  return canPopOut(window.name, (query) => window.matchMedia(query).matches)
}
