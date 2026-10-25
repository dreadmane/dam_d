import { useCallback } from 'react'
import { parseTurns, turnOf, withTurn, type TurnState } from '../play/tracker.ts'
import { deviceStore, useDeviceStore } from './device-store.ts'

// The turn tracker's state (play/tracker.ts), each character's, kept on this
// device beside the Rolls log and never in a character's file, so an export
// carries only the character. A reload mid-fight keeps the pips.

const store = deviceStore('d-amp-d:turn', parseTurns)

export function useTurn(rosterId: string): [TurnState, (change: (t: TurnState) => TurnState) => void] {
  const turn = turnOf(useDeviceStore(store), rosterId)
  const change = useCallback((f: (t: TurnState) => TurnState) => {
    const all = store.get()
    store.set(withTurn(all, rosterId, f(turnOf(all, rosterId))))
  }, [rosterId])
  return [turn, change]
}
