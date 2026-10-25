// Tells the app's other open copies (tabs, the home-screen app beside a
// browser tab) that a character was saved, put back, or deleted, so a copy still
// showing the old character reloads it instead of saving that old character over
// the new one with its next edit (fix 2026-10-11: Put back the examples was
// undone by a second tab).
//
// One channel per copy, for sending and listening both: a BroadcastChannel
// never receives its own messages, so a copy's edits do not echo back as a
// reload of itself, which would race a quick second edit. Where the browser
// has no BroadcastChannel, announcing does nothing and copies fall back to
// re-reading when shown.

const NAME = 'd-amp-d:rosters'

export interface ChangeChannel {
  announce(id: string): void
  listen(handler: (id: string) => void): () => void
}

export function broadcastChanges(make: (name: string) => BroadcastChannel | null = defaultChannel): ChangeChannel {
  const channel = make(NAME)
  return {
    announce(id) {
      channel?.postMessage({ id })
    },
    listen(handler) {
      if (!channel) return () => {}
      const receive = (event: MessageEvent<{ id?: unknown }>) => {
        if (typeof event.data?.id === 'string') handler(event.data.id)
      }
      channel.addEventListener('message', receive)
      return () => channel.removeEventListener('message', receive)
    },
  }
}

function defaultChannel(name: string): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(name)
}
