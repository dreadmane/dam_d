// The rules snapshot in data/rules/ (scripts/lib/integrity.mjs, which the
// build runs over it): only the SRD's public tier is here, never the books'
// private one (the spec §2.1), the shipped data passes, and each kind of
// break the check covers is caught.

import { describe, expect, it } from 'vitest'
import { checkIntegrity } from '../../scripts/lib/integrity.mjs'
import { readRulesFolder, SNAPSHOT_DIR, snapshotEntries } from '../../scripts/lib/rules-data.mjs'

const files: Record<string, Record<string, unknown>> = Object.fromEntries(readRulesFolder(SNAPSHOT_DIR).data.map((f) => [f.name, f.json]))

type Records = { id: string; [key: string]: unknown }[]

describe('the rules snapshot', () => {
  it('holds the public tier only: every file says meta.tier srd, and there is no books/ folder', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0)
    for (const [name, json] of Object.entries(files)) expect((json.meta as { tier?: string }).tier, name).toBe('srd')
    expect(snapshotEntries()).not.toContain('books')
    expect(snapshotEntries()).toEqual(['manifest.json', 'schemas', 'srd'])
  })

  it('passes the integrity check', () => {
    const result = checkIntegrity(files)
    expect(result.errors).toEqual([])
    expect(result.checked).toBeGreaterThan(1000)
  })
})

describe('the integrity check', () => {
  it('fails a file of the private tier', () => {
    const feats = structuredClone(files['feats.json'])
    ;(feats.meta as { tier: string }).tier = 'books'
    expect(checkIntegrity({ ...files, 'feats.json': feats }).errors).toEqual([expect.stringContaining('feats.json: meta.tier is books')])
  })

  it('fails a file with no text policy or attribution', () => {
    const feats = structuredClone(files['feats.json'])
    delete (feats.meta as Record<string, unknown>).textPolicy
    delete (feats.meta as Record<string, unknown>).attribution
    const { errors } = checkIntegrity({ ...files, 'feats.json': feats })
    expect(errors).toEqual([expect.stringContaining('meta.textPolicy'), expect.stringContaining('meta.attribution')])
  })

  it('fails an id held twice in one list', () => {
    const feats = structuredClone(files['feats.json'])
    const list = feats.feats as Records
    list.push({ ...list[0] })
    expect(checkIntegrity({ ...files, 'feats.json': feats }).errors).toEqual([expect.stringContaining(`has id ${list[0].id} twice`)])
  })

  it('fails a reference to an id its file does not hold, and to a file that is not here', () => {
    const skills = structuredClone(files['skills.json'])
    ;(skills.skills as Records)[0].examples = 'core:no-such-rule'
    ;(skills.skills as Records)[1].examples = 'no-such-file:str'
    const { errors } = checkIntegrity({ ...files, 'skills.json': skills })
    expect(errors).toEqual([expect.stringContaining('core.json has no id no-such-rule'), expect.stringContaining('no data file no-such-file.json')])
  })

  it('reads from, target, on and dependsOn as something other than references', () => {
    const skills = structuredClone(files['skills.json'])
    Object.assign((skills.skills as Records)[0], { from: 'core:nothing', target: 'save:all', on: 'core:nothing', dependsOn: 'ability:str' })
    expect(checkIntegrity({ ...files, 'skills.json': skills }).errors).toEqual([])
  })

  it("fails a class's spell list that names a spell whose header omits the class, unless an ambiguity covers it", () => {
    const classes = structuredClone(files['classes.json'])
    const spells = structuredClone(files['spells.json'])
    const wizard = (classes.classes as Records).find((c) => c.id === 'wizard')!
    const cure = (spells.spells as Records).find((s) => s.id === 'cure-wounds')!
    expect(cure.classes).not.toContain('wizard')
    ;(wizard.spellList as string[]).push('cure-wounds')
    expect(checkIntegrity({ ...files, 'classes.json': classes }).errors).toEqual([expect.stringContaining("wizard's spell list names cure-wounds")])

    ;(spells.ambiguities as { affects?: string[] }[]).push({ affects: ['spells:cure-wounds'] })
    const covered = checkIntegrity({ ...files, 'classes.json': classes, 'spells.json': spells })
    expect(covered.errors).toEqual([])
    expect(covered.notes).toContainEqual(expect.stringContaining("wizard's spell list names cure-wounds"))
  })
})
