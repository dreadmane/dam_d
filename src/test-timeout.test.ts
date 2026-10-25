// The time each test is allowed (vite.config.ts). On 2026-10-24 Cloudflare's
// production build of PR #37 failed because a test that takes milliseconds
// here, kit.test.ts's coin weight, took 5,057 ms on a stalled build machine,
// past Vitest's 5 s default, and the deploy never ran. The config allows 20 s,
// so one slow moment on the host can't stop a deploy; a test that truly hangs
// still fails, 15 s later.

import { expect, it } from 'vitest'
import config from '../vite.config.ts?raw'

it('allows each test 20 s, not the default 5 s', () => {
  expect(config).toMatch(/\btestTimeout: 20_000\b/)
})
