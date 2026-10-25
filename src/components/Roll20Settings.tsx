import { useState } from 'react'
import { copyCard, useBeyond20 } from '../roll20/app-roll20.ts'
import type { Roll20Settings } from '../settings.ts'
import { RuleCard, type Rule } from './RuleCard.tsx'

// Settings, Roll20 (rolls into Roll20, the user, 2026-10-18): where the
// Beyond20 extension has loaded into this page, every roll made in play goes
// to an open Roll20 tab by itself. The section says, in one line, whether it
// has; under it, "Setting up Roll20 with Beyond20" with its ⓘ opens the setup
// (user, 2026-10-18: a labelled line, since an ⓘ alone on the heading was too
// easy to miss), in numbered steps, with this site's own address to copy, so
// it reads right on a preview as on production. The clipboard is a switch, on
// any device: each roll copied as a Roll20 chat card, to paste.

// The address Beyond20's custom domains needs, ready to copy.
function CopyAddress({ address }: { address: string }) {
  const [said, setSaid] = useState('')
  return (
    <>
      <span className="roll20-address">{address}</span>{' '}
      <button type="button" className="secondary" onClick={() => copyCard(address, (ok) => setSaid(ok ? 'Copied.' : 'The browser would not copy it.'))}>
        Copy the address
      </button>{' '}
      <span role="status">{said}</span>
    </>
  )
}

const setupRule = (address: string): Rule => ({
  title: 'Sending rolls to Roll20',
  text: [
    'On a computer, the Beyond20 browser extension sends each roll you make in play to a Roll20 game open in another tab, with nothing to paste. Set it up once:',
    // Named, not linked (user, 2026-10-18): the player finds the official
    // extension in their own browser's store.
    '1. In your browser’s extension store, find the official Beyond20 extension and install it.',
    '2. Open its Options: its icon in the browser’s toolbar, then Options. Under the advanced options, find List of custom domains to load Beyond20.',
    <>
      3. Add this site’s address on a line of its own, and save: <CopyAddress address={address} />
    </>,
    '4. If the browser asks to let Beyond20 read this site, allow it.',
    '5. Reload this page. This section then says Beyond20 is on this page.',
  ],
  notes: [
    'Keep Roll20 open in another tab while you play. Each roll goes as a chat card: the character and the roll’s name, its formula and what it rolled. The dice are this app’s.',
    'On a phone, or without Beyond20, turn on Copy each roll for Roll20 and paste each roll into Roll20’s chat.',
  ],
})

// The line that opens the setup, drawn as a rule's name on the sheet is: its
// words, then the ⓘ.
function SetupLine({ address }: { address: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="roll20-setup">
      <button type="button" className="rule-name" onClick={() => setOpen(true)}>
        <span className="rule-name-label">Setting up Roll20 with Beyond20</span>
        <span aria-hidden="true" className="rule-name-mark">
          ⓘ
        </span>
      </button>
      {open && <RuleCard rule={setupRule(address)} onClose={() => setOpen(false)} />}
    </div>
  )
}

export function Roll20SettingsFields({ roll20, onChange }: { roll20: Roll20Settings; onChange: (next: Roll20Settings) => void }) {
  const found = useBeyond20()
  const address = `${window.location.origin}/*`
  return (
    <fieldset className="choice-cards">
      <legend>Roll20</legend>
      {found ? (
        <p className="meta roll20-found">Beyond20 is on this page: each roll you make in play goes to your open Roll20 tab.</p>
      ) : (
        <p className="meta roll20-missing">Beyond20 isn’t on this page, so rolls aren’t sent to Roll20.</p>
      )}
      <SetupLine address={address} />
      <label>
        <input type="checkbox" checked={roll20.copy} onChange={(e) => onChange({ ...roll20, copy: e.target.checked })} />
        <span>
          <strong>Copy each roll for Roll20</strong>
          <span>
            Each roll you make in play is copied as a Roll20 chat card: its name, its formula and what it rolled. Paste it into
            Roll20’s chat. The dice are this app’s. On, every roll replaces what you had copied.
          </span>
        </span>
      </label>
    </fieldset>
  )
}
