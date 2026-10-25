import { describe, expect, it } from 'vitest'
import { parseRoute, pathFor, redirectFor, type Route } from './routes.ts'

describe('routes', () => {
  it.each<[string, Route]>([
    ['/', { screen: 'home' }],
    ['/characters', { screen: 'roster' }],
    ['/settings', { screen: 'settings' }],
    ['/characters/', { screen: 'roster' }],
    ['/characters/0b6f2c1e-7d4a', { screen: 'character', id: '0b6f2c1e-7d4a' }],
    ['/characters/a/print', { screen: 'print', id: 'a' }],
    ['/characters/a/settings', { screen: 'settings', id: 'a' }],
    ['/characters/a/settings/x', { screen: 'not-found', path: '/characters/a/settings/x' }],
    ['/characters/a/create/path', { screen: 'not-found', path: '/characters/a/create/path' }],
    ['/characters/a/tools', { screen: 'not-found', path: '/characters/a/tools' }],
    ['/characters/a/b', { screen: 'not-found', path: '/characters/a/b' }],
    ['/nope', { screen: 'not-found', path: '/nope' }],
  ])('%s', (path, route) => {
    expect(parseRoute(path)).toEqual(route)
  })

  it('round-trips every screen, including an id that needs escaping', () => {
    for (const route of [
      { screen: 'home' },
      { screen: 'roster' },
      { screen: 'print', id: 'a b' },
      { screen: 'settings' },
      { screen: 'settings', id: 'a b/c' },
      { screen: 'character', id: 'a b/c' },
      { screen: 'levels', id: 'a b' },
      { screen: 'levels', id: 'a b', up: true },
      { screen: 'build', id: 'a b', step: 'scores' },
    ] as Route[]) {
      expect(parseRoute(pathFor(route))).toEqual(route)
    }
  })

  it('reads the old /crawlers addresses as /characters, and redirects them', () => {
    expect(parseRoute('/crawlers')).toEqual({ screen: 'roster' })
    expect(parseRoute('/crawlers/a')).toEqual({ screen: 'character', id: 'a' })
    expect(redirectFor('/crawlers')).toBe('/characters')
    expect(redirectFor('/crawlers/a%20b/print')).toBe('/characters/a%20b/print')
    expect(redirectFor('/crawlers/a/third-floor')).toBeNull()
    expect(redirectFor('/characters/a')).toBeNull()
  })
})
