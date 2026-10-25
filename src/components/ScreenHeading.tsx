import { useEffect, useRef, type ReactNode } from 'react'
import { hasNavigatedInApp } from '../routes.ts'

// Every screen's h1. After an in-app navigation it takes focus, which is how a
// screen-reader user learns the screen changed: a single-page app otherwise
// swaps content silently. className styles it, as the Finish screen does with
// its readout's name line.
export function ScreenHeading({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (hasNavigatedInApp()) ref.current?.focus()
  }, [])
  return (
    <h1 ref={ref} tabIndex={-1} className={className}>
      {children}
    </h1>
  )
}
