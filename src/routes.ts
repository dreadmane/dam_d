// The app's screens as URLs, on the browser's history API with no router
// library. Real URLs make the phone's back button move between screens rather
// than leave the app, and let a character's page be reloaded or bookmarked.
// Cloudflare's SPA fallback serves index.html for every path, so any of these
// can be opened directly.

import { useEffect, useState } from 'react'

export type Route =
  // The bare site: resolved to the most recent character, or the list if none.
  | { screen: 'home' }
  | { screen: 'roster' }
  // Opened from a character's screens, Settings carries that character, for
  // its own section: export, print, copy, delete.
  | { screen: 'settings'; id?: string }
  | { screen: 'character'; id: string }
  // The level ladder (the spec §3.1 A): starting at any level, and the
  // levels to change later; with up, a new rung on top (level up, §3.2).
  | { screen: 'levels'; id: string; up?: boolean }
  // The guided build from level 1 (§3.1 B), one step per screen.
  | { screen: 'build'; id: string; step: string }
  // The character on one plain page, for printing or saving as a PDF.
  | { screen: 'print'; id: string }
  | { screen: 'not-found'; path: string }

// The list was /crawlers in Crawler Interface, which d-amp-d was forked from.
// A bookmark or a link saved before the rename still arrives: the old prefix
// reads as the new one, and the app replaces the address (useRoute).
const OLD_PREFIX = 'crawlers'
const PREFIX = 'characters'

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === OLD_PREFIX) parts[0] = PREFIX
  if (parts.length === 0) return { screen: 'home' }
  if (parts[0] === PREFIX && parts.length === 1) return { screen: 'roster' }
  if (parts[0] === 'settings' && parts.length === 1) return { screen: 'settings' }
  if (parts[0] === PREFIX && parts.length === 2) return { screen: 'character', id: decodeURIComponent(parts[1]) }
  if (parts[0] === PREFIX && parts[2] === 'settings' && parts.length === 3) return { screen: 'settings', id: decodeURIComponent(parts[1]) }
  if (parts[0] === PREFIX && parts[2] === 'levels' && parts.length === 3) return { screen: 'levels', id: decodeURIComponent(parts[1]) }
  if (parts[0] === PREFIX && parts[2] === 'level-up' && parts.length === 3) return { screen: 'levels', id: decodeURIComponent(parts[1]), up: true }
  if (parts[0] === PREFIX && parts[2] === 'build' && parts.length === 4) return { screen: 'build', id: decodeURIComponent(parts[1]), step: decodeURIComponent(parts[3]) }
  if (parts[0] === PREFIX && parts[2] === 'print' && parts.length === 3) return { screen: 'print', id: decodeURIComponent(parts[1]) }
  return { screen: 'not-found', path: pathname }
}

export function pathFor(route: Route): string {
  switch (route.screen) {
    case 'home':
      return '/'
    case 'roster':
      return `/${PREFIX}`
    case 'settings':
      return route.id ? `/${PREFIX}/${encodeURIComponent(route.id)}/settings` : '/settings'
    case 'character':
      return `/${PREFIX}/${encodeURIComponent(route.id)}`
    case 'levels':
      return `/${PREFIX}/${encodeURIComponent(route.id)}/${route.up ? 'level-up' : 'levels'}`
    case 'build':
      return `/${PREFIX}/${encodeURIComponent(route.id)}/build/${encodeURIComponent(route.step)}`
    case 'print':
      return `/${PREFIX}/${encodeURIComponent(route.id)}/print`
    case 'not-found':
      return route.path
  }
}

// An address under the old prefix, as the new one, or null if it is not one.
export function redirectFor(pathname: string): string | null {
  if (pathname.split('/').filter(Boolean)[0] !== OLD_PREFIX) return null
  const route = parseRoute(pathname)
  return route.screen === 'not-found' ? null : pathFor(route)
}

// pushState changes the URL without telling anyone, so navigate() announces
// it; the back and forward buttons announce themselves with popstate.
const CHANGE = 'd-amp-d:navigate'

// Whether the user has moved between screens in this page load. A screen
// moves focus to its heading only then, so a screen reader hears the new
// screen, while a fresh page load keeps the browser's own starting point.
let navigatedInApp = false
export const hasNavigatedInApp = () => navigatedInApp

// replace: true swaps the current history entry instead of adding one, so
// Back does not return to a page that no longer applies (a redirect, a
// deleted character). redirect: true also leaves focus alone, because the
// user did not ask to move.
export function navigate(route: Route, { replace = false, redirect = false } = {}) {
  if (!redirect) navigatedInApp = true
  const path = pathFor(route)
  if (replace) history.replaceState(null, '', path)
  else history.pushState(null, '', path)
  window.dispatchEvent(new Event(CHANGE))
  window.scrollTo(0, 0)
}

// The old prefix's address is replaced in place as the page reads it, so the
// address bar and any bookmark made now say /characters.
function current(): Route {
  const moved = redirectFor(location.pathname)
  if (moved) history.replaceState(history.state, '', moved + location.search + location.hash)
  return parseRoute(location.pathname)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(current)
  useEffect(() => {
    const update = () => setRoute(current())
    const back = () => {
      navigatedInApp = true
      update()
    }
    window.addEventListener('popstate', back)
    window.addEventListener(CHANGE, update)
    return () => {
      window.removeEventListener('popstate', back)
      window.removeEventListener(CHANGE, update)
    }
  }, [])
  return route
}
