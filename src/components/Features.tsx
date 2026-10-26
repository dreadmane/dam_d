import { useState } from 'react'
import type { Sheet } from '../rules/derive.ts'
import type { GainedFeature } from '../rules/effects.ts'
import { featureRule } from './cards.ts'
import { RuleCard } from './RuleCard.tsx'
import { SheetSection } from './SheetSection.tsx'

// Features and traits (the spec §3.3, a menu): every feature from class,
// subclass, species, background and feats, grouped by source, each opening
// its rule card. The SRD's records carry the SRD's own words, which its
// licence permits with the attribution (the spec §8, D1; Settings carries
// the statement, and each card names the SRD).
export function FeaturesSection({ sheet }: { sheet: Sheet }) {
  const [open, setOpen] = useState<GainedFeature | null>(null)
  const groups = new Map<string, GainedFeature[]>()
  for (const g of sheet.features) groups.set(g.group, [...(groups.get(g.group) ?? []), g])
  return (
    <SheetSection id="features" count={String(sheet.features.length)}>
      {sheet.features.length === 0 && <p className="meta">A class, species and background bring features.</p>}
      {[...groups].map(([group, features]) => (
        <div key={group} className="skill-group">
          <h3 className="skill-group-name">{group}</h3>
          <ul className="stat-list">
            {features.map((g) => (
              <li key={`${g.feature.id}:${g.level ?? ''}`}>
                <button type="button" className="stat-row feature-row" aria-haspopup="dialog" onClick={() => setOpen(g)}>
                  <span className="stat-name">{g.feature.name}</span>
                  {g.level !== undefined && <span className="stat-detail">{levelLabel(sheet, g)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {open && <RuleCard rule={featureRule(open, sheet)} onClose={() => setOpen(null)} />}
    </SheetSection>
  )
}

// Under its own class, "Level 4"; elsewhere (a feat taken at a class level),
// which class: "Cleric 4".
function levelLabel(sheet: Sheet, g: GainedFeature): string {
  const cls = sheet.classes.find((c) => c.classId === g.classId)
  return cls && cls.name !== g.group && cls.subclass !== g.group ? `${cls.name} ${g.level}` : `Level ${g.level}`
}

