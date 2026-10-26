import { useMemo, useState } from 'react'
import { showDice } from '../dice/app-tray.ts'
import { describePool } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import { paragraphs } from '../play/rule-text.ts'
import {
  addClassSpell,
  cast,
  castOptions,
  casterFor,
  characterSpells,
  endConcentration,
  classMaxSpellLevel,
  markPact,
  markSlot,
  pactSlots,
  preparedCount,
  removeClassSpell,
  scaledDice,
  setPrepared,
  slotLevels,
  type CastWith,
  type SpellRow,
} from '../play/spells.ts'
import { signed } from '../play/vitals.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import type { Sheet, Spellcaster } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import { unresolved } from '../rules/unresolved.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { useHudDialog } from './dialog.ts'
import { QuickRoll } from './QuickRoll.tsx'
import { SheetSection } from './SheetSection.tsx'
import { Window, WindowHeader } from './Window.tsx'

// Spells (the spec §3.3 and §3.2, Cast a spell): each caster's save DC,
// attack and prepared count, with Change spells; the slots as boxes to tick
// per level, "2 of 4 left" beside them (§6.3), Pact Magic's apart; then the
// spells by level, cantrips first, the ready ones shown and the rest folded.
// A spell opens its window: the SRD's text, Cast with a slot of its level or
// higher (or as a ritual), the attack or the save it makes, and its damage
// at the level cast. Concentration replaces the one before, naming it.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

const LEVEL_NAME = (n: number) => (n === 0 ? 'Cantrips' : `Level ${n}`)

export function SpellsSection({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const rows = useMemo(() => characterSpells(rules, entity, sheet), [rules, entity, sheet])
  const [open, setOpen] = useState<SpellRow | null>(null)
  const [changing, setChanging] = useState<Spellcaster | null>(null)
  const slots = slotLevels(sheet, entity)
  const pact = pactSlots(sheet, entity)
  if (!rows.length && !sheet.spellcasting.length) return null
  const levels = [...new Set(rows.map((r) => r.spell.level))].sort((a, b) => a - b)
  // Spells the rules lack (an import's, spec §4.2): kept, and listed by name.
  const kept = entity.spells.filter((s) => !rules.spells.has(s.spellId))
  const concentrating = entity.concentration && rules.spells.get(entity.concentration.spellId)
  return (
    <SheetSection id="spells" count={String(rows.filter((r) => r.ready).length)}>
      {sheet.spellcasting.map((c) => {
        const count = preparedCount(rows, c)
        return (
          <div key={c.classId} className="caster-line">
            <p>
              <b>{c.name}</b> · save DC <b>{c.saveDc.total}</b> · attack <b>{signed(c.attack.total)}</b>
              <br />
              <span className="meta">
                {c.prepared !== undefined && `Prepared ${count.prepared} of ${c.prepared}`}
                {c.cantrips !== undefined && ` · Cantrips ${count.cantrips} of ${c.cantrips}`}
              </span>
            </p>
            <button type="button" className="secondary" aria-haspopup="dialog" onClick={() => setChanging(c)}>
              Change spells
            </button>
          </div>
        )
      })}
      {concentrating && (
        <p className="concentration-line">
          Concentrating on <b>{concentrating.name}</b>{' '}
          <button type="button" className="secondary" onClick={() => update(endConcentration)}>
            End
          </button>
        </p>
      )}
      {(slots.length > 0 || pact) && (
        <ul className="stat-list slot-list">
          {slots.map((s) => (
            <SlotRow key={s.level} name={LEVEL_NAME(s.level)} max={s.max} left={s.left} onMark={(by) => update((e) => markSlot(e, s.level, s.max, by))} />
          ))}
          {pact && <SlotRow name={`Pact Magic · level ${pact.level}`} max={pact.max} left={pact.left} onMark={(by) => update((e) => markPact(e, pact.max, by))} />}
        </ul>
      )}
      {levels.map((level) => {
        const all = rows.filter((r) => r.spell.level === level)
        const ready = all.filter((r) => r.ready)
        const rest = all.filter((r) => !r.ready)
        return (
          <div key={level} className="skill-group">
            <h3 className="skill-group-name">{LEVEL_NAME(level)}</h3>
            {ready.length > 0 && <SpellList rows={ready} onOpen={setOpen} />}
            {rest.length > 0 && (
              <details className="spell-fold">
                <summary>
                  {rest.length} not prepared
                </summary>
                <SpellList rows={rest} onOpen={setOpen} />
              </details>
            )}
          </div>
        )
      })}
      {kept.length > 0 && (
        <div className="skill-group">
          <h3 className="skill-group-name">Kept by name</h3>
          <p className="meta">{kept.map((s) => unresolved(s.spellId)).join(', ')}</p>
        </div>
      )}
      {open && <SpellWindow rules={rules} entity={entity} sheet={sheet} row={open} update={update} onClose={() => setOpen(null)} />}
      {changing && <ChangeSpellsWindow rules={rules} entity={entity} rows={rows} caster={changing} update={update} onClose={() => setChanging(null)} />}
    </SheetSection>
  )
}

function SlotRow({ name, max, left, onMark }: { name: string; max: number; left: number; onMark: (by: 1 | -1) => void }) {
  return (
    <li className="resource-row">
      <span className="stat-name">{name}</span>
      <span className="resource-boxes" role="group" aria-label={`${name} slots: ${left} of ${max} left`}>
        {Array.from({ length: max }, (_, i) => {
          const spent = i >= left
          return <button key={i} type="button" className="resource-box spell-slot-box" data-spent={spent || undefined} aria-label={spent ? `Regain a ${name} slot` : `Spend a ${name} slot`} onClick={() => onMark(spent ? -1 : 1)} />
        })}
      </span>
      <span className="stat-detail">
        {left} of {max} left
      </span>
    </li>
  )
}

function SpellList({ rows, onOpen }: { rows: SpellRow[]; onOpen: (r: SpellRow) => void }) {
  return (
    <ul className="stat-list">
      {rows.map((r) => (
        <li key={r.spell.id}>
          <button type="button" className="stat-row spell-row" aria-haspopup="dialog" onClick={() => onOpen(r)}>
            <span className="stat-name">
              {r.spell.name}
              {r.spell.duration.concentration && <abbr title="Concentration"> C</abbr>}
              {r.spell.castingTime.ritual && <abbr title="Ritual"> R</abbr>}
            </span>
            <span className="stat-detail">
              {[r.spell.castingTime.unit === 'bonus-action' ? 'Bonus action' : r.spell.castingTime.unit === 'reaction' ? 'Reaction' : r.spell.castingTime.text.split(',')[0], r.spell.range.text, r.always ? r.from : null].filter(Boolean).join(' · ')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

const castLabel = (c: CastWith) => (c.kind === 'cantrip' ? 'Cast' : c.kind === 'ritual' ? 'As a ritual' : c.kind === 'free' ? `Without a slot (${c.from})` : c.kind === 'pact' ? `Pact slot, level ${c.level}` : `Level ${c.level} slot`)
const castLevelOf = (row: SpellRow, c: CastWith) => (c.kind === 'slot' || c.kind === 'pact' ? c.level : row.spell.level)

// onCast is told what a cast spent (the Journal's turn spends its pip).
export function SpellWindow({ rules, entity, sheet, row, update, onClose, onCast }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; row: SpellRow; update: Update; onClose: () => void; onCast?: (how: CastWith) => void }) {
  const dialog = useHudDialog({ onClose })
  const record = useRecordRoll()
  const [cast_, setCast] = useState<CastWith | null>(null)
  const [attacking, setAttacking] = useState(false)
  const [said, setSaid] = useState('')
  const options = castOptions(rules, sheet, entity, row)
  const caster = casterFor(sheet, row)
  const s = row.spell
  const current = entity.concentration && entity.concentration.spellId !== s.id ? rules.spells.get(entity.concentration.spellId) : undefined
  const level = cast_ ? castLevelOf(row, cast_) : s.level
  const damage = (s.damage as { dice: string; type: string; note?: string }[] | undefined) ?? []
  const doCast = (how: CastWith) => {
    update((e) => cast(e, row, how))
    setCast(how)
    onCast?.(how)
    setSaid(`Cast ${s.name}${how.kind === 'slot' || how.kind === 'pact' ? ` with a level ${how.level} slot` : how.kind === 'ritual' ? ' as a ritual' : how.kind === 'free' ? ` without a slot (${how.from})` : ''}.`)
  }
  const rollDamage = (d: { dice: string; type: string }) => {
    const dice = scaledDice(s, d.dice.replace(/\+.*$/, ''), level, sheet.level)
    const r = rollFaces(dice)
    const described = describePool(`${s.name}, damage`, dice, [dice], r, `${r.total} ${d.type}`)
    showDice(described, { say: true, alone: true })
    record(entity, described)
  }
  return (
    <Window dialog={dialog} className="spell-window" labelledBy="spell-heading">
      <WindowHeader
        id="spell-heading"
        title={
          <>
            {s.name} <span className="meta">{s.level === 0 ? 'Cantrip' : `Level ${s.level}`} · p.{s.source.page}</span>
          </>
        }
      />
      <p className="meta">
        {s.castingTime.text} · {s.range.text} · {s.duration.text}
        {row.always && ` · ${row.from}, always prepared`}
      </p>
      {s.attack && caster?.attack && (
        <p>
          Spell attack <b>{signed(caster.attack.total)}</b>{' '}
          <button type="button" className="secondary" aria-haspopup="dialog" onClick={() => setAttacking(true)}>
            Roll to hit
          </button>
        </p>
      )}
      {s.save && caster?.saveDc && (
        <p>
          {rules.data.core.abilities.find((a) => a.id === s.save)?.name} save, DC <b>{caster.saveDc.total}</b>
        </p>
      )}
      {damage.map((d) => (
        <p key={d.dice + d.type + (d.note ?? '')}>
          <button type="button" className="secondary" onClick={() => rollDamage(d)}>
            {scaledDice(s, d.dice.replace(/\+.*$/, ''), level, sheet.level)}
            {d.dice.includes('+') ? d.dice.slice(d.dice.indexOf('+')) : ''} {d.type}
          </button>
          {d.note && <span className="meta"> {d.note}</span>}
        </p>
      ))}
      {s.healing && <p className="meta">Healing: {String(s.healing)}</p>}
      {current && s.duration.concentration && <p className="owed">Casting it ends your Concentration on {current.name}.</p>}
      {s.level > 0 && options.length === 0 && <p className="owed">No slot of level {s.level} or higher is left.</p>}
      {!row.ready && s.level > 0 && <p className="meta">Not prepared: prepare it in Change spells to cast it.</p>}
      <div className="actions">
        {row.ready &&
          options.map((o) => (
            <button key={castLabel(o)} type="button" className={o === options[0] ? 'primary' : 'secondary'} onClick={() => doCast(o)}>
              {castLabel(o)}
            </button>
          ))}
      </div>
      <p className="meta" role="status">
        {said}
      </p>
      {paragraphs(s.text).map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {s.higherLevels && <p className="meta">{String(s.higherLevels)}</p>}
      <p className="meta">From the SRD 5.2.1, under CC-BY-4.0.</p>
      {attacking && caster?.attack && <QuickRoll rules={rules} entity={entity} name={`${s.name}, spell attack`} total={caster.attack} attack onClose={() => setAttacking(false)} />}
    </Window>
  )
}

// Change spells (§3.3): a class's spells to prepare, up to its number, and
// its cantrips up to theirs. A Wizard prepares from the spellbook and adds
// to it from the Wizard list; the other casters prepare from their whole
// class list (SRD p.104, Preparing Spells).
function ChangeSpellsWindow({ rules, entity, rows, caster, update, onClose }: { rules: Rules; entity: CharacterEntity; rows: SpellRow[]; caster: Spellcaster; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  const [find, setFind] = useState('')
  const cls = rules.classes.get(caster.classId)
  const count = preparedCount(rows, caster)
  const book = caster.classId === 'wizard'
  const maxLevel = classMaxSpellLevel(rules, caster.classId, entity.classes.find((c) => c.classId === caster.classId)?.level ?? 1)
  const mine = new Map(entity.spells.filter((s) => s.classId === caster.classId).map((s) => [s.spellId, s]))
  const list = (cls?.spellList ?? []).map((id) => rules.spells.get(id.replace(/^spells:/, ''))).filter((s): s is NonNullable<typeof s> => Boolean(s) && s!.level <= maxLevel)
  const shown = (book ? list.filter((s) => s.level === 0 || mine.has(s.id)) : list).filter((s) => !find || s.name.toLowerCase().includes(find.toLowerCase()))
  const addable = book ? list.filter((s) => s.level > 0 && !mine.has(s.id) && (!find || s.name.toLowerCase().includes(find.toLowerCase()))) : []
  const always = new Set(rows.filter((r) => r.always).map((r) => r.spell.id))
  const toggle = (id: string, level: number, on: boolean) =>
    update((e) => (on ? addClassSpell(e, id, caster.classId, level > 0) : level === 0 || !book ? removeClassSpell(e, id, caster.classId) : setPrepared(e, id, caster.classId, false)))
  return (
    <Window dialog={dialog} className="choice-sheet" labelledBy="change-heading">
      <WindowHeader id="change-heading" title={`${caster.name} spells`} />
      <p className="choice-count" role="status">
        {caster.prepared !== undefined && `Prepared ${count.prepared} of ${caster.prepared}`}
        {caster.cantrips !== undefined && ` · Cantrips ${count.cantrips} of ${caster.cantrips}`}
      </p>
      <label className="choice-find">
        <span>Find</span>
        <input type="search" value={find} onChange={(e) => setFind(e.target.value)} />
      </label>
      <ul className="choice-list">
        {shown.map((s) => {
          const entry = mine.get(s.id)
          const on = s.level === 0 ? Boolean(entry) : Boolean(entry?.prepared)
          const full = s.level === 0 ? caster.cantrips !== undefined && count.cantrips >= caster.cantrips : caster.prepared !== undefined && count.prepared >= caster.prepared
          return (
            <li key={s.id}>
              <label>
                <input type="checkbox" checked={on || always.has(s.id)} disabled={always.has(s.id) || (!on && full)} onChange={(e) => toggle(s.id, s.level, e.target.checked)} />
                <span className="choice-name">{s.name}</span>
                <span className="choice-detail">{s.level === 0 ? 'Cantrip' : `Level ${s.level}`}</span>
                {always.has(s.id) && <span className="choice-unmet">Always prepared</span>}
              </label>
            </li>
          )
        })}
      </ul>
      {book && addable.length > 0 && (
        <details className="spell-fold">
          <summary>Add to the spellbook ({addable.length})</summary>
          <ul className="choice-list">
            {addable.map((s) => (
              <li key={s.id}>
                <button type="button" className="choice-button" onClick={() => update((e) => addClassSpell(e, s.id, 'wizard', false))}>
                  <span className="choice-name">{s.name}</span>
                  <span className="choice-detail">Level {s.level}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}
