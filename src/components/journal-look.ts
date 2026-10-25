// Whether the Journal look is on: the root's data-look, which settings.ts
// (applySettings) sets and index.css reads, so this agrees with what is drawn.
export function journalOn(root: Pick<Element, 'getAttribute'> = document.documentElement): boolean {
  return root.getAttribute('data-look') === 'journal'
}

// Watched, so a switch of Look in Settings is seen at once, on the Settings
// page itself.
export function watchLook(onChange: () => void): () => void {
  const watch = new MutationObserver(onChange)
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-look'] })
  return () => watch.disconnect()
}
