import { languageRule, setLanguages } from '../play/build.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity } from '../save/types.ts'

// The languages a character chooses (SRD p.20: the ones every character
// knows, and how many more from which kind), as the build's Details step and
// the any-level Finish review both ask for them.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => unknown

export function LanguagesField({ rules, entity, update }: { rules: Rules; entity: CharacterEntity; update: Update }) {
  const { known, choose, options } = languageRule(rules)
  const chosen = entity.details.languages.filter((l) => !known.includes(l))
  const toggle = (l: string) => update((e) => setLanguages(rules, e, chosen.includes(l) ? chosen.filter((x) => x !== l) : [...chosen, l]))
  return (
    <fieldset className="field">
      <legend>
        Languages · {rules.data.core.languages.filter((l) => known.includes(l.id)).map((l) => l.name).join(', ')}, and {choose} of these{' '}
        <span className="meta">({chosen.length} of {choose})</span>
      </legend>
      <ul className="choice-list">
        {options.map((l) => (
          <li key={l.id}>
            <label>
              <input type="checkbox" checked={chosen.includes(l.id)} disabled={!chosen.includes(l.id) && chosen.length >= choose} onChange={() => toggle(l.id)} />
              <span className="choice-name">{l.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
