// Which square of a character's photo is shown (spec §3.3). The photo is kept
// whole; a crop is three numbers: the centre of the shown square as fractions
// of the photo's width and height, and a zoom, where 1 is the largest square
// that fits and 4 is a quarter of that across. Pure, so the arithmetic is
// tested without a browser.

export interface Crop {
  x: number
  y: number
  zoom: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4
export const CENTRED: Crop = { x: 0.5, y: 0.5, zoom: MIN_ZOOM }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
// Four decimals is a tenth of a pixel on the largest stored photo, and keeps
// the saved numbers short.
const round = (n: number) => Math.round(n * 10000) / 10000

// Keeps the zoom in range and the square inside the photo.
export function clampCrop(width: number, height: number, crop: Crop): Crop {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM)
  const side = Math.min(width, height) / zoom
  const hx = side / 2 / width
  const hy = side / 2 / height
  return { x: round(clamp(crop.x, hx, 1 - hx)), y: round(clamp(crop.y, hy, 1 - hy)), zoom: round(zoom) }
}

// The shown square, in the photo's pixels.
export function viewSquare(width: number, height: number, crop: Crop) {
  const c = clampCrop(width, height, crop)
  const side = Math.min(width, height) / c.zoom
  return { left: c.x * width - side / 2, top: c.y * height - side / 2, side }
}

// Moves the view by a drag measured on screen: dx, dy pixels across a frame
// `frame` pixels wide. Dragging the photo right brings its left side into
// view, so the square's centre moves left.
export function panBy(width: number, height: number, crop: Crop, dx: number, dy: number, frame: number): Crop {
  const perScreenPixel = Math.min(width, height) / crop.zoom / frame
  return clampCrop(width, height, { ...crop, x: crop.x - (dx * perScreenPixel) / width, y: crop.y - (dy * perScreenPixel) / height })
}

// Zooms about the current centre, which then moves only if the larger square
// would leave the photo.
export const zoomTo = (width: number, height: number, crop: Crop, zoom: number) => clampCrop(width, height, { ...crop, zoom })

// Places the whole photo inside a square frame so the crop fills it: the
// image's width and offsets as percentages of the frame. Its height follows
// from its width, since the photo keeps its shape.
export function imageStyle(width: number, height: number, crop: Crop) {
  const { left, top, side } = viewSquare(width, height, crop)
  const pct = (n: number) => `${round((n / side) * 100)}%`
  return { width: pct(width), left: pct(-left), top: pct(-top) }
}
