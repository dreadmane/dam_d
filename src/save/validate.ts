// Checks a record against a save schema before an import is saved. Hand-rolled
// rather than shipping ajv's runtime (chosen 2026-09-27: ~2 KB against ~9 KB
// gzipped). It understands exactly the keywords the save schemas use and
// throws on any other, so a schema that grows a new keyword fails loudly
// instead of going unchecked. validate.test.ts runs it beside ajv on every
// fixture and on hundreds of broken copies, and fails if they ever disagree.

type Schema = Record<string, unknown>

export interface ValidationError {
  // Where in the record, as a readable path: entities[0].abilities.base.str
  path: string
  message: string
}

// Keywords that describe rather than constrain.
const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', '$defs'])
const CONSTRAINTS = new Set([
  'type', 'const', 'enum', 'properties', 'required', 'additionalProperties',
  'items', 'minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'format', 'anyOf', '$ref',
])

export function validate(schema: Schema, value: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  check(schema, value, '', schema, errors)
  return errors
}

function check(schema: Schema, value: unknown, path: string, root: Schema, errors: ValidationError[]) {
  for (const key of Object.keys(schema)) {
    if (!ANNOTATIONS.has(key) && !CONSTRAINTS.has(key)) {
      throw new Error(`The save validator does not support the schema keyword "${key}" (at ${path || 'the root'})`)
    }
  }
  const at = path || 'the record'
  const fail = (message: string) => errors.push({ path: at, message })

  if (typeof schema.$ref === 'string') {
    const m = /^#\/\$defs\/(.+)$/.exec(schema.$ref)
    const target = m && (root.$defs as Record<string, Schema> | undefined)?.[m[1]]
    if (!target) throw new Error(`Unresolvable $ref ${schema.$ref}`)
    check(target, value, path, root, errors)
  }

  if (Array.isArray(schema.anyOf)) {
    const matches = (schema.anyOf as Schema[]).some((sub) => validate({ ...sub, $defs: root.$defs }, value).length === 0)
    if (!matches) fail('is not any of the allowed shapes')
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type as string]
    if (!types.some((t) => isType(value, t))) {
      fail(`should be ${types.join(' or ')}, not ${describe(value)}`)
      return
    }
  }

  if ('const' in schema && !deepEqual(value, schema.const)) fail(`should be ${JSON.stringify(schema.const)}`)
  if (Array.isArray(schema.enum) && !schema.enum.some((v) => deepEqual(value, v))) {
    fail(`should be one of ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}`)
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) fail(`should be at least ${schema.minimum}`)
    if (typeof schema.maximum === 'number' && value > schema.maximum) fail(`should be at most ${schema.maximum}`)
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && codePoints(value) < schema.minLength) {
      fail(schema.minLength === 1 ? 'should not be empty' : `should be at least ${schema.minLength} characters`)
    }
    if (typeof schema.maxLength === 'number' && codePoints(value) > schema.maxLength) {
      fail(`should be at most ${schema.maxLength} characters`)
    }
    // Unanchored, and with the u flag, as JSON Schema and ajv read a pattern.
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      fail('is not in the expected form')
    }
    if (schema.format === 'date-time' && !isDateTime(value)) fail('should be a date and time with a time zone')
    else if (schema.format !== undefined && schema.format !== 'date-time') {
      throw new Error(`The save validator does not support the format "${String(schema.format)}"`)
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      fail(`should have at least ${schema.minItems} item${schema.minItems === 1 ? '' : 's'}`)
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      fail(`should have at most ${schema.maxItems} item${schema.maxItems === 1 ? '' : 's'}`)
    }
    if (schema.items && typeof schema.items === 'object') {
      value.forEach((item, i) => check(schema.items as Schema, item, `${path}[${i}]`, root, errors))
    }
  }

  if (isPlainObject(value)) {
    const props = (schema.properties ?? {}) as Record<string, Schema>
    for (const name of (schema.required ?? []) as string[]) {
      if (!(name in value)) errors.push({ path: at, message: `is missing ${name}` })
    }
    for (const [name, child] of Object.entries(value)) {
      const childPath = path ? `${path}.${name}` : name
      if (name in props) check(props[name], child, childPath, root, errors)
      else if (schema.additionalProperties === false) errors.push({ path: childPath, message: 'is not a field this format has' })
      else if (isPlainObject(schema.additionalProperties)) check(schema.additionalProperties as Schema, child, childPath, root, errors)
    }
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isType(v: unknown, type: string): boolean {
  switch (type) {
    case 'null':
      return v === null
    case 'boolean':
      return typeof v === 'boolean'
    case 'string':
      return typeof v === 'string'
    case 'number':
      return typeof v === 'number' && Number.isFinite(v)
    case 'integer':
      return typeof v === 'number' && Number.isInteger(v)
    case 'array':
      return Array.isArray(v)
    case 'object':
      return isPlainObject(v)
    default:
      throw new Error(`Unknown schema type ${type}`)
  }
}

function describe(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'a list'
  if (typeof v === 'number' && !Number.isInteger(v)) return 'a fractional number'
  return typeof v === 'object' ? 'an object' : `a ${typeof v}`
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]))
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a)
    return ka.length === Object.keys(b).length && ka.every((k) => k in b && deepEqual(a[k], b[k]))
  }
  return false
}

// JSON Schema counts characters as code points, not UTF-16 units.
function codePoints(s: string): number {
  return [...s].length
}

// RFC 3339 date-time with a required time zone, as ajv-formats checks it,
// leap seconds included.
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/
const TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isDateTime(s: string): boolean {
  const parts = s.split(/t|\s/i)
  return parts.length === 2 && isDate(parts[0]) && isTime(parts[1])
}

function isDate(s: string): boolean {
  const m = DATE.exec(s)
  if (!m) return false
  const [year, month, day] = [+m[1], +m[2], +m[3]]
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && leap ? 29 : DAYS[month])
}

function isTime(s: string): boolean {
  const m = TIME.exec(s)
  if (!m) return false
  const [hr, min, sec] = [+m[1], +m[2], +m[3]]
  const tz = m[4]
  const sign = m[5] === '-' ? -1 : 1
  const tzH = +(m[6] || 0)
  const tzM = +(m[7] || 0)
  if (tzH > 23 || tzM > 59 || !tz) return false
  if (hr <= 23 && min <= 59 && sec < 60) return true
  const utcMin = min - tzM * sign
  const utcHr = hr - tzH * sign - (utcMin < 0 ? 1 : 0)
  return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61
}
