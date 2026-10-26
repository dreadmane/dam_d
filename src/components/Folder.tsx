import { useState } from 'react'
import { noticeStore, useNotices } from '../notify/app-notices.ts'
import { KEEP } from '../notify/notices.ts'
import { stamp } from '../notify/stamp.ts'
import { useToday } from '../today.ts'
import { Glyph } from './Glyph.tsx'
import { useHudDialog } from './dialog.ts'
import { Window, WindowHeader } from './Window.tsx'

// The notification folder (A1), at the band's top left (carried from Crawler
// Interface): the unread count on it, a single pulse
// when one arrives (never a blink, WCAG 2.2.2; none under reduced motion), and
// the folder itself, a window listing them newest first, each stamped with
// the time it fired. A character's folder holds its
// notifications; the character list's holds the system messages (owner null).

export function FolderButton({ owner, ownerName }: { owner: string | null; ownerName: string }) {
  const { list, unread } = useNotices(owner)
  const [open, setOpen] = useState(false)
  // The newest notification already pulsed for (at first, the newest when
  // this screen opened): a newer one pulses the badge once, by mounting it
  // afresh. Cleared as the pulse ends, so the band reopening over the badge
  // does not replay it.
  const newest = list[0]?.id ?? null
  const [pulsed, setPulsed] = useState(newest)
  return (
    <>
      <button
        type="button"
        className="folder-button"
        aria-haspopup="dialog"
        aria-label={`Notifications, ${unread === 0 ? 'none' : unread} unread`}
        onClick={() => setOpen(true)}
      >
        <Glyph name="folder" size={22} />
        {unread > 0 && (
          <span key={newest} className="folder-badge" data-pulse={newest !== pulsed || undefined} onAnimationEnd={() => setPulsed(newest)} aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && <FolderWindow owner={owner} ownerName={ownerName} onClose={() => setOpen(false)} />}
    </>
  )
}

// Read-only, so a tap outside closes it. Mark all read is the one action.
function FolderWindow({ owner, ownerName, onClose }: { owner: string | null; ownerName: string; onClose: () => void }) {
  const { list, unread } = useNotices(owner)
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const now = useToday()
  return (
    <Window dialog={dialog} className="folder-window" labelledBy="folder-heading">
      <WindowHeader id="folder-heading" title="Notifications" />
      <p className="meta folder-subtitle">
        {ownerName} · newest first · {unread === 0 ? 'none unread' : `${unread} unread`}
      </p>
      {list.length === 0 ? (
        <p className="empty">No notifications yet.</p>
      ) : (
        <ol className="folder-list">
          {list.map((n) => (
            <li key={n.id} data-read={n.read || undefined}>
              {n.read ? <span className="folder-unread" aria-hidden="true" /> : <span className="folder-unread" role="img" aria-label="Unread" />}
              <div>
                <p className="folder-head">
                  <span className="folder-kicker">{n.kicker}</span>
                  <span className="folder-stamp">{stamp(new Date(n.at), now)}</span>
                </p>
                {n.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="folder-foot">
        <p className="meta">Kept on this device: the last {KEEP}{owner ? ' for this character' : ''}.</p>
        <button type="button" className="secondary" disabled={unread === 0} onClick={() => noticeStore.readAll(owner)}>
          Mark all read
        </button>
      </div>
    </Window>
  )
}
