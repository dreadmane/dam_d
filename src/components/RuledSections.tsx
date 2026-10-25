import type { SectionId } from '../play/sheet-layout.ts'
import type { Sheet } from '../rules/derive.ts'
import type { Rules } from '../rules/load.ts'
import type { CharacterEntity, RosterRecord } from '../save/types.ts'
import { AbilitiesSection } from './Abilities.tsx'
import { AttacksSection } from './Attacks.tsx'
import { ConditionsSection } from './Conditions.tsx'
import { FeaturesSection } from './Features.tsx'
import { DeathSavesSection, HealthWindow } from './Health.tsx'
import { QuickRoll } from './QuickRoll.tsx'
import { ResourcesSection, RestSection } from './Resources.tsx'
import { SkillsSection } from './Skills.tsx'
import { QuickBarSection, QuickDock } from './QuickBar.tsx'
import { ReactionsBand } from './Reactions.tsx'
import { SpellsSection } from './Spells.tsx'
import { TurnSection } from './Turn.tsx'

// The sheet's sections the rules derive, gathered so the sheet loads them
// with the rules, on demand (screens/PlayView.tsx): none can draw before the
// rules arrive, so the startup script need not carry them.

type Update = (change: (entity: CharacterEntity) => CharacterEntity) => RosterRecord | null

export function RuledSection({ id, rosterId, sheet, rules, entity, update, onHeal }: { id: SectionId; rosterId: string; sheet: Sheet; rules: Rules; entity: CharacterEntity; update: Update; onHeal: () => void }) {
  switch (id) {
    case 'turn':
      return <TurnSection rosterId={rosterId} rules={rules} entity={entity} sheet={sheet} update={update} />
    case 'death-saves':
      return <DeathSavesSection rules={rules} entity={entity} sheet={sheet} update={update} onHeal={onHeal} />
    case 'quick-bar':
      return <QuickBarSection rules={rules} entity={entity} sheet={sheet} update={update} />
    case 'attacks':
      return <AttacksSection sheet={sheet} rules={rules} entity={entity} />
    case 'abilities':
      return <AbilitiesSection sheet={sheet} rules={rules} entity={entity} />
    case 'skills':
      return <SkillsSection sheet={sheet} rules={rules} entity={entity} />
    case 'spells':
      return <SpellsSection rules={rules} entity={entity} sheet={sheet} update={update} />
    case 'conditions':
      return <ConditionsSection rules={rules} entity={entity} sheet={sheet} update={update} />
    case 'resources':
      return <ResourcesSection sheet={sheet} update={update} />
    case 'rest':
      return <RestSection rules={rules} entity={entity} sheet={sheet} update={update} />
    default:
      return <FeaturesSection sheet={sheet} />
  }
}

export { HealthWindow, QuickDock, QuickRoll, ReactionsBand }
