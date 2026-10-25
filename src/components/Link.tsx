import type { ReactNode } from 'react'
import { navigate, pathFor, type Route } from '../routes.ts'

// A real <a href>, so long-press, open in a new tab, and copying the link all
// work; a plain click navigates in place without reloading the page.
// onFollow runs just before that in-place step, never for a new tab.
export function Link({
  to,
  className,
  children,
  onFollow,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: {
  to: Route
  className?: string
  children: ReactNode
  onFollow?: () => void
  // For a link whose content is only an icon.
  'aria-label'?: string
  // For a link to where the reader already is: Build's step rail marks its
  // current step with "step", which index.css draws and a screen reader says.
  'aria-current'?: 'page' | 'step' | 'location' | boolean
}) {
  return (
    <a
      href={pathFor(to)}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onFollow?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
