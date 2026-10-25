// Which build this is, for a bug report: Settings shows its commit, the day
// it was built, and its branch when that isn't main (a preview). The build
// writes it to its own file, build.json (vite.config.ts), rather than into
// the bundle, so the bundle's file names still change only with its code:
// a dependency update that changes nothing shows as the same files.

export interface BuildInfo {
  commit: string
  branch: string
  builtOn: string
}

// The line Settings shows; null, when there is no build file to read (the
// development server, or a site that couldn't be reached).
export function describeBuild(build: BuildInfo | null): string {
  if (!build) return 'App build: none recorded, as on the development server.'
  const branch = build.branch && build.branch !== 'main' ? ` on branch ${build.branch}` : ''
  return `App build ${build.commit.slice(0, 7)}${branch}, ${build.builtOn}.`
}

function isBuildInfo(value: unknown): value is BuildInfo {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.commit === 'string' && v.commit !== '' && typeof v.branch === 'string' && typeof v.builtOn === 'string'
}

// Reads build.json from the site. Where there is none, the host answers with
// the app's page instead, which isn't JSON: that, and any failure, is null.
export async function loadBuildInfo(): Promise<BuildInfo | null> {
  try {
    const response = await fetch('/build.json', { cache: 'no-cache' })
    if (!response.ok) return null
    const value: unknown = await response.json()
    return isBuildInfo(value) ? value : null
  } catch {
    return null
  }
}
