// The app's stylesheet as a list of rules, for the tests that hold it to the
// design system: each rule's selectors and its declarations, comments
// removed. A rule inside @media keeps its own selectors; the at-rule itself is
// not listed. A selector list splits only at its own commas, so a selector
// written with :is(a, b) stays whole.

export interface CssRule {
  selectors: string[]
  body: string
}

function splitSelectors(list: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === ',' && depth === 0) {
      parts.push(list.slice(start, i))
      start = i + 1
    }
  }
  parts.push(list.slice(start))
  return parts.map((s) => s.trim())
}

export function cssRules(css: string): CssRule[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selectors: splitSelectors(m[1]),
    body: m[2],
  }))
}

// Each style rule's selectors with the @media conditions round it, for a
// test that needs to know where a rule applies, such as a hover that waits
// for a pointer that hovers. No brace in the stylesheet sits inside quotes,
// so the braces alone say where each block opens and closes.
export interface MediaRule {
  selectors: string[]
  media: string[]
}

export function cssRulesInMedia(css: string): MediaRule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: MediaRule[] = []
  const open: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '{') {
      const prelude = text.slice(start, i).trim()
      if (!prelude.startsWith('@')) rules.push({ selectors: splitSelectors(prelude), media: open.filter((p) => p.startsWith('@media')) })
      open.push(prelude)
      start = i + 1
    } else if (c === '}') {
      open.pop()
      start = i + 1
    } else if (c === ';') start = i + 1
  }
  return rules
}
