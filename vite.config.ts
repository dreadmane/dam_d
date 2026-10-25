import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { configDefaults } from 'vitest/config'

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// Which build this is (src/build-info.ts, shown in Settings), written to a
// file of its own, build.json, so the bundle's file names still change only
// with its code. Workers Builds names the commit and branch; a local build
// asks git. The day is UTC's, the build machine's.
function buildInfo(): Plugin {
  return {
    name: 'build-info',
    apply: 'build',
    generateBundle() {
      const build = {
        commit: process.env.WORKERS_CI_COMMIT_SHA || git('rev-parse HEAD') || 'unknown',
        branch: process.env.WORKERS_CI_BRANCH || git('rev-parse --abbrev-ref HEAD'),
        builtOn: new Date().toISOString().slice(0, 10),
      }
      this.emitFile({ type: 'asset', fileName: 'build.json', source: `${JSON.stringify(build)}\n` })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), buildInfo()],
  test: {
    // Claude Code's worktrees are full checkouts inside the repo; without
    // this, Vitest runs their copies of the tests too.
    exclude: [...configDefaults.exclude, '.claude/**'],
    // Vitest hands a test an empty string for a stylesheet; the main one and
    // its tokens come through as written, so a test can read layout rules.
    css: { include: [/src\/index\.css/, /src\/styles\/tokens\.css/] },
    // A test may take 20 s, not Vitest's 5 s: on 2026-10-24 a test that takes
    // milliseconds here took 5,057 ms on a stalled Cloudflare build machine,
    // and the failed test stopped the production deploy (src/test-timeout.test.ts).
    testTimeout: 20_000,
  },
})
