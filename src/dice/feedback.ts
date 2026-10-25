// The seam for later (the user, 2026-10-13: the roll's sound can be patched in
// later; the look comes first). The tray calls start as the dice begin to
// tumble and settle as the last one lands. A sound (Web Audio, unlocked by the
// Roll tap, a file under public/sounds/ with its licence, and a Settings field
// of its own) and a haptic (navigator.vibrate, on Android) hang off these
// later. Nothing is built: no file, no field, no promise in Settings.

export const rollFeedback = {
  start(dice: number): void {
    void dice
  },
  settle(): void {},
}
