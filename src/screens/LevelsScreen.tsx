import { useMemo, useState, type ReactNode } from 'react'
import { Choices } from '../components/ChoiceChips.tsx'
import { ChoiceSheet } from '../components/ChoiceSheet.tsx'
import { FlashStack } from '../components/Flash.tsx'
import { OriginFields } from '../components/OriginFields.tsx'
import { useHudDialog } from '../components/dialog.ts'
import { Link } from '../components/Link.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { Window, WindowHeader } from '../components/Window.tsx'
import { characterName } from '../components/character-name.ts'
import { showDice } from '../dice/app-tray.ts'
import { describeRoll } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import { notifyCharacter } from '../notify/app-notices.ts'
import {
  addClass,
  characterLevel,
  levelUp,
  originChoices,
  removeClass,
  rungs,
  setBaseScore,
  setChoice,
  setClassLevel,
  setHp,
  setSubclass,
  type Rung,
} from '../play/ladder.ts'
import { signed } from '../play/vitals.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import { navigate } from '../routes.ts'
import { deriveSheet, type Sheet } from '../rules/derive.ts'
import { ABILITIES, type Ability } from '../rules/expr.ts'
import { levelGrants, type OwedChoice } from '../rules/level.ts'
import { useRules, type Rules } from '../rules/load.ts'
import { unresolved } from '../rules/unresolved.ts'
import type { CharacterEntity } from '../save/record.ts'
import { primaryEntity, useRoster } from '../save/use-roster.ts'
import { loadSettings } from '../settings.ts'
import { LanguagesField } from '../components/LanguagesField.tsx'
import { anyLevelUnfinished } from '../play/build.ts'
import { useCharacterTitle } from '../title.ts'
import { bringsOf, levelGained } from '../voice.ts'
import { RulesLoading } from './RulesLoading.tsx'

// The level ladder (the M1 concept round's direction B, picked 2026-10-19;
// the spec §3.1 A and §3.2). One page for starting at any level, the
// player copying a sheet they have: the classes, the origin and the scores
// as chips at the top, each opening its window; then every class level a
// rung, with its features, its HP and its choices, a choice still to make
// marked at its rung. Level up (§3.2) is the same page with a new rung on
// top: the class, the HP, what it brings, and what changes. Every edit saves
// at once (play/ladder.ts makes them).

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown
type Open =
  | { kind: 'choice'; owed: OwedChoice }
  | { kind: 'class'; classId: string }
  | { kind: 'add-class' }
  | { kind: 'origin' }
  | { kind: 'scores' }
  | { kind: 'finish' }
  | { kind: 'hp'; rung: Rung }
  | null

const ABILITY_SHORT: Record<Ability, string> = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' }

// The species and background by name; one the rules lack (an import's) is
// kept, and marked.
const originLabel = (rules: Rules, entity: CharacterEntity) =>
  [
    entity.species && (rules.species.get(entity.species.speciesId)?.name ?? unresolved(entity.species.speciesId)),
    entity.background && (rules.backgrounds.get(entity.background.backgroundId)?.name ?? unresolved(entity.background.backgroundId)),
  ]
    .filter(Boolean)
    .join(' · ')

export function LevelsScreen({ id, up }: { id: string; up: boolean }) {
  const { status, update } = useRoster(id)
  const rules = useRules()
  useCharacterTitle(status)
  // The character's flashes hang under this row, as under the band: a level
  // gained is told here, where Add level leaves the player. The rung's Hit
  // Die roll still shows no dice here, as before.
  const back = (
    <TopBar end={<FlashStack owner={id} dice={false} />}>
      <Link to={{ screen: 'character', id }}>Sheet</Link>
    </TopBar>
  )
  if (status.kind !== 'ready' || rules.kind !== 'ready') {
    const message = status.kind === 'failed' ? status.message : rules.kind === 'failed' ? rules.message : null
    return <RulesLoading top={back} title="Levels" message={message} />
  }
  return <Ladder id={id} up={up} entity={primaryEntity(status.roster)} rules={rules.rules} update={update} back={back} />
}

function Ladder({ id, up, entity, rules, update, back }: { id: string; up: boolean; entity: CharacterEntity; rules: Rules; update: Update; back: ReactNode }) {
  const sheet = useMemo(() => deriveSheet(rules, entity), [rules, entity])
  const ladder = useMemo(() => rungs(rules, entity), [rules, entity])
  const origin = useMemo(() => originChoices(rules, entity), [rules, entity])
  const [open, setOpen] = useState<Open>(null)
  const close = () => setOpen(null)
  // A subclass owed is its class entry's, not a choice record, so it is
  // counted from the rungs.
  const owed = sheet.unmade.length + ladder.filter((r) => r.subclass && !entity.classes.find((c) => c.classId === r.classId)?.subclassId).length
  const creating = !entity.creation.complete

  // Finish, for a character started at any level, first reviews what is
  // still open (§3.1 A, as the build's Finish does): it never blocks, and
  // anything left stays here. Done, once made, just opens the sheet.
  const finish = () => {
    if (creating) update((e) => ({ ...e, creation: { ...e.creation, complete: true }, hp: { ...e.hp, current: e.hp.current || sheet.hp.max } }))
    navigate({ screen: 'character', id })
  }

  return (
    <main className="ladder-screen">
      {back}
      <ScreenHeading>{characterName(entity.name)}</ScreenHeading>
      <p className="meta">{up ? `Level ${sheet.level} → ${sheet.level + 1}` : creating ? 'Start at any level · saved as you go' : 'Levels · saved as you go'}</p>

      <div className="ladder-chips">
        {entity.classes.length === 0 && <p className="meta">Start with a class.</p>}
        {sheet.classes.map((c) => (
          <button key={c.classId} type="button" className="chip" aria-haspopup="dialog" onClick={() => setOpen({ kind: 'class', classId: c.classId })}>
            {c.name} {c.level}
            {c.subclass && ` · ${c.subclass}`}
          </button>
        ))}
        {characterLevel(entity) < 20 && !up && (
          <button type="button" className="chip" aria-haspopup="dialog" onClick={() => setOpen({ kind: 'add-class' })}>
            + Class
          </button>
        )}
        <button type="button" className={`chip${entity.species && entity.background ? '' : ' chip-todo'}`} aria-haspopup="dialog" onClick={() => setOpen({ kind: 'origin' })}>
          {originLabel(rules, entity) || 'Species and background'}
        </button>
        <button type="button" className="chip" aria-haspopup="dialog" onClick={() => setOpen({ kind: 'scores' })}>
          Scores
        </button>
      </div>

      {/* XP or milestone, per character (C2): XP shows the next threshold;
          milestone hides XP and the band offers Level up whenever tapped. */}
      {!up && entity.classes.length > 0 && <Levelling rules={rules} entity={entity} level={sheet.level} update={update} />}

      {up && <LevelUpRung rules={rules} entity={entity} sheet={sheet} update={update} id={id} />}

      {origin.length > 0 && (
        <section aria-labelledby="origin-rung">
          <h2 id="origin-rung" className="ladder-heading">
            Origin
          </h2>
          <ol className="ladder">
            <li className="rung">
              <span className="rung-level">{originLabel(rules, entity)}</span>
              <div className="rung-body">
                <Choices list={origin} onOpen={(o) => setOpen({ kind: 'choice', owed: o })} rules={rules} />
              </div>
              <span />
            </li>
          </ol>
        </section>
      )}

      {ladder.length > 0 && (
        <section aria-labelledby="levels-heading">
          <h2 id="levels-heading" className="ladder-heading">
            Levels {owed > 0 && <span className="owed">· {owed} to choose</span>}
          </h2>
          <ol className="ladder">
            {ladder.map((r) => (
              <li key={`${r.classId}:${r.level}`} className="rung">
                <span className="rung-level">
                  {r.className} {r.level}
                </span>
                <div className="rung-body">
                  {r.subclass && (
                    <button type="button" className={`chip${sheet.classes.find((c) => c.classId === r.classId)?.subclass ? '' : ' chip-todo'}`} aria-haspopup="dialog" onClick={() => setOpen({ kind: 'class', classId: r.classId })}>
                      Subclass · {sheet.classes.find((c) => c.classId === r.classId)?.subclass ?? 'choose'}
                    </button>
                  )}
                  <Choices list={r.choices} onOpen={(o) => setOpen({ kind: 'choice', owed: o })} rules={rules} />
                  {r.features.filter((f) => !r.choices.some((c) => c.origin.id === f.id) && !/-subclass$/.test(f.id)).length > 0 && (
                    <span className="rung-features">
                      {r.features
                        .filter((f) => !r.choices.some((c) => c.origin.id === f.id) && !/-subclass$/.test(f.id))
                        .map((f) => f.name)
                        .join(', ')}
                    </span>
                  )}
                </div>
                <button type="button" className="rung-hp" aria-haspopup="dialog" aria-label={`${r.className} ${r.level} hit points`} disabled={r.hp.first} onClick={() => setOpen({ kind: 'hp', rung: r })}>
                  {hpLabel(rules, r)}
                </button>
              </li>
            ))}
          </ol>
          <p className="meta">The figure on the right is each level’s HP before the Constitution modifier: the die’s maximum at level 1, then the fixed value unless you enter a roll.</p>
        </section>
      )}

      <div className="ladder-foot">
        <p>
          {owed > 0 ? <span className="owed">{owed} to choose</span> : <span>All chosen</span>}
          <br />
          <span className="meta">HP</span> {sheet.hp.max} · <span className="meta">AC</span> {sheet.ac.total}
        </p>
        <button type="button" className="primary" aria-haspopup={creating ? 'dialog' : undefined} onClick={() => (creating ? setOpen({ kind: 'finish' }) : finish())}>
          {creating ? 'Finish' : 'Done'}
        </button>
      </div>

      {open?.kind === 'choice' && (
        <ChoiceSheet rules={rules} entity={entity} sheet={sheet} owed={open.owed} onSave={(values, inc) => update((e) => setChoice(e, open.owed, values, inc))} onClose={close} />
      )}
      {open?.kind === 'class' && <ClassWindow rules={rules} entity={entity} classId={open.classId} update={update} onClose={close} />}
      {open?.kind === 'finish' && <FinishReview rules={rules} entity={entity} sheet={sheet} owed={owed} update={update} onFinish={finish} onClose={close} />}
      {open?.kind === 'add-class' && <AddClassWindow rules={rules} entity={entity} sheet={sheet} update={update} onClose={close} />}
      {open?.kind === 'origin' && <OriginWindow rules={rules} entity={entity} update={update} onClose={close} />}
      {open?.kind === 'scores' && <ScoresWindow entity={entity} sheet={sheet} update={update} onClose={close} />}
      {open?.kind === 'hp' && <HpWindow rules={rules} entity={entity} rung={open.rung} update={update} onClose={close} />}
    </main>
  )
}

function hpLabel(rules: Rules, r: Rung): string {
  const die = rules.classes.get(r.classId)?.hitDie ?? 8
  if (r.hp.first || r.hp.method === 'max') return String(die)
  if (r.hp.method === 'rolled' && r.hp.value) return `${r.hp.value} rolled`
  return String(Math.floor(die / 2) + 1)
}

// Level up's new rung (§3.2): the class, the HP (fixed by default, rolled on
// the app's dice, or typed from the table), what the level brings and what
// changes, then Add level N. Its choices then sit on the ladder below, owed.
// With Settings' optional rule (C3), the HP starts on rolling: Roll comes
// first, and Add level waits for a roll or for Fixed.
function LevelUpRung({ rules, entity, sheet, update, id }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; id: string }) {
  const held = sheet.classes.map((c) => c.classId)
  const [classId, setClassId] = useState(held[0] ?? 'fighter')
  const [rolledHp] = useState(() => loadSettings().rules.rolledHp)
  const start = (): { method: 'fixed' | 'rolled'; value?: number } => (rolledHp ? { method: 'rolled' } : { method: 'fixed' })
  const [hp, setHpChoice] = useState(start)
  const waiting = hp.method === 'rolled' && !hp.value
  const record = useRecordRoll()
  const cls = rules.classes.get(classId)!
  const nextLevel = (entity.classes.find((c) => c.classId === classId)?.level ?? 0) + 1
  const after = useMemo(() => deriveSheet(rules, levelUp(entity, classId, waiting ? { method: 'fixed' } : hp)), [rules, entity, classId, hp, waiting])
  const grant = levelGrants(rules, classId, nextLevel, { subclassId: entity.classes.find((c) => c.classId === classId)?.subclassId, first: held[0] === classId || held.length === 0 })
  const brings = bringsOf(grant)
  const prerequisites = held.includes(classId) ? [] : multiclassWarnings(rules, sheet, [...held, classId])
  const fixed = Math.floor(cls.hitDie / 2) + 1
  if (sheet.level >= 20) return <p className="meta">Level 20 is the highest.</p>

  const roll = () => {
    const notation = `1d${cls.hitDie}`
    const rolled = rollFaces(notation)
    const described = describeRoll(`${cls.name} ${nextLevel} hit points`, notation, rolled)
    showDice(described)
    record(entity, described)
    setHpChoice({ method: 'rolled', value: rolled.total })
  }
  // Saved, then told: a brief gold flash in the Handbook's register (the
  // spec §6.1) with the level, what it brings and the new Max HP, filed in
  // the character's folder; then the ladder, where its choices sit owed.
  const addLevel = () => {
    if (update((e) => levelUp(e, classId, waiting ? { method: 'fixed' } : hp)))
      notifyCharacter(id, levelGained({ name: entity.name, level: sheet.level + 1, className: cls.name, classLevel: nextLevel, brings, maxHp: after.hp.max }))
    navigate({ screen: 'levels', id }, { replace: true })
  }
  const diffs: [string, string | number, string | number][] = [
    ['Max HP', sheet.hp.max, after.hp.max],
    ...(after.proficiencyBonus !== sheet.proficiencyBonus ? [['Proficiency bonus', signed(sheet.proficiencyBonus), signed(after.proficiencyBonus)] as [string, string, string]] : []),
    ...after.resources.filter((r) => sheet.resources.find((s) => s.key === r.key)?.max !== r.max).map((r) => [r.name, sheet.resources.find((s) => s.key === r.key)?.max ?? 0, r.max] as [string, number, number]),
    ...after.slots.flatMap((n, i) => (n !== sheet.slots[i] ? [[`Level ${i + 1} slots`, sheet.slots[i], n] as [string, number, number]] : [])),
    ...after.spellcasting.flatMap((s) => {
      const before = sheet.spellcasting.find((x) => x.classId === s.classId)
      return before?.prepared !== s.prepared ? [[`${s.name} prepared spells`, before?.prepared ?? 0, s.prepared ?? 0] as [string, number, number]] : []
    }),
  ]

  return (
    <section className="level-up-rung" aria-labelledby="level-up-heading">
      <h2 id="level-up-heading" className="ladder-heading">
        Level {sheet.level + 1} <span className="meta">· new</span>
      </h2>
      <label className="field">
        <span>Class</span>
        <select value={classId} onChange={(e) => (setClassId(e.target.value), setHpChoice(start()))}>
          {held.map((c) => (
            <option key={c} value={c}>
              {rules.classes.get(c)?.name} {(entity.classes.find((x) => x.classId === c)?.level ?? 0) + 1}
            </option>
          ))}
          <optgroup label="A new class">
            {rules.data.classes.classes
              .filter((c) => !held.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} 1
                </option>
              ))}
          </optgroup>
        </select>
      </label>
      {prerequisites.map((p) => (
        <p key={p} className="meta">
          {p}
        </p>
      ))}
      {held.length > 0 && (
        <fieldset className="hp-choice">
          <legend>Hit points</legend>
          {rolledHp && (
            <button type="button" className={waiting ? 'primary' : 'secondary'} onClick={roll}>
              Roll 1d{cls.hitDie}
              {hp.method === 'rolled' && hp.value ? ` · ${hp.value}` : ''}
            </button>
          )}
          <label>
            <input type="radio" name="hp" checked={hp.method === 'fixed'} onChange={() => setHpChoice({ method: 'fixed' })} /> Fixed · {fixed}
          </label>
          {!rolledHp && (
            <button type="button" className="secondary" onClick={roll}>
              Roll 1d{cls.hitDie}
              {hp.method === 'rolled' && hp.value ? ` · ${hp.value}` : ''}
            </button>
          )}
          <label className="hp-typed">
            <span>Or type the table’s roll</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={cls.hitDie}
              value={hp.method === 'rolled' ? (hp.value ?? '') : ''}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value))
                setHpChoice(n >= 1 && n <= cls.hitDie ? { method: 'rolled', value: n } : start())
              }}
            />
          </label>
        </fieldset>
      )}
      <p>
        <span className="meta">Brings</span> {brings.features.join(', ') || 'no new feature'}
        {brings.subclass && ' · a subclass to choose'}
        {brings.choices > 0 && ` · ${brings.choices} ${brings.choices === 1 ? 'choice' : 'choices'} to make`}
      </p>
      <ul className="level-diff">
        {diffs.map(([name, a, b]) => (
          <li key={name}>
            <span>{name}</span>
            <span>
              {a} → {b}
            </span>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button type="button" className="primary" disabled={waiting && held.length > 0} onClick={addLevel}>
          Add level {sheet.level + 1}
        </button>
        {waiting && held.length > 0 && <p className="meta">Roll the Hit Die, type the table’s roll, or choose Fixed.</p>}
      </div>
    </section>
  )
}

function Levelling({ rules, entity, level, update }: { rules: Rules; entity: CharacterEntity; level: number; update: Update }) {
  const next = rules.data.core.advancement.find((a) => a.level === level + 1)
  const mode = entity.levelling.mode
  return (
    <div className="levelling">
      <label className="field">
        <span>Levelling</span>
        <select value={mode} onChange={(e) => update((x) => ({ ...x, levelling: { ...x.levelling, mode: e.target.value as 'xp' | 'milestone' } }))}>
          <option value="xp">Experience points</option>
          <option value="milestone">Milestone</option>
        </select>
      </label>
      {mode === 'xp' && (
        <label className="field">
          <span>XP {next && <span className="meta">· level {next.level} at {next.xp.toLocaleString()}</span>}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={entity.levelling.xp}
            onChange={(e) => {
              const xp = Math.max(0, Math.round(Number(e.target.value)) || 0)
              update((x) => ({ ...x, levelling: { ...x.levelling, xp } }))
            }}
          />
        </label>
      )}
    </div>
  )
}

// Multiclassing's prerequisite (SRD p.24): 13 in the primary ability of the
// new class and of every class held. Said, never enforced (§5.2).
function multiclassWarnings(rules: Rules, sheet: Sheet, classIds: string[]): string[] {
  const out: string[] = []
  for (const id of classIds) {
    const cls = rules.classes.get(id)
    if (!cls) continue
    const scores = cls.primaryAbilities.map((a) => sheet.abilities[a].score)
    const ok = cls.primaryAbilitiesMode === 'any' ? scores.some((s) => s >= 13) : scores.every((s) => s >= 13)
    if (!ok) out.push(`Multiclassing asks 13 in ${cls.primaryAbilities.map((a) => ABILITY_SHORT[a]).join(cls.primaryAbilitiesMode === 'any' ? ' or ' : ' and ')} for ${cls.name} (SRD p.24); this character has ${cls.primaryAbilities.map((a) => `${ABILITY_SHORT[a]} ${sheet.abilities[a].score}`).join(', ')}. Your table may allow it.`)
  }
  return out
}

function ClassWindow({ rules, entity, classId, update, onClose }: { rules: Rules; entity: CharacterEntity; classId: string; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const cls = rules.classes.get(classId)
  const entry = entity.classes.find((c) => c.classId === classId)
  if (!cls || !entry) return null
  const subclasses = [...rules.subclasses.values()].filter((s) => s.classId === classId)
  return (
    <Window dialog={dialog} labelledBy="class-heading">
      <WindowHeader id="class-heading" title={cls.name} />
      <div className="stepper">
        <button type="button" className="secondary" aria-label={`Lower ${cls.name}’s level`} disabled={entry.level <= 1} onClick={() => update((e) => setClassLevel(e, classId, entry.level - 1))}>
          −
        </button>
        <span role="status">Level {entry.level}</span>
        <button type="button" className="secondary" aria-label={`Raise ${cls.name}’s level`} disabled={characterLevel(entity) >= 20} onClick={() => update((e) => setClassLevel(e, classId, entry.level + 1))}>
          +
        </button>
      </div>
      <label className="field">
        <span>Subclass {entry.level < cls.subclassLevel && <span className="meta">· from level {cls.subclassLevel}</span>}</span>
        <select value={entry.subclassId ?? ''} onChange={(e) => update((x) => setSubclass(x, classId, e.target.value || null))}>
          <option value="">None yet</option>
          {/* One the rules lack (an import's) is kept, and said so. */}
          {entry.subclassId && !rules.subclasses.has(entry.subclassId) && <option value={entry.subclassId}>{unresolved(entry.subclassId)}</option>}
          {subclasses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={() => (update((e) => removeClass(e, classId)), dialog.close())}>
          Remove {cls.name}
        </button>
        <button type="button" className="primary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

function AddClassWindow({ rules, entity, sheet, update, onClose }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const held = entity.classes.map((c) => c.classId)
  return (
    <Window dialog={dialog} className="choice-sheet" labelledBy="add-class-heading">
      <WindowHeader id="add-class-heading" title={held.length ? 'Add a class' : 'Choose a class'} />
      <ul className="choice-list">
        {rules.data.classes.classes
          .filter((c) => !held.includes(c.id))
          .map((c) => {
            const warn = held.length ? multiclassWarnings(rules, sheet, [...held, c.id]) : []
            return (
              <li key={c.id}>
                <button type="button" className="choice-button" onClick={() => (update((e) => addClass(e, c.id)), dialog.close())}>
                  <span className="choice-name">{c.name}</span>
                  <span className="choice-detail">d{c.hitDie}</span>
                  {warn.length > 0 && <span className="choice-unmet">Prerequisite unmet</span>}
                </button>
              </li>
            )
          })}
      </ul>
    </Window>
  )
}

function OriginWindow({ rules, entity, update, onClose }: { rules: Rules; entity: CharacterEntity; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} labelledBy="origin-heading">
      <WindowHeader id="origin-heading" title="Origin" />
      <OriginFields rules={rules} entity={entity} update={update} />
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

function ScoresWindow({ entity, sheet, update, onClose }: { entity: CharacterEntity; sheet: Sheet; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  return (
    <Window dialog={dialog} labelledBy="scores-heading">
      <WindowHeader id="scores-heading" title="Ability scores" />
      <p className="meta">The base scores, before the background’s increases and feats, as your sheet has them. The final score is beside each.</p>
      <div className="score-grid">
        {ABILITIES.map((a) => (
          <label key={a}>
            <span>{ABILITY_SHORT[a]}</span>
            <input type="number" inputMode="numeric" min={1} max={30} defaultValue={entity.abilities.base[a]} onChange={(e) => e.target.value && update((x) => setBaseScore(x, a, Number(e.target.value)))} />
            <span className="score-final">{sheet.abilities[a].score}</span>
          </label>
        ))}
      </div>
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

function HpWindow({ rules, entity, rung, update, onClose }: { rules: Rules; entity: CharacterEntity; rung: Rung; update: Update; onClose: () => void }) {
  const dialog = useHudDialog({ onClose, dismissOnOutside: true })
  const record = useRecordRoll()
  const die = rules.classes.get(rung.classId)?.hitDie ?? 8
  const name = `${rung.className} ${rung.level}`
  const roll = () => {
    const notation = `1d${die}`
    const rolled = rollFaces(notation)
    const described = describeRoll(`${name} hit points`, notation, rolled)
    showDice(described)
    record(entity, described)
    update((e) => setHp(e, rung.classId, rung.level, 'rolled', rolled.total))
  }
  return (
    <Window dialog={dialog} labelledBy="hp-heading">
      <WindowHeader id="hp-heading" title={`${name} hit points`} />
      <p className="meta">Before the Constitution modifier. The fixed value is {Math.floor(die / 2) + 1}.</p>
      <div className="actions">
        <button type="button" className="secondary" aria-pressed={rung.hp.method !== 'rolled'} onClick={() => update((e) => setHp(e, rung.classId, rung.level, 'fixed'))}>
          Fixed · {Math.floor(die / 2) + 1}
        </button>
        <button type="button" className="secondary" onClick={roll}>
          Roll 1d{die}
        </button>
      </div>
      <label className="field">
        <span>Or type the table’s roll</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={die}
          defaultValue={rung.hp.method === 'rolled' ? rung.hp.value : undefined}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value))
            if (n >= 1 && n <= die) update((x) => setHp(x, rung.classId, rung.level, 'rolled', n))
          }}
        />
      </label>
      <div className="dialog-actions">
        <button type="button" className="primary" onClick={dialog.close}>
          Done
        </button>
      </div>
    </Window>
  )
}

// Finish's review for a character started at any level: the character in a
// line, what is still open, and the name and languages, which this route
// has no other place for. Finish opens the sheet whatever is left.
function FinishReview({ rules, entity, sheet, owed, update, onFinish, onClose }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; owed: number; update: Update; onFinish: () => void; onClose: () => void }) {
  const dialog = useHudDialog({ onClose })
  const left = anyLevelUnfinished(rules, entity, owed)
  return (
    <Window dialog={dialog} className="finish-review" labelledBy="finish-heading">
      <WindowHeader id="finish-heading" title="Finish" />
      <p className="meta">
        Level {sheet.level} · {sheet.classes.map((c) => `${c.name} ${c.level}`).join(' / ') || 'no class'} · HP {sheet.hp.max} · AC {sheet.ac.total}
      </p>
      {left.length === 0 ? (
        <p>Everything is chosen.</p>
      ) : (
        <ul className="review">
          {left.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      <label className="field">
        <span>Name</span>
        <input type="text" defaultValue={entity.name} onChange={(e) => update((x) => ({ ...x, name: e.target.value }))} autoComplete="off" />
      </label>
      <LanguagesField rules={rules} entity={entity} update={update} />
      <p className="meta">Finish opens the sheet. Anything left stays on this page.</p>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={dialog.close}>
          Back to the levels
        </button>
        <button type="button" className="primary" onClick={() => dialog.closeThen(onFinish)}>
          Finish
        </button>
      </div>
    </Window>
  )
}
