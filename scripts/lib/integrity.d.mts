// Types for integrity.mjs, which the integrity tests import.

export interface IntegrityResult {
  errors: string[]
  // Mismatches the SRD itself prints, recorded as ambiguities: reported, not failed.
  notes: string[]
  checked: number
}

export function checkIntegrity(files: Record<string, unknown>): IntegrityResult
