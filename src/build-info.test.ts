import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeBuild, loadBuildInfo } from './build-info.ts'

const commit = '9a47be3c0ffee0123456789abcdef0123456789a'

describe('describeBuild', () => {
  it('names production by its commit and day, without a branch', () => {
    expect(describeBuild({ commit, branch: 'main', builtOn: '2026-10-25' })).toBe('App build 9a47be3, 2026-10-25.')
  })

  it('names a preview by its branch too', () => {
    expect(describeBuild({ commit, branch: 'feature/settings-about-build', builtOn: '2026-10-25' })).toBe(
      'App build 9a47be3 on branch feature/settings-about-build, 2026-10-25.',
    )
  })

  it('says so when no build is recorded', () => {
    expect(describeBuild(null)).toBe('App build: none recorded, as on the development server.')
  })
})

describe('loadBuildInfo', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads the build file', async () => {
    const build = { commit, branch: 'main', builtOn: '2026-10-25' }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(build))))
    expect(await loadBuildInfo()).toEqual(build)
  })

  it('is null where the host answers with the app’s page instead', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html><html></html>', { headers: { 'content-type': 'text/html' } })))
    expect(await loadBuildInfo()).toBeNull()
  })

  it('is null when the site can’t be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))
    expect(await loadBuildInfo()).toBeNull()
  })

  it('is null for a file without a commit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ commit: '', branch: 'main', builtOn: '2026-10-25' }))))
    expect(await loadBuildInfo()).toBeNull()
  })
})
