import { useState } from 'react'
import { paragraphs } from '../play/rule-text.ts'
import { activeToggles } from '../play/kit.ts'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { RuleCard } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'

// Conditions and effects (the spec §3.2, Crawler Interface's Buffs and
// debuffs as D&D's): the conditions on the character, each opening its rule
// (the SRD's text) and removed with ✕; Add a condition from the 15 or the
// player's own effect with a name and its words; Exhaustion as one entry
// with a level, whose penalties reach every derived value (rules/effects.ts);
// and Heroic Inspiration, held or not, one at most (SRD p.8). No Rule of
// Three (B). The conditions' Advantage and Disadvantage reach the rolls they
// touch through the sheet.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function ConditionsSection({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState('')
  const [customName, setCustomName] = useState('')
  const [customText, setCustomText] = useState('')
  const exhaustion = rules.conditions.get('exhaustion')
  const max = exhaustion?.levels?.max ?? 6
  const deathAt = exhaustion?.levels?.deathAt ?? max
  const held = new Set(entity.conditions.map((c) => c.conditionId).filter(Boolean))
  const record = open ? rules.conditions.get(open) : undefined
  const add = () => {
    if (adding === 'custom') {
      if (!customName.trim()) return
      update((e) => ({ ...e, conditions: [...e.conditions, { id: crypto.randomUUID(), custom: { name: customName.trim(), text: customText.trim() } }] }))
      setCustomName('')
      setCustomText('')
    } else if (adding) {
      update((e) => ({ ...e, conditions: [...e.conditions, { id: crypto.randomUUID(), conditionId: adding }] }))
    }
    setAdding('')
  }
  const effectsOn = activeToggles(rules, entity, sheet)
  const count = entity.conditions.length + (entity.exhaustion ? 1 : 0) + effectsOn.length
  return (
    <SheetSection id="conditions" count={String(count)}>
      <ul className="stat-list">
        {entity.conditions.map((c) => {
          const name = c.conditionId ? (rules.conditions.get(c.conditionId)?.name ?? c.conditionId) : (c.custom?.name ?? 'Effect')
          return (
            <li key={c.id} className="condition-row">
              {c.conditionId ? (
                <button type="button" className="stat-row" aria-haspopup="dialog" onClick={() => setOpen(c.conditionId!)}>
                  <span className="stat-name">{name}</span>
                </button>
              ) : (
                <span className="stat-row">
                  <span className="stat-name">{name}</span>
                  {c.custom?.text && <span className="stat-detail">{c.custom.text}</span>}
                </span>
              )}
              <button type="button" className="secondary icon-button" aria-label={`Remove ${name}`} onClick={() => update((e) => ({ ...e, conditions: e.conditions.filter((x) => x.id !== c.id) }))}>
                ✕
              </button>
            </li>
          )
        })}
        {/* What is switched on, from the quick bar or by casting it: Rage,
            Bless. End switches it off, as the quick bar does. */}
        {effectsOn.map((t) => (
          <li key={`toggle:${t.ref}`} className="condition-row">
            <span className="stat-row">
              <span className="stat-name">{t.name}</span>
              <span className="stat-detail">On</span>
            </span>
            <button
              type="button"
              className="secondary"
              aria-label={`End ${t.name}`}
              onClick={() =>
                update((e) => {
                  const { [t.ref]: _ended, ...toggles } = e.toggles
                  return { ...e, toggles, concentration: e.concentration?.spellId === t.ref ? null : e.concentration }
                })
              }
            >
              End
            </button>
          </li>
        ))}
        <li className="condition-row">
          <button type="button" className="stat-row" aria-haspopup="dialog" onClick={() => setOpen('exhaustion')}>
            <span className="stat-name">Exhaustion</span>
            <span className="stat-detail">{entity.exhaustion ? `Level ${entity.exhaustion} of ${max}` : 'None'}</span>
          </button>
          <span className="stepper-inline">
            <button type="button" className="secondary" aria-label="Lower Exhaustion" disabled={!entity.exhaustion} onClick={() => update((e) => ({ ...e, exhaustion: Math.max(0, e.exhaustion - 1) }))}>
              −
            </button>
            <button type="button" className="secondary" aria-label="Raise Exhaustion" disabled={entity.exhaustion >= max} onClick={() => update((e) => ({ ...e, exhaustion: Math.min(max, e.exhaustion + 1) }))}>
              +
            </button>
          </span>
        </li>
      </ul>
      {entity.exhaustion >= deathAt && (
        <p className="owed">
          Exhaustion {deathAt}: the character dies (SRD p.{exhaustion?.source.page}).
        </p>
      )}
      <div className="add-condition">
        <label className="field">
          <span>Add</span>
          <select value={adding} onChange={(e) => setAdding(e.target.value)}>
            <option value="">A condition…</option>
            {rules.data.conditions.conditions
              .filter((c) => c.id !== 'exhaustion' && !held.has(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            <option value="custom">Your own effect…</option>
          </select>
        </label>
        {adding === 'custom' && (
          <>
            <label className="field">
              <span>Name</span>
              <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            </label>
            <label className="field">
              <span>What it does</span>
              <input type="text" value={customText} onChange={(e) => setCustomText(e.target.value)} />
            </label>
          </>
        )}
        {adding && (
          <button type="button" className="primary" onClick={add}>
            Add
          </button>
        )}
      </div>
      <div className="inspiration-row">
        <span>
          Heroic Inspiration · <b>{entity.heroicInspiration ? 'held' : 'none'}</b>
        </span>
        <button type="button" className="secondary" onClick={() => update((e) => ({ ...e, heroicInspiration: !e.heroicInspiration }))}>
          {entity.heroicInspiration ? 'Spend' : 'Gain'}
        </button>
      </div>
      {record && (
        <RuleCard
          rule={{ title: record.name, text: paragraphs(record.text), page: record.source.page, notes: ['From the SRD 5.2.1, under CC-BY-4.0.'] }}
          onClose={() => setOpen(null)}
        />
      )}
    </SheetSection>
  )
}
