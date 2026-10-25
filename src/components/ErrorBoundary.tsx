import { Component, type ErrorInfo, type ReactNode } from 'react'

// Catches a crash while drawing one part of the page, so the rest keeps
// working (without a boundary, React unmounts the whole app and the screen
// goes blank). React still offers this only as a class component.
//
// Copy is plain, never the System's voice (spec §6.1: errors are straight).
// The character is safe either way: every change is saved as it happens, and a
// crash while drawing changes nothing.

interface Props {
  // What broke, in words: "The Inventory".
  name: string
  // The whole-app boundary offers Reload rather than Try again, since there
  // is nothing around it left to keep working.
  whole?: boolean
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console for whoever debugs it; the screen stays calm.
    console.error(`${this.props.name} stopped:`, error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const { name, whole } = this.props
    return (
      <section className="error-boundary" role="alert">
        <h2>{name} stopped working</h2>
        <p>{whole ? 'Something went wrong drawing this page.' : 'Something went wrong drawing this part of the page. The rest still works.'} Your character is saved: nothing was lost.</p>
        <div className="actions">
          {whole ? (
            <button type="button" className="primary" onClick={() => location.reload()}>
              Reload
            </button>
          ) : (
            <button type="button" className="secondary" onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          )}
        </div>
        <details>
          <summary>Details, for a bug report</summary>
          <pre>{error.message}</pre>
        </details>
      </section>
    )
  }
}
