// Reading the form fields out of a PDF, for importing a character from the
// sheet D&D Beyond exports: every field's name and value, in page order. It
// is our own reader rather than a library (user, 2026-10-24) because names
// and values are a small corner of the PDF format.
//
// How a PDF is laid out, as far as this reader needs to know:
//
// - A header line, `%PDF-1.7`, then a run of numbered objects, each written
//   `12 0 obj ... endobj`: object 12, generation 0. An object is a number, a
//   string `(text)` or `<hex>`, a name `/Widget`, an array `[ ... ]`, a
//   dictionary `<< /Key value ... >>`, or a reference `12 0 R` to another
//   object.
// - A dictionary followed by `stream ... endstream` carries raw bytes: a
//   page's drawing instructions or an image, usually compressed. Those bytes
//   can be anything, `endobj` included, so the scanner jumps over them by the
//   length the dictionary gives (/Length) and never reads them as syntax.
// - At the end come a cross-reference table, saying where each object
//   starts, and a trailer dictionary naming the root object, the catalog.
//   This reader skips the table and finds the objects by scanning the file,
//   which is simpler and also copes with a table that is wrong.
// - The catalog's /Pages is the page tree: nodes with /Kids, down to the
//   pages. Each page lists its annotations (/Annots), and each box of a form
//   field on the page is an annotation of subtype /Widget, with the field's
//   name in /T and its value in /V. D&D Beyond's export has no /AcroForm,
//   the catalog's list of form fields that most readers start from, so the
//   fields are found from the pages instead.
// - A program that saves the file again may append its changes rather than
//   rewrite the file (an incremental update), so an object can be defined
//   twice and the later definition counts. It may also pack small objects
//   into a compressed object stream (/Type /ObjStm), unpacked here.
//
// The export's overflow pages reuse the first pages' field names with other
// values, so the result is a list in page order, never a name-to-value map.

export interface PdfField {
  page: number // 1-based, in page-tree order
  name: string // the field's /T, decoded
  value: string // the /V decoded; '' when absent; a name like /Off as 'Off'
}

export type PdfFieldsResult =
  | { ok: true; fields: PdfField[] }
  | { ok: false; reason: 'not-pdf' | 'no-fields' | 'unreadable' }

export async function readPdfFields(bytes: Uint8Array): Promise<PdfFieldsResult> {
  // The spec allows up to 1024 bytes of anything before the header.
  const header = find(bytes, ascii('%PDF-'), 0, 1024 + 5)
  if (header === -1) return { ok: false, reason: 'not-pdf' }
  try {
    const file = await readObjects(bytes, header)
    const fields = file && fieldsOf(file)
    if (!fields) return { ok: false, reason: 'unreadable' }
    return fields.length ? { ok: true, fields } : { ok: false, reason: 'no-fields' }
  } catch {
    // Whatever defeats the parser, from a truncated file to a nesting deep
    // enough to overflow the stack, is an unreadable file, not a crash.
    return { ok: false, reason: 'unreadable' }
  }
}

// ---- The objects a PDF is made of ----

interface PdfName { kind: 'name'; name: string }
// A string's raw bytes: whether they are UTF-16 or PDFDocEncoding is decided
// only when one is read as text.
interface PdfString { kind: 'string'; bytes: Uint8Array }
interface PdfRef { kind: 'ref'; num: number; gen: number }
interface PdfArray { kind: 'array'; items: PdfValue[] }
interface PdfDict { kind: 'dict'; entries: Map<string, PdfValue> }
interface PdfStream { kind: 'stream'; dict: PdfDict; data: Uint8Array }
type Tagged = PdfName | PdfString | PdfRef | PdfArray | PdfDict | PdfStream
type PdfValue = null | boolean | number | Tagged

function is<K extends Tagged['kind']>(value: PdfValue | undefined, kind: K): value is Extract<Tagged, { kind: K }> {
  return typeof value === 'object' && value !== null && value.kind === kind
}

class ParseError extends Error {}

// Every byte is whitespace, a delimiter, or a regular character; a run of
// regular characters is one token (a number, a keyword, the rest of a name).
const REGULAR = 0
const WHITE = 1
const DELIMITER = 2
const CLASS = new Uint8Array(256)
for (const b of [0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]) CLASS[b] = WHITE
for (const c of '()<>[]{}/%') CLASS[c.charCodeAt(0)] = DELIMITER
// Past the end of the file counts as whitespace, so a token can end there.
const classAt = (bytes: Uint8Array, i: number) => (i < bytes.length ? CLASS[bytes[i]] : WHITE)
const isDigit = (b: number) => b >= 0x30 && b <= 0x39

const LF = 0x0a
const CR = 0x0d
const LPAREN = 0x28
const RPAREN = 0x29
const LT = 0x3c
const GT = 0x3e
const SLASH = 0x2f
const BACKSLASH = 0x5c

// Reads one object's syntax from the bytes, starting at `pos` and leaving
// `pos` just past what it read. It works on the bytes themselves, not a
// decoded string, so every position is a byte offset into the file.
class Parser {
  bytes: Uint8Array
  pos: number

  constructor(bytes: Uint8Array, pos: number) {
    this.bytes = bytes
    this.pos = pos
  }

  // Whitespace and comments (% to the end of the line) separate tokens.
  skipSpace(): void {
    const bytes = this.bytes
    while (this.pos < bytes.length) {
      const b = bytes[this.pos]
      if (CLASS[b] === WHITE) this.pos++
      else if (b === 0x25) while (this.pos < bytes.length && bytes[this.pos] !== LF && bytes[this.pos] !== CR) this.pos++
      else return
    }
  }

  // Consumes the keyword `word` (stream, endobj…) if it comes next.
  keyword(word: string): boolean {
    this.skipSpace()
    const start = this.pos
    if (this.word() === word) return true
    this.pos = start
    return false
  }

  value(): PdfValue {
    this.skipSpace()
    if (this.pos >= this.bytes.length) throw new ParseError('unexpected end of file')
    switch (this.bytes[this.pos]) {
      case LT:
        return this.bytes[this.pos + 1] === LT ? this.dict() : this.hexString()
      case 0x5b:
        return this.array()
      case LPAREN:
        return this.literalString()
      case SLASH:
        return this.name()
    }
    const start = this.pos
    const word = this.word()
    if (word === 'true') return true
    if (word === 'false') return false
    if (word === 'null') return null
    const n = Number(word)
    if (word === '' || !Number.isFinite(n)) throw new ParseError(`unexpected ${word || 'delimiter'} at byte ${start}`)
    // A whole number may be the first part of a reference, `12 0 R`.
    if (/^\d+$/.test(word)) return this.referenceAfter(n) ?? n
    return n
  }

  // A whole number that must come next: an object number or an offset.
  integer(): number {
    const n = this.value()
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) throw new ParseError(`expected a whole number at byte ${this.pos}`)
    return n
  }

  private word(): string {
    const start = this.pos
    while (this.pos < this.bytes.length && CLASS[this.bytes[this.pos]] === REGULAR) this.pos++
    return latin1(this.bytes, start, this.pos)
  }

  // After an object number: a generation number and R make a reference.
  // Anything else is put back, and the number was just a number.
  private referenceAfter(num: number): PdfRef | null {
    const start = this.pos
    this.skipSpace()
    const genStart = this.pos
    while (this.pos < this.bytes.length && isDigit(this.bytes[this.pos])) this.pos++
    if (this.pos > genStart && classAt(this.bytes, this.pos) !== REGULAR) {
      const gen = Number(latin1(this.bytes, genStart, this.pos))
      this.skipSpace()
      if (this.bytes[this.pos] === 0x52 && classAt(this.bytes, this.pos + 1) !== REGULAR) {
        this.pos++
        return { kind: 'ref', num, gen }
      }
    }
    this.pos = start
    return null
  }

  private dict(): PdfDict {
    this.pos += 2
    const entries = new Map<string, PdfValue>()
    for (;;) {
      this.skipSpace()
      if (this.bytes[this.pos] === GT && this.bytes[this.pos + 1] === GT) {
        this.pos += 2
        return { kind: 'dict', entries }
      }
      if (this.bytes[this.pos] !== SLASH) throw new ParseError(`expected a key at byte ${this.pos}`)
      const key = this.name().name
      entries.set(key, this.value())
    }
  }

  private array(): PdfArray {
    this.pos++
    const items: PdfValue[] = []
    for (;;) {
      this.skipSpace()
      if (this.bytes[this.pos] === 0x5d) {
        this.pos++
        return { kind: 'array', items }
      }
      items.push(this.value())
    }
  }

  // A name, with each #xx read as the byte xx: /On#20it is "On it". Its
  // bytes are UTF-8 by convention, and Latin-1 when they are not valid UTF-8.
  private name(): PdfName {
    const bytes = this.bytes
    const out: number[] = []
    this.pos++
    while (this.pos < bytes.length && CLASS[bytes[this.pos]] === REGULAR) {
      const b = bytes[this.pos++]
      const hi = b === 0x23 ? hexDigit(bytes[this.pos]) : -1
      const lo = hi >= 0 ? hexDigit(bytes[this.pos + 1]) : -1
      if (lo >= 0) {
        out.push(hi * 16 + lo)
        this.pos += 2
      } else out.push(b)
    }
    const raw = Uint8Array.from(out)
    try {
      return { kind: 'name', name: new TextDecoder('utf-8', { fatal: true }).decode(raw) }
    } catch {
      return { kind: 'name', name: latin1(raw, 0, raw.length) }
    }
  }

  // A literal string, `(...)`. Balanced parentheses inside it are part of
  // the text; a backslash escapes a character, gives a byte in octal (\101
  // is A), or before a line break joins the lines; and a bare CR or CRLF
  // reads as LF, so line breaks come out the same whatever wrote the file.
  private literalString(): PdfString {
    const bytes = this.bytes
    const out: number[] = []
    let depth = 1
    let i = this.pos + 1
    for (;;) {
      if (i >= bytes.length) throw new ParseError('unterminated string')
      let b = bytes[i++]
      if (b === LPAREN) depth++
      else if (b === RPAREN) {
        if (--depth === 0) break
      } else if (b === CR) {
        if (bytes[i] === LF) i++
        b = LF
      } else if (b === BACKSLASH) {
        if (i >= bytes.length) throw new ParseError('unterminated string')
        const e = bytes[i++]
        if (e === 0x6e) b = LF // \n
        else if (e === 0x72) b = CR // \r
        else if (e === 0x74) b = 0x09 // \t
        else if (e === 0x62) b = 0x08 // \b
        else if (e === 0x66) b = 0x0c // \f
        else if (e === CR || e === LF) {
          // A continuation: the backslash and the line break both vanish.
          if (e === CR && bytes[i] === LF) i++
          continue
        } else if (e >= 0x30 && e <= 0x37) {
          // One to three octal digits; a fourth digit is ordinary text.
          let code = e - 0x30
          for (let k = 0; k < 2 && bytes[i] >= 0x30 && bytes[i] <= 0x37; k++) code = code * 8 + bytes[i++] - 0x30
          b = code & 0xff
        } else b = e // \( \) \\, and a backslash before anything else is dropped
      }
      out.push(b)
    }
    this.pos = i
    return { kind: 'string', bytes: Uint8Array.from(out) }
  }

  // A hex string, `<48 69>`: two digits a byte, whitespace ignored, and an
  // odd last digit read as if followed by 0.
  private hexString(): PdfString {
    const bytes = this.bytes
    const out: number[] = []
    let high = -1
    let i = this.pos + 1
    for (;;) {
      if (i >= bytes.length) throw new ParseError('unterminated hex string')
      const b = bytes[i++]
      if (b === GT) break
      if (CLASS[b] === WHITE) continue
      const d = hexDigit(b)
      if (d < 0) throw new ParseError(`not a hex digit at byte ${i - 1}`)
      if (high < 0) high = d
      else {
        out.push(high * 16 + d)
        high = -1
      }
    }
    if (high >= 0) out.push(high * 16)
    this.pos = i
    return { kind: 'string', bytes: Uint8Array.from(out) }
  }
}

function hexDigit(b: number | undefined): number {
  if (b === undefined) return -1
  if (b >= 0x30 && b <= 0x39) return b - 0x30
  if (b >= 0x41 && b <= 0x46) return b - 0x41 + 10
  if (b >= 0x61 && b <= 0x66) return b - 0x61 + 10
  return -1
}

// ---- Finding the objects in the file ----

// Each object's latest definition, and where in the file it was made, so a
// later definition can replace an earlier one.
interface Defined { at: number; value: PdfValue }

interface PdfFile {
  objects: Map<number, Defined>
  root: PdfRef
}

const OBJ = ascii('obj')
const ENDSTREAM = ascii('endstream')
const TRAILER = ascii('trailer')

// One pass through the file, front to back: each `N G obj` header found,
// the object after it parsed, its stream jumped over, and the search
// resumed after it. The gaps between objects hold the cross-reference
// tables and the trailers, and only the trailers are read from them.
async function readObjects(bytes: Uint8Array, from: number): Promise<PdfFile | null> {
  const objects = new Map<number, Defined>()
  // The trailer dictionaries, and the dictionaries of cross-reference streams
  // (which replace the trailer in a file with object streams), in file order.
  const trailers: PdfDict[] = []
  const objectStreams: Array<{ at: number; stream: PdfStream }> = []

  let pos = from
  for (;;) {
    const header = nextHeader(bytes, pos)
    trailers.push(...trailersIn(bytes, pos, header ? header.start : bytes.length))
    if (!header) break
    try {
      const parser = new Parser(bytes, header.body)
      let value = parser.value()
      if (is(value, 'dict') && parser.keyword('stream')) value = readStream(parser, value)
      parser.keyword('endobj') // a missing endobj is tolerated: the next header starts the next object
      objects.set(header.num, { at: header.start, value })
      if (is(value, 'stream')) {
        const type = value.dict.entries.get('Type')
        if (is(type, 'name') && type.name === 'ObjStm') objectStreams.push({ at: header.start, stream: value })
        if (is(type, 'name') && type.name === 'XRef') trailers.push(value.dict)
      }
      pos = parser.pos
    } catch (e) {
      if (!(e instanceof ParseError)) throw e
      // Not an object after all, or a broken one: look past its header.
      pos = header.body
    }
  }

  // An object packed in an object stream is defined where that stream is,
  // so the last-definition-wins rule applies to it like any other.
  for (const { at, stream } of objectStreams) {
    for (const [num, value] of await unpackObjectStream(stream)) {
      const existing = objects.get(num)
      if (!existing || existing.at <= at) objects.set(num, { at, value })
    }
  }

  // An encrypted file's strings are ciphertext, so its values cannot be read.
  if (trailers.some((t) => t.entries.has('Encrypt'))) return null
  // The latest trailer that names a root is the one in force.
  for (let i = trailers.length - 1; i >= 0; i--) {
    const root = trailers[i].entries.get('Root')
    if (is(root, 'ref')) return { objects, root }
  }
  return null
}

// The next `N G obj` at or after `from`. "obj" alone is found first, then
// checked backwards for the two numbers before it, which rules out endobj
// and any other word that merely ends in "obj".
function nextHeader(bytes: Uint8Array, from: number): { num: number; start: number; body: number } | null {
  for (let i = find(bytes, OBJ, from); i !== -1; i = find(bytes, OBJ, i + 1)) {
    if (classAt(bytes, i + 3) === REGULAR) continue
    let j = i - 1
    if (j < 0 || CLASS[bytes[j]] !== WHITE) continue
    while (j >= 0 && CLASS[bytes[j]] === WHITE) j--
    const genEnd = j + 1
    while (j >= 0 && isDigit(bytes[j])) j--
    if (j + 1 === genEnd || j < 0 || CLASS[bytes[j]] !== WHITE) continue
    while (j >= 0 && CLASS[bytes[j]] === WHITE) j--
    const numEnd = j + 1
    while (j >= 0 && isDigit(bytes[j])) j--
    if (j + 1 === numEnd || (j >= 0 && CLASS[bytes[j]] === REGULAR)) continue
    return { num: Number(latin1(bytes, j + 1, numEnd)), start: j + 1, body: i + 3 }
  }
  return null
}

function trailersIn(bytes: Uint8Array, from: number, to: number): PdfDict[] {
  const found: PdfDict[] = []
  for (let i = find(bytes, TRAILER, from, to); i !== -1; i = find(bytes, TRAILER, i + 1, to)) {
    try {
      const value = new Parser(bytes, i + TRAILER.length).value()
      if (is(value, 'dict')) found.push(value)
    } catch (e) {
      if (!(e instanceof ParseError)) throw e
    }
  }
  return found
}

// A stream's bytes start after the end of line that follows `stream`. With
// a /Length written as a plain number, they are that many bytes, provided
// `endstream` really comes next. A /Length that is a reference to another
// object, or a wrong one, falls back to the next `endstream`, less the end
// of line before it.
function readStream(parser: Parser, dict: PdfDict): PdfStream {
  const bytes = parser.bytes
  let start = parser.pos
  if (bytes[start] === CR) start++
  if (bytes[start] === LF) start++
  const length = dict.entries.get('Length')
  if (typeof length === 'number' && Number.isInteger(length) && length >= 0 && start + length <= bytes.length) {
    const after = new Parser(bytes, start + length)
    if (after.keyword('endstream')) {
      parser.pos = after.pos
      return { kind: 'stream', dict, data: bytes.subarray(start, start + length) }
    }
  }
  const at = find(bytes, ENDSTREAM, start)
  if (at === -1) throw new ParseError('unterminated stream')
  let end = at
  if (end > start && bytes[end - 1] === LF) end--
  if (end > start && bytes[end - 1] === CR) end--
  parser.pos = at + ENDSTREAM.length
  return { kind: 'stream', dict, data: bytes.subarray(start, end) }
}

// An object stream holds /N objects. Its decompressed bytes begin with N
// pairs of numbers, each an object number and where that object starts,
// counted from /First. Only FlateDecode, the one compression a writer
// uses for these in practice, is read; another is skipped.
async function unpackObjectStream(stream: PdfStream): Promise<Array<[number, PdfValue]>> {
  const filter = stream.dict.entries.get('Filter')
  const only = is(filter, 'array') && filter.items.length === 1 ? filter.items[0] : filter
  if (!is(only, 'name') || only.name !== 'FlateDecode') return []
  // A predictor (a pre-compression transform) would need undoing first, and
  // writers use one for cross-reference streams, not object streams.
  if (stream.dict.entries.has('DecodeParms')) return []
  const n = stream.dict.entries.get('N')
  const first = stream.dict.entries.get('First')
  if (typeof n !== 'number' || typeof first !== 'number') return []
  const data = await inflate(stream.data)
  if (!data) return []

  const unpacked: Array<[number, PdfValue]> = []
  try {
    const index = new Parser(data, 0)
    const offsets: Array<[number, number]> = []
    for (let k = 0; k < n; k++) offsets.push([index.integer(), index.integer()])
    for (const [num, offset] of offsets) unpacked.push([num, new Parser(data, first + offset).value()])
  } catch (e) {
    if (!(e instanceof ParseError)) throw e
  }
  return unpacked
}

// FlateDecode is zlib's deflate, which the platform's DecompressionStream
// reads (browsers, and Node 18 on). A stream whose stated length runs a byte
// or two long can make it fail at the very end, after all the real data has
// come out, so what came out before an error is kept.
async function inflate(data: Uint8Array): Promise<Uint8Array | null> {
  const reader = new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  const chunks: Uint8Array[] = []
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
  } catch {
    if (!chunks.length) return null
  }
  const out = new Uint8Array(chunks.reduce((total, c) => total + c.length, 0))
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

// ---- From the objects to the fields ----

// Follows references until a value that is not one. A reference to an
// object the file never defines is null, as the PDF spec says.
function resolve(file: PdfFile, value: PdfValue | undefined): PdfValue {
  for (let hops = 0; is(value, 'ref'); hops++) {
    if (hops > 32) throw new ParseError('a reference loops')
    value = file.objects.get(value.num)?.value
  }
  return value ?? null
}

function dictAt(file: PdfFile, value: PdfValue | undefined): PdfDict | null {
  const resolved = resolve(file, value)
  return is(resolved, 'dict') ? resolved : null
}

function fieldsOf(file: PdfFile): PdfField[] | null {
  const pages = dictAt(file, dictAt(file, file.root)?.entries.get('Pages'))
  if (!pages) return null
  const fields: PdfField[] = []
  for (const [index, page] of pagesInOrder(file, pages, new Set()).entries()) {
    // A page's /Annots may be the array itself or a reference to it.
    const annots = resolve(file, page.entries.get('Annots'))
    if (!is(annots, 'array')) continue
    for (const item of annots.items) {
      const widget = dictAt(file, item)
      const subtype = widget?.entries.get('Subtype')
      if (!widget || !is(subtype, 'name') || subtype.name !== 'Widget') continue
      const name = inherited(file, widget, 'T')
      if (!is(name, 'string')) continue
      fields.push({ page: index + 1, name: decodeText(name.bytes), value: valueText(file, inherited(file, widget, 'V')) })
    }
  }
  return fields
}

// The pages under a page-tree node, depth first: the order they are read
// in. A node is anything with /Kids; the leaves are the pages. A kid that
// cannot be found means the tree is broken, and the file unreadable.
function pagesInOrder(file: PdfFile, node: PdfDict, seen: Set<PdfDict>): PdfDict[] {
  if (seen.has(node)) return [] // a tree that loops back on itself
  seen.add(node)
  const kids = resolve(file, node.entries.get('Kids'))
  const type = node.entries.get('Type')
  if (!is(kids, 'array')) return is(type, 'name') && type.name === 'Pages' ? [] : [node]
  return kids.items.flatMap((kid) => {
    const child = dictAt(file, kid)
    if (!child) throw new ParseError('a page is missing')
    return pagesInOrder(file, child, seen)
  })
}

// A widget can be a box of a field defined on its /Parent, which then
// holds the name and the value: each is taken from the nearest dictionary
// up the chain that has it, the widget's own first.
function inherited(file: PdfFile, widget: PdfDict, key: string): PdfValue | undefined {
  let node: PdfDict | null = widget
  for (let depth = 0; node && depth < 32; depth++) {
    if (node.entries.has(key)) return resolve(file, node.entries.get(key))
    node = dictAt(file, node.entries.get('Parent'))
  }
  return undefined
}

function valueText(file: PdfFile, value: PdfValue | undefined): string {
  if (is(value, 'string')) return decodeText(value.bytes)
  // A checkbox's value is a name, /Off or the box's own "on" name.
  if (is(value, 'name')) return value.name
  if (typeof value === 'number') return String(value)
  // A list box with several choices made holds them in an array.
  if (is(value, 'array')) return value.items.map((v) => valueText(file, resolve(file, v))).filter(Boolean).join(', ')
  return ''
}

// ---- Text ----

// A PDF text string is UTF-16BE when it starts with the byte-order mark FE
// FF, UTF-8 when it starts with EF BB BF (allowed from PDF 2.0), and
// PDFDocEncoding otherwise.
function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let text = ''
    // Two bytes a code unit; a character beyond U+FFFF is a surrogate pair,
    // which a JavaScript string holds the same way.
    for (let i = 2; i + 1 < bytes.length; i += 2) text += String.fromCharCode((bytes[i] << 8) | bytes[i + 1])
    return text
  }
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return new TextDecoder('utf-8').decode(bytes.subarray(3))
  let text = ''
  for (const b of bytes) text += PDF_DOC_CHARS[b]
  return text
}

// PDFDocEncoding, the PDF's own one-byte text encoding (PDF 1.7, Annex D,
// Table D.2), is Latin-1 except for these bytes. The bytes it leaves
// undefined (0x7F, 0x9F, 0xAD) pass through as Latin-1.
const PDF_DOC_ENCODING: Record<number, number> = {
  // ˘ ˇ ˆ ˙ ˝ ˛ ˚ ˜: breve, caron, circumflex, dot above, double acute, ogonek, ring, small tilde
  0x18: 0x02d8, 0x19: 0x02c7, 0x1a: 0x02c6, 0x1b: 0x02d9, 0x1c: 0x02dd, 0x1d: 0x02db, 0x1e: 0x02da, 0x1f: 0x02dc,
  // • † ‡ … — – ƒ ⁄: bullet, dagger, double dagger, ellipsis, em dash, en dash, florin, fraction slash
  0x80: 0x2022, 0x81: 0x2020, 0x82: 0x2021, 0x83: 0x2026, 0x84: 0x2014, 0x85: 0x2013, 0x86: 0x0192, 0x87: 0x2044,
  // ‹ › − ‰ „ “ ” ‘: single guillemets, minus, per mille, low double quote, curly double and single quotes
  0x88: 0x2039, 0x89: 0x203a, 0x8a: 0x2212, 0x8b: 0x2030, 0x8c: 0x201e, 0x8d: 0x201c, 0x8e: 0x201d, 0x8f: 0x2018,
  // ’ ‚ ™ ﬁ ﬂ Ł Œ Š: right single quote, low single quote, trade mark, fi and fl ligatures, L stroke, OE, S caron
  0x90: 0x2019, 0x91: 0x201a, 0x92: 0x2122, 0x93: 0xfb01, 0x94: 0xfb02, 0x95: 0x0141, 0x96: 0x0152, 0x97: 0x0160,
  // Ÿ Ž ı ł œ š ž €: Y diaeresis, Z caron, dotless i, l stroke, oe, s caron, z caron, euro
  0x98: 0x0178, 0x99: 0x017d, 0x9a: 0x0131, 0x9b: 0x0142, 0x9c: 0x0153, 0x9d: 0x0161, 0x9e: 0x017e, 0xa0: 0x20ac,
}
const PDF_DOC_CHARS = Array.from({ length: 256 }, (_, b) => String.fromCharCode(PDF_DOC_ENCODING[b] ?? b))

// ---- Bytes ----

function ascii(text: string): Uint8Array {
  return Uint8Array.from(text, (c) => c.charCodeAt(0))
}

// Bytes as one character each, for the short runs that are keywords and numbers.
function latin1(bytes: Uint8Array, start: number, end: number): string {
  let text = ''
  for (let i = start; i < end; i++) text += String.fromCharCode(bytes[i])
  return text
}

// Where `pattern` first occurs in bytes[from, to), or -1. Uint8Array's own
// indexOf finds each candidate first byte quickly, which keeps a scan of a
// few megabytes well under a second.
function find(bytes: Uint8Array, pattern: Uint8Array, from: number, to = bytes.length): number {
  const view = bytes.subarray(0, Math.min(to, bytes.length))
  for (let i = view.indexOf(pattern[0], from); i !== -1 && i + pattern.length <= view.length; i = view.indexOf(pattern[0], i + 1)) {
    let k = 1
    while (k < pattern.length && view[i + k] === pattern[k]) k++
    if (k === pattern.length) return i
  }
  return -1
}
