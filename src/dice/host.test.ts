import { describe, expect, it } from 'vitest'
import { handedBack, trayHost } from './host.ts'

const dialog = (name: string, closing = false) => ({ name, hasAttribute: (a: string) => closing && a === 'data-closing' })

describe('the tray’s host', () => {
  it('is the band when no window is open', () => {
    expect(trayHost([])).toBe('band')
  })

  it('is the window on top', () => {
    const top = dialog('quick roll')
    expect(trayHost([dialog('slot'), top])).toBe(top)
  })

  it('skips a window shrinking closed, so Roll in a quick roll shows its result under the band', () => {
    expect(trayHost([dialog('quick roll', true)])).toBe('band')
  })

  it('skips a closing window for the one beneath it', () => {
    const under = dialog('spell')
    expect(trayHost([under, dialog('quick roll', true)])).toBe(under)
  })
})

describe('focus handed back by a closed window', () => {
  const inWindow = (open: boolean) => ({ closest: (s: string) => (s === 'dialog' ? { open } : null) })

  it('is the case when the control that rolled sat in a window now closed', () => {
    expect(handedBack(inWindow(false))).toBe(true)
  })

  it('is not while that window is open', () => {
    expect(handedBack(inWindow(true))).toBe(false)
  })

  it('is not for a control outside any window, or none', () => {
    expect(handedBack({ closest: () => null })).toBe(false)
    expect(handedBack(null)).toBe(false)
  })
})
