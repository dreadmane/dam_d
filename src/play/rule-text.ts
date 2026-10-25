// A rules record's text as the cards show it: paragraphs, its markdown
// emphasis dropped and its list marks made bullets, so a card shows plain
// prose.
export function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\*\*/g, '').replace(/^[-*] /gm, '• ').trim())
    .filter(Boolean)
}
