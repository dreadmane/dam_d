// Proficiency and Expertise as marks that need no colour (the spec §6.3): an
// empty ring, a filled one, and two filled, since misreading one changes a
// roll. Drawn rather than typed: the fonts draw ● much smaller than ○. The
// mark's name is said to a screen reader.
const LABEL = ['Not proficient', 'Proficient', 'Expertise'] as const

export function ProficiencyMark({ level }: { level: 0 | 1 | 2 }) {
  const dots = level === 2 ? [5, 15] : [5]
  return (
    <svg className="prof-mark" data-level={level} viewBox={`0 0 ${level === 2 ? 20 : 10} 10`} width={level === 2 ? 20 : 10} height="10" role="img" aria-label={LABEL[level]}>
      {dots.map((cx) => (
        <circle key={cx} cx={cx} cy="5" r="4" fill={level ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
      ))}
    </svg>
  )
}
