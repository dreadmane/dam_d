import { useState } from 'react'
import commonSchema from '../../data/rules/schemas/common.schema.json'
import { showDice } from '../dice/app-tray.ts'
import { describeRoll } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import { deathSave, gainTemp, heal, isStable, takeDamage } from '../play/play.ts'
import { concentrationSave } from '../play/spells.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { stableAside } from '../voice.ts'
import { useHudDialog } from './dialog.ts'
import { QuickRoll } from './QuickRoll.tsx'
import { SheetSection } from './SheetSection.tsx'
import { Window, WindowHeader } from './Window.tsx'

// Health (the spec §3.2, Take damage or heal; Crawler Interface's Health
// dialog): one number, then Take damage (with its type, for Resistance, and
// whether it was a Critical Hit, for damage at 0 HP), Heal, or temporary HP,
// with a preview of what each does before it is applied (play/play.ts). And
// at 0 HP, the death saves in its place at the top of the sheet.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

// The 13 damage types, from the rules data's own closed list.
const DAMAGE_TYPES: string[] = commonSchema.$defs.damageType.enum

export function HealthWindow({ rules, entity, sheet, update, onClose }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('')
  const [critical, setCritical] = useState(false)
  const [saving, setSaving] = useState(false)
  const n = Math.max(0, Math.round(Number(amount)) || 0)
  const damage = n ? takeDamage(rules, entity, sheet, n, type || null, critical) : null
  const healed = n ? heal(entity, sheet.hp.max, n) : null
  const save = damage ? concentrationSave(rules, sheet, entity, damage) : null
  const apply = (change: (e: CharacterEntity) => CharacterEntity) => {
    update(change)
    dialog.close()
  }
  return (
    <Window dialog={dialog} labelledBy="health-heading">
      <WindowHeader id="health-heading" title={`HP ${entity.hp.current} / ${sheet.hp.max}${entity.hp.temp ? ` · Temp ${entity.hp.temp}` : ''}`} />
      <label className="field">
        <span>Amount</span>
        <input type="number" inputMode="numeric" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span>Damage type, for Resistance</span>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Not given</option>
          {DAMAGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </label>
      {entity.hp.current === 0 && (
        <label className="check-field">
          <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} /> A Critical Hit
        </label>
      )}
      <p className="meta health-preview" role="status">
        {damage ? `Take damage: ${damage.lines.join(' ')}` : 'Type an amount.'}
        {save && ` Concentration on ${save.spell}: a Constitution save, DC ${save.dc}.`}
        {healed && healed.hp.current !== entity.hp.current && ` Heal: ${entity.hp.current} → ${healed.hp.current}.`}
      </p>
      {/* The save to keep Concentration, rolled over this window, so the
          amount stays for Take damage. */}
      {save && (
        <div className="actions">
          <button type="button" className="secondary" aria-haspopup="dialog" onClick={() => setSaving(true)}>
            Roll Constitution save, DC {save.dc}
          </button>
        </div>
      )}
      <div className="dialog-actions">
        <button type="button" className="secondary" disabled={!n} onClick={() => apply((e) => gainTemp(e, n))}>
          Temp HP
        </button>
        <button type="button" className="secondary" disabled={!n} onClick={() => apply((e) => heal(e, sheet.hp.max, n))}>
          Heal
        </button>
        <button type="button" className="primary" disabled={!n} onClick={() => apply((e) => takeDamage(rules, e, sheet, n, type || null, critical).entity)}>
          Take damage
        </button>
      </div>
      {saving && save && <QuickRoll rules={rules} entity={entity} name={save.name} total={save.total} onClose={() => setSaving(false)} />}
    </Window>
  )
}

// At 0 HP (SRD p.17): the death saves, three successes and three failures,
// each a mark in words too; Roll death save on the app's dice, the marks by
// hand for one rolled at the table, and Heal. Stable at three successes;
// dead at three failures.
export function DeathSavesSection({ rules, entity, sheet, update, onHeal }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; onHeal: () => void }) {
  const record = useRecordRoll()
  const [said, setSaid] = useState('')
  const ds = entity.deathSaves
  const r = rules.data.core.playRules!.deathSaves
  const max = r.toDie
  const roll = () => {
    const rolled = rollFaces('1d20')
    const described = describeRoll('Death saving throw', '1d20', rolled, 'death-save')
    showDice(described, { say: true, alone: true })
    record(entity, described)
    const out = deathSave(rules, entity, rolled.total)
    update(() => out.entity)
    setSaid(`Rolled ${rolled.total}: ${out.outcome}.`)
  }
  const mark = (kind: 'successes' | 'failures') =>
    update((e) => {
      const next = Math.min(max, e.deathSaves[kind] + 1)
      return { ...e, deathSaves: { ...e.deathSaves, [kind]: next, ...(kind === 'failures' && next >= max ? { dead: true } : {}) } }
    })
  if (ds.dead)
    return (
      <SheetSection id="death-saves">
        <p className="owed">Dead.</p>
        <p className="meta">Only magic that restores life brings a character back. The table decides.</p>
      </SheetSection>
    )
  return (
    <SheetSection id="death-saves">
      <p className="death-marks">
        <span>
          Successes <b>{ds.successes} of {max}</b>
        </span>
        <span>
          Failures <b>{ds.failures} of {max}</b>
        </span>
      </p>
      {isStable(rules, entity) ? (
        <>
          <p>Stable: no more death saves. Any healing wakes you.</p>
          <p className="meta">{stableAside(entity.name)}</p>
        </>
      ) : (
        <div className="actions">
          <button type="button" className="primary" onClick={roll}>
            Roll death save
          </button>
          <button type="button" className="secondary" onClick={() => mark('successes')}>
            + Success
          </button>
          <button type="button" className="secondary" onClick={() => mark('failures')}>
            + Failure
          </button>
        </div>
      )}
      <div className="actions">
        <button type="button" className="secondary" aria-haspopup="dialog" onClick={onHeal}>
          Heal
        </button>
      </div>
      <p className="meta" role="status">
        {said}
      </p>
      <p className="meta">
        HP 0 / {sheet.hp.max}: Unconscious. {r.dc} or higher succeeds; a 1 is {r.naturalOneFailures} failures; a 20 regains {r.naturalTwentyHp} HP (SRD p.17).
      </p>
    </SheetSection>
  )
}
