import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { APP_NAME } from './app-name.ts'
import { DiceDefs } from './components/DiceDefs.tsx'
import { trackOpeners } from './components/dialog.ts'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { JournalRoot } from './components/JournalDefs.tsx'
import { trackTray } from './dice/app-tray.ts'
import { applySettings, loadSettings, preloadNumerals } from './settings.ts'

// Before the first render, so the page never shows the wrong theme or font.
const settings = loadSettings()
applySettings(settings)
preloadNumerals(settings)
// Every window grows from the control pressed to open it.
trackOpeners()
// A tap settles the dice in the air, or ends the tray once they have landed.
trackTray()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DiceDefs />
    <JournalRoot />
    {/* The last resort: a crash anywhere shows a way back, not a blank page. */}
    <ErrorBoundary name={APP_NAME} whole>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
