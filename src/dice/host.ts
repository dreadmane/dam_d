// Where a roll's tray shows: the window on top, or under the band when no
// window is open. A window already shrinking closed is not on top: the roll
// that closed it (Roll in a quick roll's window) would grow its tray inside
// it, hidden while it shrinks and gone when it unmounts (index.css hides a
// tray in a closing window), so its result never showed.

export type Host<E> = E | 'band'

export function trayHost<E extends Pick<Element, 'hasAttribute'>>(open: readonly E[]): Host<E> {
  return open.filter((d) => !d.hasAttribute('data-closing')).at(-1) ?? 'band'
}

// Whether the control that rolled sat in a window that has since closed, so
// a focus move now is that window handing focus back to its opener (the
// browser does it as the dialog closes), not the player moving on. The tray
// takes that one move as part of the roll and stays.
type Control = { closest?: (selector: string) => { open: boolean } | null } | null

export function handedBack(control: unknown): boolean {
  const window = (control as Control)?.closest?.('dialog')
  return window != null && !window.open
}
