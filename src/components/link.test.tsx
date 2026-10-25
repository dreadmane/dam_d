// Link (Link.tsx) passes aria-current to its anchor. Build's step rail marks
// its current step with aria-current="step", which index.css draws bold with
// the accent underline and a screen reader announces; Link dropped it, so
// neither ever showed (found 2026-10-22, the Journal pages concept).

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Link } from './Link.tsx'

describe('Link', () => {
  it('passes aria-current through to the anchor', () => {
    const html = renderToStaticMarkup(
      <Link to={{ screen: 'build', id: 'x', step: 'class' }} aria-current="step">
        Class
      </Link>,
    )
    expect(html).toContain('aria-current="step"')
  })

  it('leaves aria-current off when none is given', () => {
    const html = renderToStaticMarkup(<Link to={{ screen: 'build', id: 'x', step: 'origin' }}>Origin</Link>)
    expect(html).not.toContain('aria-current')
  })
})
