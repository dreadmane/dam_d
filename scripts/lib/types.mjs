// Generates src/rules/types.ts from the snapshot's JSON Schemas. Types are
// generated rather than hand-written because hand-written types drift from
// the data (platform conventions).
//
// All schemas compile in one pass, through a synthetic root that $refs each
// one, so the definitions they share from common.schema.json (Source,
// Confidence, Meta…) are emitted once instead of once per file.

import fs from 'node:fs'
import path from 'node:path'
import { compile } from 'json-schema-to-typescript'
import { REPO_ROOT, SNAPSHOT_DIR } from './rules-data.mjs'

export const TYPES_FILE = path.join(REPO_ROOT, 'src', 'rules', 'types.ts')

const BANNER = `/* eslint-disable */
// Generated from data/rules/schemas by \`npm run gen-types\` (sync-data runs it
// too). Do not edit: change the schema in the workspace, then re-sync.`

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())

export async function generateTypes() {
  const schemaDir = path.join(SNAPSHOT_DIR, 'schemas')
  const schemaFiles = fs
    .readdirSync(schemaDir)
    .filter((f) => f.endsWith('.schema.json') && f !== 'common.schema.json')
    .sort()

  // Each data file's root type is named after the file (skills.json →
  // SkillsData), not after its schema's long descriptive title.
  const rootNames = new Map(schemaFiles.map((f) => [f, pascal(f.replace('.schema.json', '')) + 'Data']))
  const root = {
    description: 'Every rules data file in data/rules/, keyed by file name without .json.',
    type: 'object',
    additionalProperties: false,
    properties: Object.fromEntries(schemaFiles.map((f) => [f.replace('.schema.json', ''), { $ref: f }])),
    required: schemaFiles.map((f) => f.replace('.schema.json', '')),
  }

  const ts = await compile(root, 'RulesData', {
    cwd: schemaDir,
    bannerComment: BANNER,
    additionalProperties: false,
    customName: (schema) => rootNames.get(schema.$id),
    style: { semi: false, singleQuote: true, printWidth: 100 },
  })
  fs.mkdirSync(path.dirname(TYPES_FILE), { recursive: true })
  fs.writeFileSync(TYPES_FILE, ts)
  return { file: path.relative(REPO_ROOT, TYPES_FILE), roots: [...rootNames.values()] }
}

// The save format's types, from the newest schema in src/save/schemas. Older
// versions' schemas stay beside it, frozen, for validating their fixtures;
// only the current version needs types, because migrations read raw JSON.
export const SAVE_SCHEMA_DIR = path.join(REPO_ROOT, 'src', 'save', 'schemas')
export const SAVE_TYPES_FILE = path.join(REPO_ROOT, 'src', 'save', 'types.ts')

const SAVE_BANNER = `/* eslint-disable */
// Generated from src/save/schemas by \`npm run gen-types\`. Do not edit: change
// the schema, then regenerate. A test fails if this file is out of date.`

export function currentSaveSchema() {
  const versions = fs
    .readdirSync(SAVE_SCHEMA_DIR)
    .map((f) => /^roster-v(\d+)\.schema\.json$/.exec(f))
    .filter(Boolean)
    .map((m) => ({ file: m[0], version: Number(m[1]) }))
    .sort((a, b) => a.version - b.version)
  return versions.at(-1)
}

export async function saveTypesSource() {
  const { file } = currentSaveSchema()
  const schema = JSON.parse(fs.readFileSync(path.join(SAVE_SCHEMA_DIR, file), 'utf8'))
  return compile(schema, 'RosterRecord', {
    cwd: SAVE_SCHEMA_DIR,
    bannerComment: SAVE_BANNER,
    additionalProperties: false,
    style: { semi: false, singleQuote: true, printWidth: 100 },
  })
}

export async function generateSaveTypes() {
  fs.writeFileSync(SAVE_TYPES_FILE, await saveTypesSource())
  return { file: path.relative(REPO_ROOT, SAVE_TYPES_FILE), schema: currentSaveSchema().file }
}
