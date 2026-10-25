// Types for install.mjs, which the install test imports.

export interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

export interface Manifest {
  id: string
  name: string
  short_name: string
  start_url: string
  display: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}

export function readManifest(): Manifest
export function readIndexHtml(): string
export function publicPngSize(src: string): string | null
