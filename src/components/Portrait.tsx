import type { ReactNode } from 'react'
import { imageStyle } from '../portrait/crop.ts'
import type { CharacterEntity } from '../save/record.ts'

type Photo = NonNullable<CharacterEntity['portrait']>
type Size = 'sm' | 'lg' | 'xl' | 'full'

// A photo in its square frame, showing the saved crop (spec §3.3), or, with
// none, `fallback` in the same frame, so layouts do not shift when a photo is
// added: a character's initial, a pet's or mount's paw (2026-10-13). `alt` is
// empty where the name sits beside it.
export function PhotoFrame({ photo, size, alt, fallback, className }: { photo: Photo | undefined; size: Size; alt: string; fallback: ReactNode; className?: string }) {
  return (
    <div className={['portrait', className].filter(Boolean).join(' ')} data-size={size}>
      {photo ? <img src={photo.image} alt={alt} style={imageStyle(photo.width, photo.height, photo.crop)} draggable={false} /> : <span aria-hidden="true">{fallback}</span>}
    </div>
  )
}

// A character's photo, or its name's first letter.
export function Portrait({ entity, size, alt }: { entity: CharacterEntity; size: Size; alt: string }) {
  return <PhotoFrame photo={entity.portrait} size={size} alt={alt} fallback={(entity.name.trim()[0] ?? '?').toUpperCase()} />
}
