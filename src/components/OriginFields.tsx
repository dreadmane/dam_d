import { backgroundIncreaseFits, setBackground, setBackgroundIncreases, setSize, setSpecies } from '../play/ladder.ts'
import type { Ability } from '../rules/expr.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'
import { unresolved } from '../rules/unresolved.ts'

// The origin's fields, shared by the ladder's Origin window and the build's
// Origin step: the species (and its size where it offers one), the
// background, and the background's increases, +2 and +1 or +1 to all three
// (SRD p.83). The build asks the background first, as the PHB's step 2
// does; the ladder asks the species first, as a sheet reads.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown

const SHORT: Record<Ability, string> = { str: 'Str', dex: 'Dex', con: 'Con', int: 'Int', wis: 'Wis', cha: 'Cha' }

export function OriginFields({ rules, entity, update, backgroundFirst = false }: { rules: Rules; entity: CharacterEntity; update: Update; backgroundFirst?: boolean }) {
  const species = entity.species && rules.species.get(entity.species.speciesId)
  const speciesFields = (
    <>
      <label className="field">
        <span>Species</span>
        <select value={entity.species?.speciesId ?? ''} onChange={(e) => update((x) => setSpecies(x, e.target.value || null, rules))}>
          <option value="">Choose…</option>
          {/* One the rules lack (an import's) is kept, and said so. */}
          {entity.species && !species && <option value={entity.species.speciesId}>{unresolved(entity.species.speciesId)}</option>}
          {rules.data.species.species.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {species && species.sizes.length > 1 && (
        <label className="field">
          <span>Size</span>
          <select value={entity.species?.size ?? species.sizes[0]} onChange={(e) => update((x) => setSize(x, e.target.value as 'small' | 'medium'))}>
            {species.sizes.map((s) => (
              <option key={s} value={s}>
                {s === 'small' ? 'Small' : 'Medium'}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  )
  const backgroundField = (
    <label className="field">
      <span>Background</span>
      <select value={entity.background?.backgroundId ?? ''} onChange={(e) => update((x) => setBackground(x, e.target.value || null, rules))}>
        <option value="">Choose…</option>
        {entity.background && !rules.backgrounds.has(entity.background.backgroundId) && <option value={entity.background.backgroundId}>{unresolved(entity.background.backgroundId)}</option>}
        {rules.data.backgrounds.backgrounds.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  )
  return backgroundFirst ? (
    <>
      {backgroundField}
      <BackgroundIncreases rules={rules} entity={entity} update={update} />
      {speciesFields}
    </>
  ) : (
    <>
      {speciesFields}
      {backgroundField}
      <BackgroundIncreases rules={rules} entity={entity} update={update} />
    </>
  )
}

export function BackgroundIncreases({ rules, entity, update }: { rules: Rules; entity: CharacterEntity; update: Update }) {
  const background = entity.background && rules.backgrounds.get(entity.background.backgroundId)
  if (!background) return null
  const increases = entity.background?.abilityIncreases ?? {}
  const fits = backgroundIncreaseFits(increases, background.abilities)
  return (
    <fieldset className="increase-grid">
      <legend>{background.name}’s increases · +2 and +1, or +1 to all three</legend>
      {(background.abilities as Ability[]).map((a) => (
        <label key={a}>
          <span>{SHORT[a]}</span>
          <select value={increases[a] ?? 0} onChange={(e) => update((x) => setBackgroundIncreases(x, { ...increases, [a]: Number(e.target.value) }))}>
            <option value={0}>+0</option>
            <option value={1}>+1</option>
            <option value={2}>+2</option>
          </select>
        </label>
      ))}
      {!fits && <p className="owed">That isn’t +2 and +1, or +1 to all three (SRD p.83).</p>}
    </fieldset>
  )
}
