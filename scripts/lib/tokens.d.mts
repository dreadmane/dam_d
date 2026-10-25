// Types for the parts of tokens.mjs that the token tests import.

export interface FlatToken {
  path: string
  type: string | undefined
  value: string | number | string[]
  light: string | number | string[]
}

export interface ContrastRow {
  fg: string
  bg: string
  theme: 'dark' | 'light'
  min: number
  ratio: number
  ok: boolean
  problem?: string
}

export function flatten(tokens: object): FlatToken[]
export function contrastRatio(a: string, b: string): number
export function checkContrast(tokens: object): ContrastRow[]
export function tokensCss(tokens: object): string
export function readTokensCss(): string
export function readAppCss(): string
export function readRepoFile(relPath: string): string
