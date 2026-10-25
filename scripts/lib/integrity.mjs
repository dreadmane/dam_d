// The cross-file integrity check, a port of the domain's own validator
// (domains/dnd-rules/data/validate.mjs) for the snapshot in data/rules/, so
// the build can run it where there is no workspace. Schema validation cannot
// see any of this, because a schema only knows its own file.
//
// 1. Every file is the public tier: meta.tier is srd, with a text policy and
//    the SRD's attribution. A books/ file here would be the private tier
//    leaking into the repo and the site (the spec §2.1).
// 2. Ids are unique within each list of records.
// 3. Every `<file>:<id>` string names a file in the snapshot and an id that
//    file holds. Four keys hold strings of that shape that are not
//    references: a choice's `from` is a query, an effect's `target` and `on`
//    are targets (save:all), and `dependsOn` names formula inputs
//    (ability:str).
// 4. Each class's spell list agrees with the spells' own class lists, both
//    ways. A disagreement the SRD itself prints is recorded as an ambiguity
//    whose `affects` names the spell; that one is reported, not failed.
//
// `files` is keyed by file name, `classes.json`; a reference names the file
// without its extension.

const NOT_REFERENCES = new Set(['from', 'target', 'on', 'dependsOn'])
const REFERENCE = /^([a-z-]+):([a-z0-9]+(?:-[a-z0-9]+)*)$/
const TEXT_POLICIES = new Set(['srd-verbatim', 'restated'])

function walk(node, at, visit, key) {
  visit(node, at, key)
  if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${at}/${i}`, visit, key))
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, `${at}/${k}`, visit, k)
}

// Every id anywhere in a file, as the domain's validator collects them: a
// reference may name a nested record (a subclass, a trait, a feature).
function collectIds(node, set) {
  if (Array.isArray(node)) node.forEach((n) => collectIds(n, set))
  else if (node && typeof node === 'object') {
    if (typeof node.id === 'string') set.add(node.id)
    Object.values(node).forEach((v) => collectIds(v, set))
  }
  return set
}

export function checkIntegrity(files) {
  const errors = []
  const notes = []
  let checked = 0

  const byName = new Map(Object.entries(files).map(([name, json]) => [name.replace(/\.json$/, ''), json]))
  const ids = new Map([...byName].map(([name, json]) => [name, collectIds(json, new Set())]))

  for (const [name, data] of byName) {
    const where = `${name}.json`
    const meta = data?.meta ?? {}
    if (meta.tier !== 'srd') errors.push(`${where}: meta.tier is ${meta.tier}; only the srd tier ships in this repo`)
    if (!TEXT_POLICIES.has(meta.textPolicy)) errors.push(`${where}: meta.textPolicy is ${meta.textPolicy}`)
    if (typeof meta.attribution !== 'string' || !meta.attribution.trim()) errors.push(`${where}: no meta.attribution, which every srd file carries`)

    walk(data, '', (node, at) => {
      if (!Array.isArray(node)) return
      const seen = new Set()
      for (const r of node) {
        if (!r || typeof r !== 'object' || typeof r.id !== 'string') continue
        if (seen.has(r.id)) errors.push(`${where}: ${at} has id ${r.id} twice`)
        seen.add(r.id)
      }
    })

    walk(data, '', (node, at, key) => {
      if (typeof node !== 'string' || NOT_REFERENCES.has(key)) return
      const m = REFERENCE.exec(node)
      if (!m) return
      const [, file, id] = m
      checked++
      if (!ids.has(file)) errors.push(`${where}: ${at} ${node}: no data file ${file}.json`)
      else if (!ids.get(file).has(id)) errors.push(`${where}: ${at} ${node}: ${file}.json has no id ${id}`)
    })
  }

  const classes = byName.get('classes')
  const spells = byName.get('spells')
  if (classes && spells) {
    const covered = new Set((spells.ambiguities ?? []).flatMap((a) => a.affects ?? []))
    const mismatch = (sid, msg) => (covered.has(`spells:${sid}`) ? notes : errors).push(msg)
    const byId = new Map((spells.spells ?? []).map((s) => [s.id, s]))
    for (const c of classes.classes ?? []) {
      for (const sid of c.spellList ?? []) {
        checked++
        const s = byId.get(sid)
        if (!s) errors.push(`classes.json: ${c.id}'s spell list names ${sid}, which spells.json does not hold`)
        else if (!(s.classes ?? []).includes(c.id)) mismatch(sid, `${c.id}'s spell list names ${sid}, whose header omits ${c.id}`)
      }
    }
    const listed = new Map((classes.classes ?? []).map((c) => [c.id, new Set(c.spellList ?? [])]))
    for (const s of spells.spells ?? []) {
      for (const cid of s.classes ?? []) {
        checked++
        const list = listed.get(cid)
        if (list && list.size && !list.has(s.id)) mismatch(s.id, `${s.id}'s header names ${cid}, whose spell list omits it`)
      }
    }
  }

  return { errors, notes, checked }
}
