// The crop arithmetic: the square stays inside the photo, drags move it the
// way the hand moves, and the image is placed so the square fills the frame.

import { describe, expect, it } from 'vitest'
import { CENTRED, clampCrop, imageStyle, panBy, viewSquare, zoomTo } from './crop.ts'

describe('crop', () => {
  it('shows the largest centred square at zoom 1, whatever the shape', () => {
    expect(viewSquare(200, 100, CENTRED)).toEqual({ left: 50, top: 0, side: 100 })
    expect(viewSquare(100, 300, CENTRED)).toEqual({ left: 0, top: 100, side: 100 })
    expect(viewSquare(100, 100, CENTRED)).toEqual({ left: 0, top: 0, side: 100 })
  })

  it('keeps the square inside the photo and the zoom between 1 and 4', () => {
    expect(clampCrop(200, 100, { x: 0, y: 0, zoom: 1 })).toEqual({ x: 0.25, y: 0.5, zoom: 1 })
    expect(clampCrop(200, 100, { x: 1, y: 1, zoom: 2 })).toEqual({ x: 0.875, y: 0.75, zoom: 2 })
    expect(clampCrop(100, 100, { x: 0.5, y: 0.5, zoom: 9 }).zoom).toBe(4)
    expect(clampCrop(100, 100, { x: 0.5, y: 0.5, zoom: 0.2 }).zoom).toBe(1)
  })

  it('moves the view against the drag: dragging the photo right shows more of its left', () => {
    const start = { x: 0.5, y: 0.5, zoom: 1 }
    // A 200×100 photo in a 100 px frame shows 100 photo px, one per screen px.
    const moved = panBy(200, 100, start, 20, 0, 100)
    expect(moved.x).toBeCloseTo(0.4)
    expect(moved.y).toBe(0.5) // no room to move vertically at zoom 1
    expect(panBy(200, 100, start, -1000, 0, 100).x).toBe(0.75) // stops at the edge
  })

  it('moves less per screen pixel when zoomed in', () => {
    const zoomed = { x: 0.5, y: 0.5, zoom: 2 }
    expect(panBy(100, 100, zoomed, 10, 10, 100)).toEqual({ x: 0.45, y: 0.45, zoom: 2 })
  })

  it('zooms about the centre, and pulls the centre back in when zooming out near an edge', () => {
    expect(zoomTo(100, 100, CENTRED, 2)).toEqual({ x: 0.5, y: 0.5, zoom: 2 })
    expect(zoomTo(100, 100, { x: 0.2, y: 0.5, zoom: 4 }, 1)).toEqual({ x: 0.5, y: 0.5, zoom: 1 })
  })

  it('sizes and offsets the image so the shown square fills the frame', () => {
    expect(imageStyle(100, 100, CENTRED)).toEqual({ width: '100%', left: '0%', top: '0%' })
    expect(imageStyle(200, 100, CENTRED)).toEqual({ width: '200%', left: '-50%', top: '0%' })
    expect(imageStyle(100, 100, { x: 0.25, y: 0.75, zoom: 2 })).toEqual({ width: '200%', left: '0%', top: '-100%' })
  })
})
