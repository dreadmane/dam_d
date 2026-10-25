import { useMemo, useState, type ReactNode } from 'react'
import { Choices } from '../components/ChoiceChips.tsx'
import { ChoiceSheet } from '../components/ChoiceSheet.tsx'
import { Link } from '../components/Link.tsx'
import { BackgroundIncreases, OriginFields } from '../components/OriginFields.tsx'
import { ScreenHeading } from '../components/ScreenHeading.tsx'
import { TopBar } from '../components/TopBar.tsx'
import { characterName } from '../components/character-name.ts'
import { showDice } from '../dice/app-tray.ts'
import { describeRoll } from '../dice/describe.ts'
import { rollFaces } from '../dice/roll.ts'
import {
  applyStartingEquipment,
  keepHighest,
  packages,
  placeRolls,
  pointBudget,
  pointBuyStart,
  pointCost,
  pointsSpent,
  pointStep,
  randomRule,
  setBuildClass,
  setScores,
  standardAssignment,
  STARTING_TAG,
  STEP_NAME,
  STEPS,
  swapScore,
  unfinished,
  type Method,
  type Step,
} from '../play/build.ts'
import { LanguagesField } from '../components/LanguagesField.tsx'
import { originChoices, rungs, setChoice } from '../play/ladder.ts'
import { useRecordRoll } from '../rolls/app-rolls.ts'
import { navigate } from '../routes.ts'
import { deriveSheet, type Sheet } from '../rules/derive.ts'
import { ABILITIES, type Ability } from '../rules/expr.ts'
import type { OwedChoice } from '../rules/level.ts'
import { useRules, type Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/record.ts'
import { primaryEntity, useRoster } from '../save/use-roster.ts'
import { useCharacterTitle } from '../title.ts'
import { buildFinishedLine } from '../voice.ts'
import { RulesLoading } from './RulesLoading.tsx'

// The guided build from level 1 (the spec §3.1 B; PHB ch.2, Create Your
// Character): Crawler Interface's creation flow, one decision per screen
// along a step rail, every step revisitable, every change saved at once so a
// closed tab resumes where it left off. Class; Origin, background first;
// Scores by any of the three printed methods, the standard array
// preassigned from the Standard Array by Class table; Level 1, the ladder's
// first rung and the origin's choices; Details; Gear, the class's and
// background's packages; Finish, a review of anything unfinished, each
// linked to its step. The fast path is the defaults all the way through.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown

const NAMES: Record<Ability, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }
const SHORT: Record<Ability, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }

export function BuildScreen({ id, step }: { id: string; step: string }) {
  const { status, update } = useRoster(id)
  const rules = useRules()
  useCharacterTitle(status)
  const current = (STEPS as readonly string[]).includes(step) ? (step as Step) : 'class'
  if (status.kind !== 'ready' || rules.kind !== 'ready') {
    const message = status.kind === 'failed' ? status.message : rules.kind === 'failed' ? rules.message : null
    return (
      <RulesLoading
        top={
          <TopBar>
            <Link to={{ screen: 'roster' }}>All characters</Link>
          </TopBar>
        }
        title="Build"
        message={message}
      />
    )
  }
  return <Build id={id} step={current} entity={primaryEntity(status.roster)} rules={rules.rules} update={update} />
}

function Build({ id, step, entity, rules, update }: { id: string; step: Step; entity: CharacterEntity; rules: Rules; update: Update }) {
  const sheet = useMemo(() => deriveSheet(rules, entity), [rules, entity])
  const at = STEPS.indexOf(step)
  const go = (s: Step) => navigate({ screen: 'build', id, step: s }, { replace: true })
  const left = useMemo(() => unfinished(rules, entity), [rules, entity])

  let body: ReactNode
  switch (step) {
    case 'class':
      body = <ClassStep rules={rules} entity={entity} update={update} />
      break
    case 'origin':
      body = (
        <>
          <p className="meta">The PHB’s step 2: a background, then a species.</p>
          <OriginFields rules={rules} entity={entity} update={update} backgroundFirst />
        </>
      )
      break
    case 'scores':
      body = <ScoresStep rules={rules} entity={entity} sheet={sheet} update={update} />
      break
    case 'level-1':
      body = <LevelOneStep rules={rules} entity={entity} sheet={sheet} update={update} />
      break
    case 'details':
      body = <DetailsStep rules={rules} entity={entity} update={update} />
      break
    case 'gear':
      body = <GearStep rules={rules} entity={entity} update={update} />
      break
    case 'finish':
      body = (
        <>
          {left.length === 0 ? (
            <p>{buildFinishedLine(entity.name)}</p>
          ) : (
            <ul className="review">
              {left.map((u) => (
                <li key={u.text}>
                  <Link to={{ screen: 'build', id, step: u.step }}>{STEP_NAME[u.step]}</Link> · {u.text}
                </li>
              ))}
            </ul>
          )}
          <p className="meta">
            Level 1 · HP {sheet.hp.max} · AC {sheet.ac.total}. Finish opens the sheet; anything left stays on the Levels page.
          </p>
        </>
      )
      break
  }

  const finish = () => {
    update((e) => ({ ...e, creation: { ...e.creation, route: 'level-1', complete: true }, hp: { ...e.hp, current: sheet.hp.max } }))
    navigate({ screen: 'character', id })
  }

  return (
    <main className="ladder-screen">
      <TopBar>
        <Link to={{ screen: 'roster' }}>All characters</Link>
      </TopBar>
      <ScreenHeading>{characterName(entity.name)}</ScreenHeading>
      <p className="meta">
        Build from level 1 · Step {at + 1} of {STEPS.length}
      </p>
      <nav aria-label="Steps">
        <ol className="step-rail">
          {STEPS.map((s, i) => (
            <li key={s} data-done={i < at || undefined}>
              <Link to={{ screen: 'build', id, step: s }} aria-current={s === step ? 'step' : undefined}>
                {STEP_NAME[s]}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <h2 className="ladder-heading">{STEP_NAME[step]}</h2>
      {body}
      <div className="ladder-foot">
        {at > 0 ? (
          <button type="button" className="secondary" onClick={() => go(STEPS[at - 1])}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step === 'finish' ? (
          <button type="button" className="primary" onClick={finish}>
            Finish
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => go(STEPS[at + 1])}>
            Next: {STEP_NAME[STEPS[at + 1]]}
          </button>
        )}
      </div>
    </main>
  )
}

function ClassStep({ rules, entity, update }: { rules: Rules; entity: CharacterEntity; update: Update }) {
  const chosen = entity.classes[0]?.classId
  const pick = (classId: string) =>
    update((e) => {
      const next = setBuildClass(e, classId)
      // The array follows the class while it is still the array: the table
      // suggests where each class puts its scores (SRD p.21).
      return e.abilities.generation.method === 'standard-array' || e.abilities.generation.method === 'entered' ? setScores(next, standardAssignment(rules, classId), 'standard-array') : next
    })
  return (
    <ul className="choice-list choice-list-tall">
      {rules.data.classes.classes.map((c) => (
        <li key={c.id}>
          <label>
            <input type="radio" name="class" checked={chosen === c.id} onChange={() => pick(c.id)} />
            <span className="choice-name">{c.name}</span>
            <span className="choice-detail">
              d{c.hitDie} · {c.primaryAbilities.map((a) => SHORT[a]).join(c.primaryAbilitiesMode === 'any' ? ' or ' : ' and ')}
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}

function ScoresStep({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const method = entity.abilities.generation.method === 'entered' ? 'standard-array' : (entity.abilities.generation.method as Method)
  const base = entity.abilities.base
  const classId = entity.classes[0]?.classId
  const record = useRecordRoll()
  const random = randomRule(rules)
  const rolls = entity.abilities.generation.rolls
  const switchTo = (m: Method) =>
    update((e) => {
      if (m === 'standard-array') return setScores(e, standardAssignment(rules, classId), m)
      if (m === 'point-buy') return setScores(e, pointBuyStart(rules), m)
      return setScores(e, e.abilities.base, m, [])
    })
  const rollNext = () => {
    const rolled = rollFaces(random.dice)
    const described = describeRoll(`Ability score ${rolls.length + 1}`, random.dice, rolled)
    showDice(described)
    record(entity, described)
    const all = [...rolls, keepHighest(rolled.faces, random.keep)]
    update((e) => setScores(e, all.length === random.times ? placeRolls(rules, classId, all) : e.abilities.base, 'random', all))
  }
  const spent = pointsSpent(rules, base)
  const pool = method === 'standard-array' ? rules.data.core.abilityScoreMethods!.standardArray.scores : rolls

  return (
    <>
      <div className="seg" role="group" aria-label="How to make the scores">
        {(
          [
            ['standard-array', 'Standard array'],
            ['point-buy', 'Point buy'],
            ['random', 'Random'],
          ] as [Method, string][]
        ).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={method === m} onClick={() => method !== m && switchTo(m)}>
            {label}
          </button>
        ))}
      </div>
      {method === 'point-buy' && (
        <p role="status">
          <b>{spent}</b> <span className="meta">of {pointBudget(rules)} points spent ·</span> <b>{pointBudget(rules) - spent}</b> <span className="meta">left</span>
        </p>
      )}
      {method === 'random' && rolls.length < random.times && (
        <div className="actions">
          <button type="button" className="primary" onClick={rollNext}>
            Roll {random.dice}, keep {random.keep} ({rolls.length + 1} of {random.times})
          </button>
          {rolls.length > 0 && <span className="meta">Rolled {rolls.join(', ')}</span>}
        </div>
      )}
      {(method !== 'random' || rolls.length === random.times) && (
        <ul className="stat-list score-rows">
          {ABILITIES.map((a) => (
            <li key={a} className="score-row">
              <span className="stat-name">{NAMES[a]}</span>
              {method === 'point-buy' ? (
                <span className="stepper-inline">
                  <button type="button" className="secondary" aria-label={`Lower ${NAMES[a]}`} disabled={!pointStep(rules, base, a, -1)} onClick={() => update((e) => setScores(e, pointStep(rules, e.abilities.base, a, -1) ?? e.abilities.base, 'point-buy'))}>
                    −
                  </button>
                  <span className="stat-value">{base[a]}</span>
                  <button type="button" className="secondary" aria-label={`Raise ${NAMES[a]}`} disabled={!pointStep(rules, base, a, 1)} onClick={() => update((e) => setScores(e, pointStep(rules, e.abilities.base, a, 1) ?? e.abilities.base, 'point-buy'))}>
                    +
                  </button>
                  <span className="meta">costs {pointCost(rules, base[a]) ?? '—'}</span>
                </span>
              ) : (
                <select aria-label={NAMES[a]} value={base[a]} onChange={(e) => update((x) => setScores(x, swapScore(x.abilities.base, a, Number(e.target.value)), method, rolls))}>
                  {[...new Set(pool)]
                    .sort((x, y) => y - x)
                    .map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                </select>
              )}
              <span className="score-final">
                {sheet.abilities[a].score} ({sheet.abilities[a].modifier < 0 ? '−' : '+'}
                {Math.abs(sheet.abilities[a].modifier)})
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="meta">
        {method === 'standard-array' && 'Placed as the Standard Array by Class table suggests for your class (SRD p.21). Choosing a score for one ability swaps it with the ability that had it.'}
        {method === 'point-buy' && 'Each score from 8 to 15, at the Ability Score Point Costs table’s price (SRD p.21).'}
        {method === 'random' && `Each score is the highest ${random.keep} of ${random.dice}, ${random.times} times, rolled on the app’s dice and kept in Rolls (SRD p.21). They’re placed as your class’s table places the array; choosing one swaps it.`}
      </p>
      <BackgroundIncreases rules={rules} entity={entity} update={update} />
      <p className="meta">The last column is the final score, after the background.</p>
    </>
  )
}

function LevelOneStep({ rules, entity, sheet, update }: { rules: Rules; entity: CharacterEntity; sheet: Sheet; update: Update }) {
  const [open, setOpen] = useState<OwedChoice | null>(null)
  const origin = originChoices(rules, entity)
  const first = rungs(rules, entity).find((r) => r.level === 1)
  if (!first && !origin.length) return <p className="meta">Choose a class and an origin first; their choices come here.</p>
  return (
    <>
      <p className="meta">What your origin and your class’s level 1 ask you to choose.</p>
      {origin.length > 0 && (
        <div className="rung-body">
          <Choices list={origin} rules={rules} onOpen={setOpen} />
        </div>
      )}
      {first && (
        <>
          <h3 className="ladder-heading">{first.className} 1</h3>
          <div className="rung-body">
            <Choices list={first.choices} rules={rules} onOpen={setOpen} />
            <span className="rung-features">{first.features.map((f) => f.name).join(', ')}</span>
          </div>
        </>
      )}
      {open && <ChoiceSheet rules={rules} entity={entity} sheet={sheet} owed={open} onSave={(values, inc) => update((e) => setChoice(e, open, values, inc))} onClose={() => setOpen(null)} />}
    </>
  )
}

function DetailsStep({ rules, entity, update }: { rules: Rules; entity: CharacterEntity; update: Update }) {
  return (
    <>
      <label className="field">
        <span>Name</span>
        <input type="text" defaultValue={entity.name} onChange={(e) => update((x) => ({ ...x, name: e.target.value }))} />
      </label>
      <label className="field">
        <span>Alignment</span>
        <input type="text" defaultValue={entity.details.alignment} onChange={(e) => update((x) => ({ ...x, details: { ...x.details, alignment: e.target.value } }))} />
      </label>
      <LanguagesField rules={rules} entity={entity} update={update} />
      <label className="field">
        <span>Appearance</span>
        <textarea rows={3} defaultValue={entity.details.appearance} onChange={(e) => update((x) => ({ ...x, details: { ...x.details, appearance: e.target.value } }))} />
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea rows={3} defaultValue={entity.notes} onChange={(e) => update((x) => ({ ...x, notes: e.target.value }))} />
      </label>
    </>
  )
}

function GearStep({ rules, entity, update }: { rules: Rules; entity: CharacterEntity; update: Update }) {
  const lists = packages(rules, entity)
  const picks = entity.creation.equipment ?? {}
  const apply = (next: { class?: string; background?: string }) => update((e) => applyStartingEquipment(rules, e, next, () => crypto.randomUUID()))
  const starting = entity.inventory.filter((i) => i.tags.includes(STARTING_TAG))
  const group = (title: string, list: typeof lists.class, key: 'class' | 'background') =>
    list && (
      <fieldset className="field">
        <legend>{title}</legend>
        <ul className="choice-list choice-list-tall">
          {list.map((p) => (
            <li key={p.id}>
              <label>
                <input type="radio" name={key} checked={picks[key] === p.id} onChange={() => apply({ ...picks, [key]: p.id })} />
                <span className="choice-name">{p.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    )
  return (
    <>
      {!lists.class && !lists.background && <p className="meta">Choose a class and a background first; their packages come here.</p>}
      {group(`${rules.classes.get(entity.classes[0]?.classId ?? '')?.name ?? 'Class'}`, lists.class, 'class')}
      {group(`${rules.backgrounds.get(entity.background?.backgroundId ?? '')?.name ?? 'Background'}`, lists.background, 'background')}
      {(starting.length > 0 || entity.creation.equipment) && (
        <p className="meta">
          Adds {starting.length} {starting.length === 1 ? 'item' : 'items'} and {entity.coins.gp} GP to the Inventory{starting.some((i) => i.worn) ? `; ${starting.filter((i) => i.worn).map((i) => i.name).join(' and ')} worn` : ''}.
        </p>
      )}
    </>
  )
}
