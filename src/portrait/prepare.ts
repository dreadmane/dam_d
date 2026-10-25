// Turns a picked file into a stored photo (spec §3.3): any image the browser
// can read, any shape, shrunk on the player's device to at most MAX_SIDE on
// its long side and re-encoded compactly, so a 4 MB phone photo is stored as
// roughly 100 KB. Built-in browser APIs only, no library.
//
// createImageBitmap applies the photo's EXIF orientation, so a phone photo
// is stored the right way up. WebP where the browser can encode it, else
// JPEG, drawn over the surface colour since JPEG has no transparency.

import { viewSquare, type Crop } from './crop.ts'

export const MAX_SIDE = 1024
// Decoding needs the whole image in memory; beyond this it is not a photo
// anyone means to use as a portrait.
export const MAX_FILE_BYTES = 40 * 1024 * 1024
// The save schema's cap on the stored data URL (roster-v1, portrait.image).
export const MAX_DATA_URL = 2_000_000

export interface PreparedPhoto {
  image: string
  width: number
  height: number
}

export type PrepareResult = ({ ok: true } & PreparedPhoto) | { ok: false; message: string }

// The stored size: the long side at most `max`, never enlarged.
export function fitWithin(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

const isHeic = (file: Pick<File, 'name' | 'type'>) => /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)

// Why a file cannot be used, before or after trying to decode it.
export function refusal(file: Pick<File, 'name' | 'type' | 'size'>, decoded: boolean): string | null {
  if (file.size > MAX_FILE_BYTES) return 'This file is too large to use as a photo. Choose one under 40 MB.'
  if (decoded) return null
  if (isHeic(file)) {
    return "This browser can't read HEIC photos. On an iPhone, choose the photo in Safari, which converts it, or save it as a JPEG first."
  }
  return "This file couldn't be read as an image. Try a JPEG, PNG, or WebP."
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

// The canvas as a data URL no longer than `max`: WebP at falling quality, or
// JPEG where the browser cannot encode WebP. Such a browser returns PNG
// instead, several times larger for a photo, so that answer is not kept.
async function encodeWithin(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, max: number): Promise<string | null> {
  for (const quality of [0.85, 0.7]) {
    let blob = await encode(canvas, 'image/webp', quality)
    if (blob?.type !== 'image/webp') {
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim()
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      blob = await encode(canvas, 'image/jpeg', quality)
    }
    if (!blob) return null
    const url = await dataUrl(blob)
    if (url.length <= max) return url
  }
  return null
}

export async function preparePhoto(file: File): Promise<PrepareResult> {
  const early = refusal(file, false)
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: early! }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, message: early! }
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height)
  const { canvas, ctx } = canvasOf(width, height)
  if (!ctx) return { ok: false, message: "This browser couldn't prepare the photo." }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const image = await encodeWithin(canvas, ctx, MAX_DATA_URL)
  return image ? { ok: true, image, width, height } : { ok: false, message: "This photo couldn't be made small enough to store. Try another." }
}

// The framed square, small, for the character list (a 44 px square, sharp on a
// 3× screen). Null if the browser cannot draw it; the list then shows the
// name's initial, so a missing thumbnail never stops a photo being saved.
export const THUMBNAIL_SIDE = 128
export const MAX_THUMBNAIL = 100_000

export async function renderThumbnail(photo: PreparedPhoto, crop: Crop): Promise<string | null> {
  try {
    const img = new Image()
    img.src = photo.image
    await img.decode()
    const { canvas, ctx } = canvasOf(THUMBNAIL_SIDE, THUMBNAIL_SIDE)
    if (!ctx) return null
    const { left, top, side } = viewSquare(photo.width, photo.height, crop)
    ctx.drawImage(img, left, top, side, side, 0, 0, THUMBNAIL_SIDE, THUMBNAIL_SIDE)
    return await encodeWithin(canvas, ctx, MAX_THUMBNAIL)
  } catch {
    return null
  }
}
