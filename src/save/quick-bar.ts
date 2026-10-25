// The quick bar's slot count (the spec §3.3 and §4.1): eight. A bar saved
// with ten, before 2026-10-19's eight, still reads (play/kit.ts). A module
// of its own, so the kit and the new-character template share it without
// either loading the other.
export const QUICK_BAR_SLOTS = 8
