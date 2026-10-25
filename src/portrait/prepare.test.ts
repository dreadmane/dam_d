// The parts of preparing a photo that need no browser: the stored size, and
// what the player is told when a file cannot be used. Decoding and encoding
// are checked in a browser.

import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_FILE_BYTES, refusal } from './prepare.ts'

describe('preparing a photo', () => {
  it('shrinks the long side to 1024, keeps the shape, and never enlarges', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1024, height: 768 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 768, height: 1024 })
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
    expect(fitWithin(10000, 5)).toEqual({ width: 1024, height: 1 })
  })

  it('explains a file it cannot use, naming HEIC where that is the reason', () => {
    const file = (name: string, type: string, size = 1000) => ({ name, type, size })
    expect(refusal(file('a.jpg', 'image/jpeg'), true)).toBeNull()
    expect(refusal(file('IMG_1.HEIC', ''), false)).toContain('HEIC')
    expect(refusal(file('b.heif', 'image/heif'), false)).toContain('HEIC')
    expect(refusal(file('notes.txt', 'text/plain'), false)).toContain('JPEG, PNG, or WebP')
    expect(refusal(file('huge.jpg', 'image/jpeg', MAX_FILE_BYTES + 1), true)).toContain('too large')
  })
})
